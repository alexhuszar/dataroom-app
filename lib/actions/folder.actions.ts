"use server"

import {
  db,
  FolderDocument,
  STORES,
} from "@/lib/db/indexeddb"
import { fileStorage } from "@/lib/db/fileStorage"
import { generateId, parseStringify } from "@/lib/utils/general"
import { revalidatePath } from "next/cache"
import { updateTimestamp, withTimestamps } from "../utils/date"

const handleError = (error: unknown, message: string): never => {
  console.error(message, error)
  throw error
}

// Validate folder name for duplicates in same parent
export const validateFolderName = async ({
  name,
  parentId,
  ownerId,
  excludeFolderId,
}: {
  name: string
  parentId: string | null
  ownerId: string
  excludeFolderId?: string
}) => {
  try {
    await db.init()

    const userFolders = await db.getAllFoldersByUser(ownerId)
    const siblingFolders = userFolders.filter(
      f =>
        f.parentId === parentId &&
        f.id !== excludeFolderId
    )

    return !siblingFolders.some(
      f => f.name.toLowerCase() === name.toLowerCase()
    )
  } catch (error) {
    handleError(error, "Failed to validate folder name")
  }
}

// Create new folder
export const createFolder = async ({
  name,
  parentId,
  ownerId,
  accountId,
  path,
}: CreateFolderProps) => {
  try {
    await db.init()

    const isValid = await validateFolderName({ name, parentId, ownerId })
    if (!isValid) {
      throw new Error(
        `A folder named "${name}" already exists in this location`
      )
    }

    const folder: FolderDocument = withTimestamps({
      id: generateId(),
      name,
      parentId,
      owner: ownerId,
      accountId,
    })

    await db.add(STORES.FOLDERS, folder)
    revalidatePath(path)
    return parseStringify(folder)
  } catch (error) {
    handleError(error, "Failed to create folder")
  }
}

// Get folders in a specific parent
export const getFolders = async ({
  parentId,
  ownerId,
  accountId,
}: {
  parentId: string | null
  ownerId: string
  accountId: string
}) => {
  try {
    await db.init()

    const userFolders = await db.getAllFoldersByUser(ownerId)
    const folders = userFolders.filter(
      f =>
        f.parentId === parentId &&
        f.accountId === accountId
    )

    return parseStringify(folders)
  } catch (error) {
    handleError(error, "Failed to get folders")
  }
}

// Get all contents of a folder (files + subfolders)
export const getFolderContents = async ({
  folderId,
  ownerId,
  accountId,
  types = [],
  searchText = "",
  sort = "createdAt-desc",
}: {
  folderId: string | null
  ownerId: string
  accountId: string
  types?: FileType[]
  searchText?: string
  sort?: string
}) => {
  try {
    await db.init()

    const [userFolders, userFiles] = await Promise.all([
      db.getAllFoldersByUser(ownerId),
      db.getAllFilesByUser(ownerId),
    ])

    // Filter folders
    let folders = userFolders.filter(
      f =>
        f.parentId === folderId &&
        f.accountId === accountId
    )

    // Filter files
    let files = userFiles.filter(
      f =>
        f.parentId === folderId &&
        f.accountId === accountId
    )

    // Apply file type filter
    if (types.length > 0) {
      files = files.filter(f => types.includes(f.type))
    }

    // Apply search filter to both
    if (searchText) {
      const query = searchText.toLowerCase()
      folders = folders.filter(f => f.name.toLowerCase().includes(query))
      files = files.filter(f => f.name.toLowerCase().includes(query))
    }

    // Sort folders alphabetically
    folders.sort((a, b) => a.name.localeCompare(b.name))

    // Sort files based on sort param
    const [sortKey, sortOrder] = sort.split("-")
    files.sort((a, b) => {
      const aVal =
        sortKey === "name"
          ? a.name.toLowerCase()
          : sortKey === "size"
          ? a.size
          : a.createdAt ?? ""
      const bVal =
        sortKey === "name"
          ? b.name.toLowerCase()
          : sortKey === "size"
          ? b.size
          : b.createdAt ?? ""

      const direction = sortOrder === "asc" ? 1 : -1
      return aVal > bVal ? direction : aVal < bVal ? -direction : 0
    })

    return parseStringify({ folders, files })
  } catch (error) {
    handleError(error, "Failed to get folder contents")
  }
}

// Rename folder
export const renameFolder = async ({
  folderId,
  name,
  path,
}: RenameFolderProps) => {
  try {
    await db.init()

    const folder = await db.get<FolderDocument>(STORES.FOLDERS, folderId)
    if (!folder) throw new Error("Folder not found")

    const isValid = await validateFolderName({
      name,
      parentId: folder.parentId,
      ownerId: folder.owner,
      excludeFolderId: folderId,
    })
    if (!isValid) {
      throw new Error(
        `A folder named "${name}" already exists in this location`
      )
    }

    const updated = updateTimestamp({ ...folder, name })
    await db.update(STORES.FOLDERS, updated)

    revalidatePath(path)
    return parseStringify(updated)
  } catch (error) {
    handleError(error, "Failed to rename folder")
  }
}

