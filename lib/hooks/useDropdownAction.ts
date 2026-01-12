import { useState, useCallback } from "react";
import { useFile } from "@/lib/contexts/FileContext";
import { useFolder } from "@/lib/contexts/FolderContext";
import { useToast } from "@/lib/hooks/useToast";

export type ActionValue =
  | "rename"
  | "delete"
  | "details"
  | "move"
  | "download"
  | "share";

export interface ActionItem {
  label: string;
  value: ActionValue;
  icon: React.ReactNode;
}

export interface BaseItem {
  id: string;
  $id?: string;
  name: string;
}

export interface FileDocumentType extends BaseItem {
  extension: string;
  bucketFileId: string;
  url: string;
  type: FileType;
  size: number;
  owner: string;
  accountId: string;
  parentId: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface FolderDocumentType extends BaseItem {
  parentId: string | null;
  owner: string;
  accountId: string;
}

export type ActionableItem = FileDocumentType | FolderDocumentType;

interface UseDropdownActionProps {
  item: ActionableItem;
  type: "file" | "folder";
  closeModal: () => void;
}

export const useDropdownAction = ({
  item,
  type,
  closeModal,
}: UseDropdownActionProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { deleteFile, renameFile, getFiles } = useFile();
  const { deleteFolder, renameFolder, getFolders } = useFolder();

  const itemId = item.id || item.$id || "";

  const executeAction = useCallback(
    async (actionValue: ActionValue, name: string) => {
      setIsLoading(true);
      try {
        let result;

        if (type === "file") {
          const file = item as FileDocumentType;
          if (actionValue === "rename")
            result = await renameFile(itemId, name, file.extension);
          if (actionValue === "delete")
            result = await deleteFile(itemId, file.bucketFileId);

          if (result)
            await getFiles({
              types: ["document", "other"],
              searchText: "",
              sort: "createdAt-desc",
              limit: 100,
            });
        } else {
          if (actionValue === "rename")
            result = await renameFolder(itemId, name);
          if (actionValue === "delete") result = await deleteFolder(itemId);
          if (result) await getFolders(null, "createdAt-desc", "");
        }

        if (result) {
          toast({
            description: `${actionValue} successful`.toUpperCase(),
            className: "success-toast",
          });
          closeModal();
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Operation failed";
        toast({ description: message, className: "error-toast" });
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      type,
      item,
      itemId,
      renameFile,
      deleteFile,
      renameFolder,
      deleteFolder,
      closeModal,
      toast,
    ]
  );

  return { isLoading, executeAction };
};
