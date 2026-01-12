"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import {
  db,
  Share,
  STORES,
  type FileDocument,
  type User,
} from "@/lib/db/indexeddb";
import { generateId } from "@/lib/utils/general";
import { withTimestamps } from "@/lib/utils/date";
import { useAuth } from "./AuthContext";

export interface ShareFileResult {
  success: boolean;
  message?: string;
  share?: Share;
}

export interface SharedFileWithOwner extends FileDocument {
  ownerName: string;
  ownerEmail: string;
}

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
        await db.init();

        const normalizedEmail = recipientEmail.toLowerCase().trim();

        if (!fileId || !recipientEmail) {
          return { success: false, message: "Missing required fields" };
        }

        if (normalizedEmail === user.email.toLowerCase()) {
          return { success: false, message: "You cannot share with yourself" };
        }

        const file = await db.get<FileDocument>(STORES.FILES, fileId);
        if (!file) {
          return { success: false, message: "File not found" };
        }

        if (file.owner !== user.id) {
          return { success: false, message: "You can only share files you own" };
        }

        const existingShares = await db.getSharesByFileId(fileId);
        const alreadyShared = existingShares.some(
          (s) => s.sharedWithEmail.toLowerCase() === normalizedEmail
        );

        if (alreadyShared) {
          return { success: false, message: "File already shared with this user" };
        }

        const recipientUser = await db.getUserByEmail(normalizedEmail);

        const share: Share = withTimestamps({
          id: generateId(),
          fileId,
          ownerId: user.id,
          sharedWithEmail: normalizedEmail,
          sharedWithUserId: recipientUser?.id,
          permission: "view",
        });

        await db.add(STORES.SHARES, share);

        const updated = await db.getSharesByOwnerId(user.id);
        setMyShares(updated);

        return {
          success: true,
          message: recipientUser
            ? "File shared successfully"
            : "Share created. User must register with this email to access.",
          share,
        };
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
      await db.init();

      const normalizedEmail = user.email.toLowerCase();

      const sharesByEmail = await db.getSharesByEmail(normalizedEmail);
      const sharesByUserId = await db.getSharesByUserId(user.id);

      const allShares = [...sharesByEmail, ...sharesByUserId];
      const uniqueShares = Array.from(
        new Map(allShares.map((s) => [s.fileId, s])).values()
      );

      const sharedFiles: SharedFileWithOwner[] = [];

      for (const share of uniqueShares) {
        const file = await db.get<FileDocument>(STORES.FILES, share.fileId);
        if (!file) continue;

        const owner = await db.get<User>(STORES.USERS, share.ownerId);
        if (!owner) continue;

        sharedFiles.push({
          ...file,
          ownerName: owner.name,
          ownerEmail: owner.email,
        });
      }

      setSharedFiles(sharedFiles);
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
        await db.init();

        const file = await db.get<FileDocument>(STORES.FILES, fileId);
        if (!file || file.owner !== user.id) {
          return [];
        }

        return await db.getSharesByFileId(fileId);
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
        await db.init();

        const share = await db.get<Share>(STORES.SHARES, shareId);

        if (!share) {
          return { success: false, message: "Share not found" };
        }

        if (share.ownerId !== user.id) {
          return { success: false, message: "You can only revoke your own shares" };
        }

        await db.delete(STORES.SHARES, shareId);

        const updated = await db.getSharesByOwnerId(user.id);
        setMyShares(updated);

        return { success: true, message: "Share revoked successfully" };
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
