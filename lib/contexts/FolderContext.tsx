"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import {
  db,
  FolderDocument,
  STORES,
} from "@/lib/db/indexeddb";
import { generateId } from "@/lib/utils/general";
import { useAuth } from "./AuthContext";
import { updateTimestamp, withTimestamps } from "../utils/date";
import { fileStorage } from "@/lib/db/fileStorage";

interface FolderContextType {
  folders: FolderDocument[];
  isLoading: boolean;
  createFolder: (name: string, parentId: string | null) => Promise<FolderDocument | null>;
  getFolders: (parentId: string | null, sort?: string, searchText?: string) => Promise<FolderDocument[]>;
  renameFolder: (folderId: string, name: string) => Promise<FolderDocument | null>;
  moveFolder: (folderId: string, targetParentId: string | null) => Promise<FolderDocument | null>;
  deleteFolder: (folderId: string) => Promise<{ deletedFolders: number; deletedFiles: number } | null>;
  clearFolders: () => void;
}

const FolderContext = createContext<FolderContextType | undefined>(undefined);

export function FolderProvider({ children }: { children: React.ReactNode }) {
  const [folders, setFolders] = useState<FolderDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const validateFolderName = useCallback(
    async (name: string, parentId: string | null, excludeFolderId?: string): Promise<boolean> => {
      if (!user) return false;

      await db.init();
      const userFolders = await db.getAllFoldersByUser(user.id);
      const siblingFolders = userFolders.filter(
        f => f.parentId === parentId && f.id !== excludeFolderId
      );

      return !siblingFolders.some(f => f.name.toLowerCase() === name.toLowerCase());
    },
    [user]
  );


  const createFolder = useCallback(
    async (name: string, parentId: string | null) => {
      if (!user) return null;

      try {
        setIsLoading(true);

        const isValid = await validateFolderName(name, parentId);
        if (!isValid) {
          throw new Error(`A folder named "${name}" already exists in this location`);
        }

        const folder: FolderDocument = withTimestamps({
          id: generateId(),
          name,
          parentId,
          owner: user.id,
          accountId: user.accountId,
        });

        await db.add(STORES.FOLDERS, folder);
        setFolders(prev => [...prev, folder]);

        return folder;
      } catch (error) {
        console.error("Failed to create folder:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [user, validateFolderName]
  );

  const getFolders = useCallback(
    async (parentId: string | null, sort: string = "createdAt-desc", searchText: string = "") => {
      if (!user) return [];

      try {
        setIsLoading(true);
        await db.init();
        const userFolders = await db.getAllFoldersByUser(user.id);
        let filtered = userFolders.filter(
          f => f.parentId === parentId && f.accountId === user.accountId
        );

        if (searchText) {
          filtered = filtered.filter(f =>
            f.name.toLowerCase().includes(searchText.toLowerCase())
          );
        }

        if (sort) {
          const [sortBy, orderBy] = sort.split("-");
          filtered.sort((a, b) => {
            let aValue: string | number;
            let bValue: string | number;

            if (sortBy === "createdAt") {
              aValue = a.createdAt || "";
              bValue = b.createdAt || "";
            } else if (sortBy === "name") {
              aValue = a.name.toLowerCase();
              bValue = b.name.toLowerCase();
            } else if (sortBy === "size") {
              aValue = 0;
              bValue = 0;
            } else {
              aValue = a.createdAt || "";
              bValue = b.createdAt || "";
            }

            if (orderBy === "asc") {
              return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
            } else {
              return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
            }
          });
        }

        setFolders(filtered);
        return filtered;
      } catch (error) {
        console.error("Failed to get folders:", error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const renameFolder = useCallback(
    async (folderId: string, name: string) => {
      try {
        setIsLoading(true);

        await db.init();
        const folder = await db.get<FolderDocument>(STORES.FOLDERS, folderId);
        if (!folder) throw new Error("Folder not found");

        const isValid = await validateFolderName(name, folder.parentId, folderId);
        if (!isValid) {
          throw new Error(`A folder named "${name}" already exists in this location`);
        }

        const updated = updateTimestamp({ ...folder, name });
        await db.update(STORES.FOLDERS, updated);

        setFolders(prev => prev.map(f => f.id === folderId ? updated : f));

        return updated;
      } catch (error) {
        console.error("Failed to rename folder:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [validateFolderName]
  );

  const hasCircularReference = useCallback(
    async (sourceId: string, targetParentId: string | null): Promise<boolean> => {
      if (targetParentId === null) return false;
      if (sourceId === targetParentId) return true;

      if (!user) return false;

      await db.init();
      const userFolders = await db.getAllFoldersByUser(user.id);
      let currentId: string | null = targetParentId;
      const visited = new Set<string>();

      while (currentId !== null) {
        if (currentId === sourceId) return true;
        if (visited.has(currentId)) return false;
        visited.add(currentId);

        const folder = userFolders.find(f => f.id === currentId);
        currentId = folder?.parentId ?? null;
      }

      return false;
    },
    [user]
  );

  const moveFolder = useCallback(
    async (folderId: string, targetParentId: string | null) => {
      try {
        setIsLoading(true);

        await db.init();
        const folder = await db.get<FolderDocument>(STORES.FOLDERS, folderId);
        if (!folder) throw new Error("Folder not found");

        if (folder.parentId === targetParentId) {
          throw new Error("Folder is already in this location");
        }

        if (await hasCircularReference(folderId, targetParentId)) {
          throw new Error("Cannot move a folder into its own subfolder");
        }

        const isValid = await validateFolderName(folder.name, targetParentId, folderId);
        if (!isValid) {
          throw new Error(`A folder named "${folder.name}" already exists in the destination`);
        }

        const updated = updateTimestamp({ ...folder, parentId: targetParentId });
        await db.update(STORES.FOLDERS, updated);

        setFolders(prev => prev.map(f => f.id === folderId ? updated : f));

        return updated;
      } catch (error) {
        console.error("Failed to move folder:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [hasCircularReference, validateFolderName]
  );

  const getDescendantFolderIds = (
    folderId: string,
    allFolders: FolderDocument[]
  ): string[] => {
    const descendants: string[] = [];
    const queue = [folderId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      descendants.push(currentId);

      const children = allFolders.filter(f => f.parentId === currentId);
      queue.push(...children.map(f => f.id));
    }

    return descendants;
  };

  const deleteFolder = useCallback(
    async (folderId: string) => {
      if (!user) return null;

      try {
        setIsLoading(true);

        await db.init();
        await fileStorage.init();

        const folder = await db.get<FolderDocument>(STORES.FOLDERS, folderId);
        if (!folder) throw new Error("Folder not found");

        const [userFolders, userFiles] = await Promise.all([
          db.getAllFoldersByUser(user.id),
          db.getAllFilesByUser(user.id),
        ]);

        const folderIdsToDelete = getDescendantFolderIds(folderId, userFolders);
        const filesToDelete = userFiles.filter(
          f => f.parentId && folderIdsToDelete.includes(f.parentId)
        );

        await Promise.all(
          filesToDelete.map(async file => {
            await db.delete(STORES.FILES, file.id);
            await fileStorage.deleteFile(file.bucketFileId);
          })
        );

        await Promise.all(
          folderIdsToDelete.map(id => db.delete(STORES.FOLDERS, id))
        );

        setFolders(prev => prev.filter(f => !folderIdsToDelete.includes(f.id)));

        return { deletedFolders: folderIdsToDelete.length, deletedFiles: filesToDelete.length };
      } catch (error) {
        console.error("Failed to delete folder:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const clearFolders = useCallback(() => {
    setFolders([]);
  }, []);

  const value: FolderContextType = {
    folders,
    isLoading,
    createFolder,
    getFolders,
    renameFolder,
    moveFolder,
    deleteFolder,
    clearFolders,
  };

  return <FolderContext.Provider value={value}>{children}</FolderContext.Provider>;
}

export function useFolder() {
  const context = useContext(FolderContext);
  if (context === undefined) {
    throw new Error("useFolder must be used within a FolderProvider");
  }
  return context;
}
