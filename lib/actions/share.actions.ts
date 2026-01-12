"use server";

import {
  db,
  STORES,
  type Share,
  type FileDocument,
  type User,
} from "@/lib/db/indexeddb";
import { generateId } from "@/lib/utils/general";
import { withTimestamps } from "@/lib/utils/date";

export interface ShareFileResult {
  success: boolean;
  message?: string;
  share?: Share;
}

export interface SharedFileWithOwner extends FileDocument {
  ownerName: string;
  ownerEmail: string;
}

export async function shareFile(
  fileId: string,
  recipientEmail: string,
  currentUserId: string,
  currentUserEmail: string
): Promise<ShareFileResult> {
  try {
    await db.init();

    const normalizedEmail = recipientEmail.toLowerCase().trim();

    if (!fileId || !recipientEmail || !currentUserId) {
      return { success: false, message: "Missing required fields" };
    }

    if (normalizedEmail === currentUserEmail.toLowerCase()) {
      return { success: false, message: "You cannot share with yourself" };
    }

    const file = await db.get<FileDocument>(STORES.FILES, fileId);
    if (!file) {
      return { success: false, message: "File not found" };
    }

    if (file.owner !== currentUserId) {
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
      ownerId: currentUserId,
      sharedWithEmail: normalizedEmail,
      sharedWithUserId: recipientUser?.id,
      permission: "view",
    });

    await db.add(STORES.SHARES, share);

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
  }
}

export async function getSharedWithMe(
  currentUserId: string,
  currentUserEmail: string
): Promise<SharedFileWithOwner[]> {
  try {
    await db.init();

    const normalizedEmail = currentUserEmail.toLowerCase();

    const sharesByEmail = await db.getSharesByEmail(normalizedEmail);
    const sharesByUserId = await db.getSharesByUserId(currentUserId);

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

    return sharedFiles;
  } catch (error) {
    console.error("Error getting shared files:", error);
    return [];
  }
}

export async function getFileShares(
  fileId: string,
  currentUserId: string
): Promise<Share[]> {
  try {
    await db.init();

    const file = await db.get<FileDocument>(STORES.FILES, fileId);
    if (!file || file.owner !== currentUserId) {
      return [];
    }

    return await db.getSharesByFileId(fileId);
  } catch (error) {
    console.error("Error getting file shares:", error);
    return [];
  }
}

export async function getMyShares(currentUserId: string): Promise<Share[]> {
  try {
    await db.init();

    return await db.getSharesByOwnerId(currentUserId);
  } catch (error) {
    console.error("Error getting my shares:", error);
    return [];
  }
}

export async function revokeShare(
  shareId: string,
  currentUserId: string
): Promise<ShareFileResult> {
  try {
    await db.init();

    const share = await db.get<Share>(STORES.SHARES, shareId);

    if (!share) {
      return { success: false, message: "Share not found" };
    }

    if (share.ownerId !== currentUserId) {
      return { success: false, message: "You can only revoke your own shares" };
    }

    await db.delete(STORES.SHARES, shareId);

    return { success: true, message: "Share revoked successfully" };
  } catch (error) {
    console.error("Error revoking share:", error);
    return { success: false, message: "Failed to revoke share" };
  }
}

export async function canAccessFile(
  fileId: string,
  userId: string,
  userEmail: string
): Promise<{ canAccess: boolean; permission?: "view" | "owner" }> {
  try {
    await db.init();

    const file = await db.get<FileDocument>(STORES.FILES, fileId);

    if (!file) {
      return { canAccess: false };
    }

    if (file.owner === userId) {
      return { canAccess: true, permission: "owner" };
    }

    const normalizedEmail = userEmail.toLowerCase();
    const sharesByEmail = await db.getSharesByEmail(normalizedEmail);
    const sharesByUserId = await db.getSharesByUserId(userId);

    const hasShare = [...sharesByEmail, ...sharesByUserId].some(
      (s) => s.fileId === fileId
    );

    if (hasShare) {
      return { canAccess: true, permission: "view" };
    }

    return { canAccess: false };
  } catch (error) {
    console.error("Error checking file access:", error);
    return { canAccess: false };
  }
}

export async function deleteFileShares(fileId: string): Promise<void> {
  try {
    await db.init();

    const shares = await db.getSharesByFileId(fileId);
    await Promise.all(
      shares.map((share) => db.delete(STORES.SHARES, share.id))
    );
  } catch (error) {
    console.error("Error deleting file shares:", error);
  }
}
