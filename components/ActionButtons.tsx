"use client";

import { useState, useRef } from "react";
import { FolderPlus, Upload } from "lucide-react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import CreateFolderDialog from "@/components/CreateFolderDialog";
import FileUploader, { FileUploaderHandle } from "@/components/FileUploader";

interface Props {
  ownerId: string;
  accountId: string;
  className?: string;
}

const ActionButtons = ({ ownerId, accountId, className = "flex" }: Props) => {
  const params = useParams();
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const fileUploaderRef = useRef<FileUploaderHandle>(null);

  const currentFolderId = (params?.id as string) || null;

  const handleUploadClick = () => fileUploaderRef.current?.openFilePicker();

  const handleCreateFolderClick = () => setIsFolderDialogOpen(true);

  return (
    <>
      <div className={`flex ${className} items-center justify-end gap-3 `}>
        <Button
          variant="default"
          onClick={handleUploadClick}
          className="flex cursor-pointer items-center gap-3 bg-brand/10 text-brand"
        >
          <Upload size={18} />
          <span>Upload File</span>
        </Button>

        <Button
          onClick={handleCreateFolderClick}
          className="flex cursor-pointer items-center gap-3 bg-brand/10 text-brand"
        >
          <FolderPlus size={18} />
          <span>Create Folder</span>
        </Button>
      </div>

      <FileUploader
        ref={fileUploaderRef}
        ownerId={ownerId}
        accountId={accountId}
        currentFolderId={currentFolderId}
      />

      <CreateFolderDialog
        open={isFolderDialogOpen}
        onOpenChange={setIsFolderDialogOpen}
      />
    </>
  );
};

export default ActionButtons;
