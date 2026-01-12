"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useFile } from "@/lib/contexts/FileContext";
import { useFolder } from "@/lib/contexts/FolderContext";
import { useParams, useSearchParams } from "next/navigation";

export type FetchMode = "files" | "folders" | undefined;

interface UseDashboardDataOptions {
  mode?: FetchMode;
}

export const useDashboardData = ({ mode }: UseDashboardDataOptions = {}) => {
  const { user } = useAuth();

  const searchParams = useSearchParams();
  const { id } = useParams();
  const sort = searchParams?.get("sort") || "createdAt-desc";
  const query = searchParams?.get("query") || "";

  const folderParentId = typeof id === "string" ? id : null;

  const { getFiles, isLoading: isLoadingFiles, files, clearFiles } = useFile();
  const {
    getFolders,
    isLoading: isFoldersLoading,
    folders,
    clearFolders,
  } = useFolder();

  const [error, setError] = useState<unknown>(null);

  const prevRouteRef = useRef<{
    mode?: FetchMode;
    folderParentId: string | null;
    sort: string;
  }>({
    mode,
    folderParentId,
    sort,
  });

  useEffect(() => {
    const prevRoute = prevRouteRef.current;

    if (
      prevRoute.mode !== mode ||
      prevRoute.folderParentId !== folderParentId ||
      prevRoute.sort !== sort
    ) {
      clearFiles();
      clearFolders();

      prevRouteRef.current = { mode, folderParentId, sort };
    }
  }, [mode, folderParentId, sort, clearFiles, clearFolders]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setError(null);
      try {
        const shouldFetchFiles = mode !== "folders";
        const shouldFetchFolders = mode !== "files";

        let promises: Promise<unknown>[] = [
          shouldFetchFiles
            ? getFiles({
                sort,
                limit: mode === "files" ? undefined : 10,
                parentId: mode === "files" ? undefined : folderParentId,
                searchText: query,
              })
            : Promise.resolve(null),
        ];

        if (shouldFetchFolders) {
          promises = [...promises, getFolders(folderParentId, sort, query)];
        }
        await Promise.all(promises);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError(err);
      }
    };

    fetchData();
  }, [
    user,
    mode,
    folderParentId,
    sort,
    query,
    getFiles,
    getFolders,
  ]);

  return {
    files: mode === "folders" ? [] : files,
    folders: mode === "files" ? [] : folders,
    isLoading: isLoadingFiles || isFoldersLoading,
    error,
  };
};
