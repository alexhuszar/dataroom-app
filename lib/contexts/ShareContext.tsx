"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import { Share } from "@/lib/db/indexeddb";
import {
  shareFile as shareFileAction,
  getSharedWithMe as getSharedWithMeAction,
  getFileShares as getFileSharesAction,
  getMyShares as getMySharesAction,
  revokeShare as revokeShareAction,
  SharedFileWithOwner,
  ShareFileResult,
} from "@/lib/actions/share.actions";
import { useAuth } from "./AuthContext";

interface ShareContextType {
  sharedFiles: SharedFileWithOwner[];
  myShares: Share[];
  isLoading: boolean;
  shareFile: (fileId: string, recipientEmail: string) => Promise<ShareFileResult>;
  getSharedWithMe: () => Promise<void>;
  getFileShares: (fileId: string) => Promise<Share[]>;
  revokeShare: (shareId: string) => Promise<ShareFileResult>;
  refreshSharedFiles: () => Promise<void>;
}

const ShareContext = createContext<ShareContextType | undefined>(undefined);

export function ShareProvider({ children }: { children: React.ReactNode }) {
  const [sharedFiles, setSharedFiles] = useState<SharedFileWithOwner[]>([]);
  const [myShares, setMyShares] = useState<Share[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const shareFile = useCallback(
    async (fileId: string, recipientEmail: string): Promise<ShareFileResult> => {
      if (!user) {
        return { success: false, message: "You must be logged in" };
      }

      setIsLoading(true);
      try {
        const result = await shareFileAction(
          fileId,
          recipientEmail,
          user.id,
          user.email
        );

        if (result.success) {
          const updated = await getMySharesAction(user.id);
          setMyShares(updated);
        }

        return result;
      } catch (error) {
        console.error("Error sharing file:", error);
        return { success: false, message: "Failed to share file" };
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const getSharedWithMe = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const files = await getSharedWithMeAction(user.id, user.email);
      setSharedFiles(files);
    } catch (error) {
      console.error("Error fetching shared files:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const getFileShares = useCallback(
    async (fileId: string): Promise<Share[]> => {
      if (!user) return [];

      try {
        const shares = await getFileSharesAction(fileId, user.id);
        return shares;
      } catch (error) {
        console.error("Error fetching file shares:", error);
        return [];
      }
    },
    [user]
  );

  const revokeShare = useCallback(
    async (shareId: string): Promise<ShareFileResult> => {
      if (!user) {
        return { success: false, message: "You must be logged in" };
      }

      setIsLoading(true);
      try {
        const result = await revokeShareAction(shareId, user.id);

        if (result.success) {
          const updated = await getMySharesAction(user.id);
          setMyShares(updated);
        }

        return result;
      } catch (error) {
        console.error("Error revoking share:", error);
        return { success: false, message: "Failed to revoke share" };
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const refreshSharedFiles = useCallback(async () => {
    await getSharedWithMe();
  }, [getSharedWithMe]);

  const value: ShareContextType = {
    sharedFiles,
    myShares,
    isLoading,
    shareFile,
    getSharedWithMe,
    getFileShares,
    revokeShare,
    refreshSharedFiles,
  };

  return (
    <ShareContext.Provider value={value}>{children}</ShareContext.Provider>
  );
}

export function useShare() {
  const context = useContext(ShareContext);
  if (context === undefined) {
    throw new Error("useShare must be used within a ShareProvider");
  }
  return context;
}
