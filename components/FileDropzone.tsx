"use client";

import { UploadIcon } from "@radix-ui/react-icons";
import { useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { FileUploader, FileUploaderHandle } from "./FileUploader";
import { useParams } from "next/navigation";

type FileDropzoneProps = {
  ownerId: string;
  accountId: string;
};

export function FileDropzone({ ownerId, accountId }: FileDropzoneProps) {
  const params = useParams();
  const uploaderRef = useRef<FileUploaderHandle>(null);

  const currentFolderId = (params?.id as string) || null;

  const onDrop = useCallback(
    (files: File[]) => {
      uploaderRef.current?.handleFiles(files);
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    noClick: false,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          flex cursor-pointer flex-col items-center justify-center
          rounded-xl border-2 border-dashed p-8 text-center transition
          ${
            isDragActive
              ? "border-brand bg-brand/5"
              : "border-muted hover:border-brand"
          }
        `}
      >
        <input {...getInputProps()} />

        <UploadIcon className="mb-3 size-6 text-muted-foreground" />

        <p className="text-sm font-medium">
          Drag & drop files here
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          or click to browse
        </p>
      </div>

      <FileUploader
        ref={uploaderRef}
        ownerId={ownerId}
        accountId={accountId}
        currentFolderId={currentFolderId}
      />
    </div>
  );
}
