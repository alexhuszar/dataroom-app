"use server";

import { db, FileDocument, STORES, User } from "@/lib/db/indexeddb";
import { fileStorage } from "@/lib/db/fileStorage";
import { generateId, parseStringify } from "@/lib/utils/general";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { getFileType } from "../utils/file";
import { updateTimestamp, withTimestamps } from "../utils/date";

const handleError = (error: unknown, message: string): never => {
  console.error(message, error);
  throw error;
};

const initDBs = async (withFiles = false) => {
  await db.init();
  if (withFiles) await fileStorage.init();
};

const sortFiles = (sort: string) => {
  const [key, order] = sort.split("-");
  const direction = order === "asc" ? 1 : -1;

  return (a: FileDocument, b: FileDocument) => {
    const aVal =
      key === "name"
        ? a.name.toLowerCase()
        : key === "size"
          ? a.size
          : (a.createdAt ?? "");

    const bVal =
      key === "name"
        ? b.name.toLowerCase()
        : key === "size"
          ? b.size
          : (b.createdAt ?? "");

    return aVal > bVal ? direction : aVal < bVal ? -direction : 0;
  };
};

export const uploadFile = async ({
  file,
  ownerId,
  accountId,
  path,
  parentId = null,
}: UploadFileProps) => {
  try {
    await initDBs(true);

    const fileId = generateId();
    const bucketFileId = generateId();

    await fileStorage.storeFile(bucketFileId, file);
    const url = (await fileStorage.getFileUrl(bucketFileId)) ?? "";

    const { type, extension } = getFileType(file.name);

    const document: FileDocument = withTimestamps({
      id: fileId,
      type: type as FileType,
      name: file.name,
      url,
      extension,
      size: file.size,
      owner: ownerId,
      accountId,
      bucketFileId,
      parentId,
    });

    await db.add(STORES.FILES, document);

    revalidatePath(path);
    return parseStringify(document);
  } catch (error) {
    handleError(error, "Failed to upload file");
  }
};

const filterAndSortFiles = (
  files: FileDocument[],
  user: User,
  searchText: string,
  sort: string,
  limit?: number
) => {
  let result = files.filter((f) => f.owner === user.id);

  if (searchText) {
    const q = searchText.toLowerCase();
    result = result.filter((f) => f.name.toLowerCase().includes(q));
  }

  result.sort(sortFiles(sort));

  return limit ? result.slice(0, limit) : result;
};

export const getFiles = async ({
  searchText = "",
  sort = "createdAt-desc",
  limit,
}: GetFilesProps) => {
  try {
    await db.init();
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    const ownedFiles = await db.getAllFilesByUser(currentUser.id);

    const documents = filterAndSortFiles(
      ownedFiles,
      currentUser,
      searchText,
      sort,
      limit
    );

    return parseStringify({
      documents,
      total: documents.length,
    });
  } catch (error) {
    handleError(error, "Failed to get files");
  }
};

export const renameFile = async ({
  fileId,
  name,
  extension,
  path,
}: RenameFileProps) => {
  try {
    await db.init();

    const file = await db.get<FileDocument>(STORES.FILES, fileId);
    if (!file) throw new Error("File not found");

    const updated = updateTimestamp({
      ...file,
      name: `${name}.${extension}`,
    });

    await db.update(STORES.FILES, updated);

    revalidatePath(path);
    return parseStringify(updated);
  } catch (error) {
    handleError(error, "Failed to rename file");
  }
};

export const deleteFile = async ({
  fileId,
  bucketFileId,
  path,
}: DeleteFileProps) => {
  try {
    await initDBs(true);

    // Delete file, blob storage, and all shares
    const { deleteFileShares } = await import("./share.actions");

    await Promise.all([
      db.delete(STORES.FILES, fileId),
      fileStorage.deleteFile(bucketFileId),
      deleteFileShares(fileId),
    ]);

    revalidatePath(path);
    return parseStringify({ status: "success" });
  } catch (error) {
    handleError(error, "Failed to delete file");
  }
};

export const moveFile = async ({
  fileId,
  targetParentId,
  path,
}: MoveFileProps) => {
  try {
    await db.init();

    const file = await db.get<FileDocument>(STORES.FILES, fileId);
    if (!file) throw new Error("File not found");

    // Check for duplicate name in destination
    const userFiles = await db.getAllFilesByUser(file.owner);
    const destinationFiles = userFiles.filter(
      (f) => f.parentId === targetParentId && f.id !== fileId
    );

    const hasDuplicate = destinationFiles.some(
      (f) => f.name.toLowerCase() === file.name.toLowerCase()
    );

    if (hasDuplicate) {
      throw new Error(
        `A file named "${file.name}" already exists in the destination`
      );
    }

    const updated = updateTimestamp({ ...file, parentId: targetParentId });
    await db.update(STORES.FILES, updated);

    revalidatePath(path);
    return parseStringify(updated);
  } catch (error) {
    handleError(error, "Failed to move file");
  }
};
