"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  db,
  FileDocument,
  STORES,
  User,
} from "@/lib/db/indexeddb";
import { fileStorage } from "@/lib/db/fileStorage";
import { generateId, parseStringify } from "@/lib/utils/general";
import { useAuth } from "./AuthContext";
import { getFileType } from "../utils/file";
import { updateTimestamp, withTimestamps } from "../utils/date";


interface FileContextType {
  files: FileDocument[];
  isLoading: boolean;
  uploadFile: (
    file: File,
    ownerId: string,
    accountId: string,
    parentId?: string | null
  ) => Promise<FileDocument | null>;
  getFiles: (filters?: {
    types?: FileType[];
    searchText?: string;
    sort?: string;
    limit?: number;
    parentId?: string | null;
  }) => Promise<{ documents: FileDocument[]; total: number }>;
  renameFile: (
    fileId: string,
    name: string,
    extension: string
  ) => Promise<FileDocument | null>;
  deleteFile: (fileId: string, bucketFileId: string) => Promise<boolean>;
  moveFile: (fileId: string, targetParentId: string | null) => Promise<FileDocument | null>;
  refreshFiles: () => Promise<void>;
  clearFiles: () => void;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export function FileProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = useState<FileDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initStorage = async () => {
      try {
        await fileStorage.init();
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize file storage:", error);
      }
    };

    initStorage();
  }, []);

  const filterAndSortFiles = (
    allFiles: FileDocument[],
    currentUser: User,
    types: FileType[] = [],
    searchText: string = "",
    sort: string = "createdAt-desc",
    limit?: number
  ): FileDocument[] => {
    let filteredFiles = allFiles.filter(
      (file) => file.owner === currentUser.id
    );

    if (types.length > 0) {
      filteredFiles = filteredFiles.filter((file) => types.includes(file.type));
    }

    if (searchText) {
      filteredFiles = filteredFiles.filter((file) =>
        file.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (sort) {
      const [sortBy, orderBy] = sort.split("-");
      filteredFiles.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        if (sortBy === "createdAt") {
          aValue = a.createdAt || "";
          bValue = b.createdAt || "";
        } else if (sortBy === "name") {
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
        } else {
          aValue = a.size;
          bValue = b.size;
        }

        if (orderBy === "asc") {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });
    }

    if (limit && limit > 0) {
      filteredFiles = filteredFiles.slice(0, limit);
    }

    return filteredFiles;
  };

  
  const uploadFile = useCallback(
    async (file: File, ownerId: string, accountId: string, parentId: string | null = null) => {
      if (!isInitialized) {
        console.error("File storage not initialized");
        return null;
      }

      try {
        setIsLoading(true);

        const fileId = generateId();
        const bucketFileId = generateId();


        await fileStorage.storeFile(bucketFileId, file);

        const url = (await fileStorage.getFileUrl(bucketFileId)) || "";

        const fileDocument: FileDocument = withTimestamps({
          id: fileId,
          type: getFileType(file.name).type as FileType,
          name: file.name,
          url,
          extension: getFileType(file.name).extension,
          size: file.size,
          owner: ownerId,
          accountId,
          bucketFileId,
          parentId,
        });

        await db.add<FileDocument>(STORES.FILES, fileDocument);

        setFiles((prev) => [...prev, fileDocument]);


        return fileDocument;
      } catch (error) {
        console.error("Failed to upload file:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isInitialized]
  );

  const getFiles = useCallback(
    async (filters?: {
      types?: FileType[];
      searchText?: string;
      sort?: string;
      limit?: number;
      parentId?: string | null;
    }) => {
      if (!user) {
        return { documents: [], total: 0 };
      }

      try {
        setIsLoading(true);

        let userFiles = await db.getAllFilesByUser(user.id);

        if (filters?.parentId !== undefined) {
          userFiles = userFiles.filter(f => f.parentId === filters.parentId);
        }

        const filteredFiles = filterAndSortFiles(
          userFiles,
          user,
          filters?.types || [],
          filters?.searchText || "",
          filters?.sort || "createdAt-desc",
          filters?.limit
        );

        const result = {
          documents: filteredFiles,
          total: filteredFiles.length,
        };

        setFiles(filteredFiles);

        return parseStringify(result);
      } catch (error) {
        console.error("Failed to get files:", error);
        return { documents: [], total: 0 };
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const renameFile = useCallback(
    async (fileId: string, name: string, extension: string) => {
      if (!isInitialized) {
        console.error("File storage not initialized");
        return null;
      }

      try {
        setIsLoading(true);

        const file = await db.get<FileDocument>(STORES.FILES, fileId);
        if (!file) throw new Error("File not found");

        const newName = `${name}.${extension}`;
        const updatedFile = updateTimestamp({
          ...file,
          name: newName,
        });

        await db.update<FileDocument>(STORES.FILES, updatedFile);

        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? updatedFile : f))
        );


        return updatedFile;
      } catch (error) {
        console.error("Failed to rename file:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isInitialized]
  );

  const deleteFile = useCallback(
    async (fileId: string, bucketFileId: string) => {
      if (!isInitialized) {
        console.error("File storage not initialized");
        return false;
      }

      try {
        setIsLoading(true);

        await db.delete(STORES.FILES, fileId);

        await fileStorage.deleteFile(bucketFileId);

        setFiles((prev) => prev.filter((f) => f.id !== fileId));
   

        return true;
      } catch (error) {
        console.error("Failed to delete file:", error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isInitialized]
  );

  const refreshFiles = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const userFiles = await db.getAllFilesByUser(user.id);
      setFiles(userFiles);
    } catch (error) {
      console.error("Failed to refresh files:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);


  const moveFile = useCallback(
    async (fileId: string, targetParentId: string | null) => {
      if (!isInitialized) {
        console.error("File storage not initialized");
        return null;
      }

      try {
        setIsLoading(true);

        const file = await db.get<FileDocument>(STORES.FILES, fileId);
        if (!file) throw new Error("File not found");

        const allFiles = await db.getAll<FileDocument>(STORES.FILES);
        const destinationFiles = allFiles.filter(
          f => f.parentId === targetParentId && f.owner === file.owner && f.id !== fileId
        );

        const hasDuplicate = destinationFiles.some(
          f => f.name.toLowerCase() === file.name.toLowerCase()
        );

        if (hasDuplicate) {
          throw new Error(`A file named "${file.name}" already exists in the destination`);
        }

        const updatedFile = updateTimestamp({ ...file, parentId: targetParentId });
        await db.update<FileDocument>(STORES.FILES, updatedFile);

        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? updatedFile : f))
        );

        return updatedFile;
      } catch (error) {
        console.error("Failed to move file:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isInitialized]
  );

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  const value: FileContextType = {
    files,
    isLoading,
    uploadFile,
    getFiles,
    renameFile,
    deleteFile,
    moveFile,
    refreshFiles,
    clearFiles,
  };

  return <FileContext.Provider value={value}>{children}</FileContext.Provider>;
}

export function useFile() {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error("useFile must be used within a FileProvider");
  }
  return context;
}
