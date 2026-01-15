"use client";

import React, {
  forwardRef,
  useImperativeHandle,
  useCallback,
  useRef,
  useState,
} from "react";
import { Thumbnail } from "@/components/Thumbnail";
import { useToast } from "@/lib/hooks/useToast";
import { useFile } from "@/lib/contexts/FileContext";
import { getFileType } from "@/lib/utils/file";
import { Loader2 } from "lucide-react";

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface Props {
  ownerId: string;
  accountId: string;
  currentFolderId: string | null;
}

export interface FileUploaderHandle {
  openFilePicker: () => void;
  handleFiles: (files: File[]) => void;
}

type UploadingFile = {
  id: string;
  file: File;
};

export const FileUploader = forwardRef<FileUploaderHandle, Props>(
  ({ ownerId, accountId, currentFolderId }, ref) => {
    const { toast } = useToast();
    const { uploadFile } = useFile();
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploads, setUploads] = useState<UploadingFile[]>([]);

    const removeUpload = useCallback((id: string) => {
      setUploads((prev) => prev.filter((u) => u.id !== id));
    }, []);

    const handleFiles = useCallback(
      async (files: File[]) => {
        const validUploads: UploadingFile[] = [];

        for (const file of files) {
          if (file.size > MAX_FILE_SIZE) {
            toast({
              description: (
                <p className="body-2 text-white">
                  <span className="font-semibold">{file.name}</span> is too large.
                  Max file size is 10MB.
                </p>
              ),
              className: "error-toast",
            });
            continue;
          }

          validUploads.push({
            id: crypto.randomUUID(),
            file,
          });
        }

        if (!validUploads.length) return;

        setUploads((prev) => [...prev, ...validUploads]);

        await Promise.all(
          validUploads.map(async ({ id, file }) => {
            try {
              const uploaded = await uploadFile(
                file,
                ownerId,
                accountId,
                currentFolderId
              );
              if (uploaded) removeUpload(id);
            } catch {
              removeUpload(id);
            }
          })
        );
      },
      [ownerId, accountId, currentFolderId, uploadFile, toast, removeUpload]
    );

    useImperativeHandle(ref, () => ({
      openFilePicker: () => inputRef.current?.click(),
      handleFiles,
    }));

    return (
      <>
        {/* Hidden file input for button-triggered uploads */}
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleFiles(Array.from(e.target.files));
              e.target.value = "";
            }
          }}
        />

        {uploads.length > 0 && (
          <div className="fixed bottom-4 right-4 z-50 max-w-sm">
            <ul className="uploader-preview-list">
              <h4 className="h4 text-light-100">Uploading</h4>

              {uploads.map(({ id, file }) => {
                const { extension } = getFileType(file.name);

                return (
                  <li key={id} className="uploader-preview-item">
                    <div className="flex items-center gap-3">
                      <Thumbnail extension={extension} />
                      <div className="preview-item-name">
                        <span className="block truncate">{file.name}</span>
                        <Loader2
                          size={12}
                          className="animate-spin text-brand"
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

