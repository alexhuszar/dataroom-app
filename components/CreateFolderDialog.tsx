"use client";

import React, { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useFolder } from "@/lib/contexts/FolderContext";
import { useToast } from "@/lib/hooks/useToast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateFolderDialog = ({ open, onOpenChange }: Props) => {
  const params = useParams();
  const searchParams = useSearchParams();
  const currentFolderId = (params?.id as string) || null;
  const sort = searchParams?.get("sort") || "createdAt-desc";
  const { createFolder, getFolders } = useFolder();
  const { toast } = useToast();

  const [folderName, setFolderName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!folderName.trim()) {
      toast({
        description: "Please enter a folder name",
        className: "error-toast",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await createFolder(folderName.trim(), currentFolderId);
      if (result) {
        toast({
          description: "Folder created successfully",
          className: "success-toast",
        });
        setFolderName("");
        onOpenChange(false);
        await getFolders(currentFolderId, sort);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="shad-dialog button">
        <DialogHeader className="flex flex-col gap-3">
          <DialogTitle className="text-center text-light-100">
            Create New Folder
          </DialogTitle>
          <Input
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Folder name"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleCreate();
              }
            }}
          />
        </DialogHeader>

        <DialogFooter className="flex flex-col gap-3 md:flex-row">
          <Button
            onClick={() => onOpenChange(false)}
            className="modal-cancel-button"
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} className="modal-submit-button">
            Create
            {isLoading && <LoaderCircle className="animate-spin" size={16} />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};