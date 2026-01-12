"use client";

import { useCallback, useMemo, useState } from "react";
import { EllipsisVertical, LoaderCircle, Pen, Trash, Move } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { actionsDropdownItems } from "@/constants";
import { FileDetails } from "@/components/ActionsModalContent";
import {
  useDropdownAction,
  ActionableItem,
  ActionItem,
  FileDocumentType,
  FolderDocumentType,
} from "@/lib/hooks/useDropdownAction";
import MoveFolderDialog from "./MoveFolderDialog";
import ShareDialog from "./ShareDialog";
import { useAuth } from "@/lib/contexts/AuthContext";

const ActionDropdown = ({
  item,
  type,
}: {
  item: ActionableItem;
  type: "file" | "folder";
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [action, setAction] = useState<ActionItem | null>(null);
  const [name, setName] = useState(item.name);
  const { user } = useAuth();

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setAction(null);
    setName(item.name);
  }, [item.name]);

  const handleDownload = useCallback(async () => {
    if (type !== "file") return;

    try {
      const fileItem = item as FileDocumentType;
      const { fileStorage } = await import("@/lib/db/fileStorage");
      const storedFile = await fileStorage.getFile(fileItem.bucketFileId);

      if (!storedFile) {
        console.error("File not found");
        return;
      }

      const url = URL.createObjectURL(storedFile.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = item.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  }, [item, type]);

  const { isLoading, executeAction } = useDropdownAction({
    item,
    type,
    closeModal,
  });

  const dialogContent = useMemo(() => {
    if (!action) return null;
    const { value, label } = action;

    if (value === "move" && type === "folder") {
      return (
        <MoveFolderDialog
          folder={item as FolderDocumentType}
          onClose={closeModal}
        />
      );
    }

    return (
      <DialogContent
        className="shad-dialog button"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader className="flex flex-col gap-3">
          <DialogTitle className="text-center text-light-100">
            {label}
          </DialogTitle>
          {value === "rename" && (
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          )}
          {value === "details" && type === "file" && (
            <FileDetails file={item as FileDocumentType} />
          )}
          {value === "delete" && (
            <div className="delete-confirmation">
              <p>
                Are you sure you want to delete{" "}
                <span className="delete-file-name">{item.name}</span>?
              </p>
              {type === "folder" && (
                <p className="text-red-300 text-sm mt-2">
                  This deletes all sub-contents.
                </p>
              )}
            </div>
          )}
        </DialogHeader>

        {["rename", "delete"].includes(value) && (
          <DialogFooter className="flex flex-col gap-3 md:flex-row">
            <Button onClick={closeModal} className="modal-cancel-button">
              Cancel
            </Button>
            <Button
              onClick={() => executeAction(value, name)}
              className={
                value === "delete"
                  ? "modal-submit-button bg-error hover:bg-error/90"
                  : "modal-submit-button"
              }
            >
              <span className="capitalize">{value}</span>
              {isLoading && <LoaderCircle className="animate-spin" size={16} />}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    );
  }, [
    action,
    item,
    type,
    name,
    isLoading,
    closeModal,
    executeAction,
  ]);

  // Check if current user is the owner
  const isOwner = user && item.owner === user.id;

  // Filter menu items based on ownership
  const menuItems: ActionItem[] = useMemo(() => {
    if (type === "folder") {
      return [
        {
          label: "Rename",
          value: "rename" as const,
          icon: <Pen size={12} />,
        },
        { label: "Move", value: "move" as const, icon: <Move size={12} /> },
        {
          label: "Delete",
          value: "delete" as const,
          icon: <Trash size={12} />,
        },
      ];
    }

    // For files, filter based on ownership
    if (isOwner) {
      // Owner can do everything
      return actionsDropdownItems;
    } else {
      // Non-owner (shared file recipient) can only view and download
      return actionsDropdownItems.filter(
        (item) => item.value === "download" || item.value === "details"
      );
    }
  }, [type, isOwner]);

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="shad-no-focus"
          onClick={(e) => e.stopPropagation()}
        >
          <EllipsisVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
          <DropdownMenuLabel className="max-w-[200px] truncate">
            {item.name}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {menuItems.map((m) => (
            <DropdownMenuItem
              key={m.value}
              className="shad-dropdown-item"
              onClick={(e) => {
                e.stopPropagation();
                if (m.value === "download") {
                  handleDownload();
                } else if (m.value === "share") {
                  setIsShareDialogOpen(true);
                } else {
                  setAction(m);
                  setIsModalOpen(true);
                }
              }}
            >
              <div className="flex items-center gap-2">
                {m.icon} {m.label}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {dialogContent}
      {type === "file" && (
        <ShareDialog
          fileId={item.id}
          fileName={item.name}
          isOpen={isShareDialogOpen}
          onClose={() => setIsShareDialogOpen(false)}
        />
      )}
    </Dialog>
  );
};

export default ActionDropdown;
