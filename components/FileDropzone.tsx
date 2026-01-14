"use client";

import { UploadIcon } from "@radix-ui/react-icons";
import { useRef } from "react";
import FileUploader, { FileUploaderHandle } from "./FileUploader";
import { useParams } from "next/navigation";

type FileDropzoneProps = {
  ownerId: string;
  accountId: string;
};

export function FileDropzone({ ownerId, accountId }: FileDropzoneProps) {
  const params = useParams();
  const fileUploaderRef = useRef<FileUploaderHandle>(null);

  const currentFolderId = (params?.id as string) || null;

  return (
    <div className="w-full">
      <div
        className="
          flex cursor-pointer flex-col items-center justify-center
          rounded-xl border-2 border-dashed p-8 text-center transition
        "
      >
        <UploadIcon className="mb-3 size-6 text-muted-foreground" />

        <p className="text-sm font-medium">Drag & drop files here</p>

        <p className="mt-1 text-xs text-muted-foreground">or click to browse</p>

        <FileUploader
          ref={fileUploaderRef}
          ownerId={ownerId}
          accountId={accountId}
          currentFolderId={currentFolderId}
        />
      </div>
    </div>
  );
}
