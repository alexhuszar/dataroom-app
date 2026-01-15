"use client";

import React, { useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter, useSearchParams } from "next/navigation";
import { IframePdfDocument } from "../IframePdfDocument";

export const OpenFileDialog = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const fileId = searchParams.get("fileId");
  const fileName = searchParams.get("fileName");

  const isOpen = Boolean(fileId);

  const handleClose = useCallback(
    (open: boolean) => {
      if (open) return;

      const params = new URLSearchParams(searchParams.toString());
      params.delete("fileId");
      params.delete("fileName");

      const query = params.toString();
      router.replace(query ? `?${query}` : "?", { scroll: false });
    },
    [router, searchParams]
  );

  if (!fileId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="
          shad-dialog h-[99vh]
          w-[95%]
          max-w-none
          gap-0
          overflow-hidden
        "
      >
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="truncate text-center text-light-100">
            {fileName ?? "Document"}
          </DialogTitle>
        </DialogHeader>

        <div className="size-full flex-1 overflow-hidden">
          <IframePdfDocument
            fileId={fileId}
            fileName={fileName ?? "Document"}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
