"use client";

import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
  useState,
} from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import Thumbnail from "@/components/Thumbnail";
import { useToast } from "@/lib/hooks/useToast";
import { useFile } from "@/lib/contexts/FileContext";
import { getFileType } from "@/lib/utils/file";

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface Props {
  ownerId: string;
  accountId: string;
  currentFolderId: string | null;
}

export interface FileUploaderHandle {
  openFilePicker: () => void;
}

const FileUploader = forwardRef<FileUploaderHandle, Props>(
  ({ ownerId, accountId, currentFolderId }, ref) => {
    const { toast } = useToast();
    const { uploadFile } = useFile();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<File[]>([]);

    useImperativeHandle(ref, () => ({
      openFilePicker: () => fileInputRef.current?.click(),
    }));

    const onDrop = useCallback(
      async (acceptedFiles: File[]) => {
        setFiles(acceptedFiles);

        const uploadPromises = acceptedFiles.map(async (file) => {
          if (file.size > MAX_FILE_SIZE) {
            setFiles((prevFiles) =>
              prevFiles.filter((f) => f.name !== file.name)
            );

            return toast({
              description: (
                <p className="body-2 text-white">
                  <span className="font-semibold">{file.name}</span> is too
                  large. Max file size is 50MB.
                </p>
              ),
              className: "error-toast",
            });
          }

          return uploadFile(file, ownerId, accountId, currentFolderId).then(
            (uploadedFile) => {
              if (uploadedFile) {
                setFiles((prevFiles) =>
                  prevFiles.filter((f) => f.name !== file.name)
                );
              }
            }
          );
        });

        await Promise.all(uploadPromises);
      },
      [ownerId, accountId, uploadFile, currentFolderId, toast]
    );

    const { getRootProps, getInputProps } = useDropzone({ onDrop });

    return (
      <>
        <div {...getRootProps()} className="hidden">
          <input {...getInputProps()} ref={fileInputRef} />
        </div>

        {files.length > 0 && (
          <div className="fixed bottom-4 right-4 z-50 max-w-sm">
            <ul className="uploader-preview-list">
              <h4 className="h4 text-light-100">Uploading</h4>

              {files.map((file, index) => {
                const { extension } = getFileType(file.name);

                return (
                  <li
                    key={`${file.name}-${index}`}
                    className="uploader-preview-item"
                  >
                    <div className="flex items-center gap-3">
                      <Thumbnail extension={extension} />

                      <div className="preview-item-name">
                        {file.name}
                        <Image
                          src="/assets/icons/file-loader.gif"
                          width={80}
                          height={26}
                          alt="Loader"
                        />
                      </div>
                    </div>

                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </>
    );
  }
);

FileUploader.displayName = "FileUploader";

export default FileUploader;
