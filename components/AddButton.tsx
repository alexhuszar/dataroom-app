"use client";

import { useState, useRef } from "react";
import { Plus, FolderPlus, Upload, ChevronDown } from "lucide-react";
import { useParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import CreateFolderDialog from "@/components/CreateFolderDialog";
import FileUploader, { FileUploaderHandle } from "@/components/FileUploader";

interface Props {
  ownerId: string;
  accountId: string;
}

const AddButton = ({ ownerId, accountId }: Props) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const fileUploaderRef = useRef<FileUploaderHandle>(null);
  const params = useParams();
  const currentFolderId = (params?.id as string) || null;

  const handleUploadClick = () => {
    setIsDropdownOpen(false);
    fileUploaderRef.current?.openFilePicker();
  };

  const handleCreateFolderClick = () => {
    setIsDropdownOpen(false);
    setIsFolderDialogOpen(true);
  };


  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button className=" xs:rounded-full flex items-center gap-2 rounded-xl">
            <Plus size={20} />
            <span className="inline">Add</span>
            <ChevronDown size={16} className="ml-1 hidden sm:inline" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="min-w-[180px]">
          <DropdownMenuItem
            onClick={handleUploadClick}
            className="flex cursor-pointer items-center gap-3"
          >
            <Upload size={18} />
            <span>Upload File</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleCreateFolderClick}
            className="flex cursor-pointer items-center gap-3"
          >
            <FolderPlus size={18} />
            <span>Create Folder</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>


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

export default AddButton;