// Check for circular reference
const hasCircularReference = (
  sourceId: string,
  targetParentId: string | null,
  allFolders: FolderDocument[]
): boolean => {
  if (targetParentId === null) return false
  if (sourceId === targetParentId) return true

  let currentId: string | null = targetParentId
  const visited = new Set<string>()

  while (currentId !== null) {
    if (currentId === sourceId) return true
    if (visited.has(currentId)) return false // Prevent infinite loop
    visited.add(currentId)

    const folder = allFolders.find(f => f.id === currentId)
    currentId = folder?.parentId ?? null
  }

  return false
}

// Move folder to different parent
export const moveFolder = async ({
  folderId,
  targetParentId,
  path,
}: MoveFolderProps) => {
  try {
    await db.init()

    const folder = await db.get<FolderDocument>(STORES.FOLDERS, folderId)
    if (!folder) throw new Error("Folder not found")

    // Prevent moving to same location
    if (folder.parentId === targetParentId) {
      throw new Error("Folder is already in this location")
    }

    // Check for circular reference
    const userFolders = await db.getAllFoldersByUser(folder.owner)
    if (hasCircularReference(folderId, targetParentId, userFolders)) {
      throw new Error("Cannot move a folder into its own subfolder")
    }

    // Validate name in new location
    const isValid = await validateFolderName({
      name: folder.name,
      parentId: targetParentId,
      ownerId: folder.owner,
      excludeFolderId: folderId,
    })
    if (!isValid) {
      throw new Error(
        `A folder named "${folder.name}" already exists in the destination`
      )
    }

    const updated = updateTimestamp({ ...folder, parentId: targetParentId })
    await db.update(STORES.FOLDERS, updated)

    revalidatePath(path)
    return parseStringify(updated)
  } catch (error) {
    handleError(error, "Failed to move folder")
  }
}

// Get all descendant folder IDs
const getDescendantFolderIds = (
  folderId: string,
  allFolders: FolderDocument[]
): string[] => {
  const descendants: string[] = []
  const queue = [folderId]

  while (queue.length > 0) {
    const currentId = queue.shift()!
    descendants.push(currentId)

    const children = allFolders.filter(f => f.parentId === currentId)
    queue.push(...children.map(f => f.id))
  }

  return descendants
}

// Delete folder and all contents recursively
export const deleteFolder = async ({ folderId, path }: DeleteFolderProps) => {
  try {
    await db.init()
    await fileStorage.init()

    const folder = await db.get<FolderDocument>(STORES.FOLDERS, folderId)
    if (!folder) throw new Error("Folder not found")

    const [userFolders, userFiles] = await Promise.all([
      db.getAllFoldersByUser(folder.owner),
      db.getAllFilesByUser(folder.owner),
    ])

    // Get all descendant folders (including this one)
    const folderIdsToDelete = getDescendantFolderIds(folderId, userFolders)

    // Get all files in these folders
    const filesToDelete = userFiles.filter(
      f => f.parentId && folderIdsToDelete.includes(f.parentId)
    )

    // Delete all files (both metadata and blobs)
    await Promise.all(
      filesToDelete.map(async file => {
        await db.delete(STORES.FILES, file.id)
        await fileStorage.deleteFile(file.bucketFileId)
      })
    )

    // Delete all folders
    await Promise.all(folderIdsToDelete.map(id => db.delete(STORES.FOLDERS, id)))

    revalidatePath(path)
    return parseStringify({
      deletedFolders: folderIdsToDelete.length,
      deletedFiles: filesToDelete.length,
    })
  } catch (error) {
    handleError(error, "Failed to delete folder")
  }
}

export const getBreadcrumbs = async ({
  folderId,
  ownerId,
}: {
  folderId: string | null
  ownerId: string
}) => {
  try {
    if (folderId === null) {
      return [{ id: null, name: "Root", url: "/" }]
    }

    await db.init()
    const userFolders = await db.getAllFoldersByUser(ownerId)

    const breadcrumbs: BreadcrumbItem[] = []
    let currentId: string | null = folderId

    while (currentId !== null) {
      const folder = userFolders.find(f => f.id === currentId)
      if (!folder) break

      breadcrumbs.unshift({
        id: folder.id,
        name: folder.name,
        url: `/?folder=${folder.id}`,
      })

      currentId = folder.parentId
    }

    breadcrumbs.unshift({ id: null, name: "Root", url: "/" })

    return parseStringify(breadcrumbs)
  } catch (error) {
    handleError(error, "Failed to get breadcrumbs")
  }
}

export const getFolderStats = async ({ folderId, ownerId }: { folderId: string; ownerId: string }) => {
  try {
    await db.init()

    const [userFolders, userFiles] = await Promise.all([
      db.getAllFoldersByUser(ownerId),
      db.getAllFilesByUser(ownerId),
    ])

    const folderIds = getDescendantFolderIds(folderId, userFolders)
    const files = userFiles.filter(
      f => f.parentId && folderIds.includes(f.parentId)
    )

    const totalSize = files.reduce((sum, f) => sum + f.size, 0)
    const fileCount = files.length
    const folderCount = folderIds.length - 1 // Exclude self

    return parseStringify({ totalSize, fileCount, folderCount })
  } catch (error) {
    handleError(error, "Failed to get folder stats")
  }
}
