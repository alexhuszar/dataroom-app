"use client";

import React, { useState, useEffect } from "react";
import { Folder, Home, LoaderCircle } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFolder } from "@/lib/contexts/FolderContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useToast } from "@/lib/hooks/useToast";
import { db, FolderDocument } from "@/lib/db/indexeddb";

interface Props {
  folder: FolderDocumentType;
  onClose: () => void;
}

const MoveFolderDialog = ({ folder, onClose }: Props) => {
  const { user } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const currentFolderId = (params?.id as string) || null;
  const sort = searchParams?.get("sort") || "createdAt-desc";
  const { moveFolder, getFolders } = useFolder();
  const { toast } = useToast();

  const [allFolders, setAllFolders] = useState<FolderDocument[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadFolders = async () => {
      if (!user) return;

      await db.init();
      const userFolders = await db.getAllFoldersByUser(user.id);
      const filteredFolders = userFolders.filter(
        (f) => f.id !== folder.id // Exclude self
      );
      setAllFolders(filteredFolders);
    };

    loadFolders();
  }, [user, folder.id]);

  const handleMove = async () => {
    setIsLoading(true);

    try {
      const result = await moveFolder(folder.id, selectedFolderId);
      if (result) {
        toast({
          description: "Folder moved successfully",
          className: "success-toast",
        });
        await getFolders(currentFolderId, sort);
        onClose();
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to create folder";

      toast({
        description: message,
        className: "error-toast",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="shad-dialog button">
      <DialogHeader className="flex flex-col gap-3">
        <DialogTitle className="text-center text-light-100">
          Move &ldquo;{folder.name}&ldquo; to...
        </DialogTitle>

        <div className="max-h-[400px] space-y-2 overflow-y-auto ">
          {/* Root option */}
          <button
            onClick={() => setSelectedFolderId(null)}
            className={`flex w-full gap-3 p-3 transition-colors   ${
              selectedFolderId === null
                ? "border-brand bg-brand/10"
                : "border-light-400/20 hover:border-light-400/40"
            } rounded-lg border-2 text-left `}
          >
            <Home size={20} />
            <span>Root (Top Level)</span>
          </button>

          {/* Other folders */}
          {allFolders.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFolderId(f.id)}
              className={`flex w-full gap-3 p-3 transition-colors ${
                selectedFolderId === f.id
                  ? "border-brand bg-brand/10"
                  : "border-light-400/20 hover:border-light-400/40"
              } items-center rounded-lg border-2 text-left`}
            >
              <Folder size={20} />
              <span>{f.name}</span>
            </button>
          ))}
        </div>
      </DialogHeader>

      <DialogFooter className="flex flex-col gap-3 md:flex-row">
        <Button onClick={onClose} className="modal-cancel-button">
          Cancel
        </Button>
        <Button onClick={handleMove} className="modal-submit-button">
          Move
          {isLoading && <LoaderCircle className="animate-spin" size={16} />}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default MoveFolderDialog;
