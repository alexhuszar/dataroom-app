"use client";

import { useEffect, useState } from "react";
import Loading from "./Loading";

interface IframePdfDocumentProps {
  fileId: string;
  fileName: string;
}

const IframePdfDocument = ({ fileId, fileName }: IframePdfDocumentProps) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;

    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);


        const { db, STORES } = await import("@/lib/db/indexeddb");
        await db.init();
        const fileDocument = await db.get<import("@/lib/db/indexeddb").FileDocument>(
          STORES.FILES,
          fileId
        );

        if (!fileDocument) {
          throw new Error("File metadata not found");
        }
        
        const { fileStorage } = await import("@/lib/db/fileStorage");
        const storedFile = await fileStorage.getFile(fileDocument.bucketFileId);

        if (!storedFile) {
          throw new Error("File blob not found");
        }

        // Step 3: Create blob URL
        objectUrl = URL.createObjectURL(storedFile.blob);
        setBlobUrl(objectUrl);
        setLoading(false);
      } catch (err) {
        console.error("PDF loading error:", err);
        setError(err instanceof Error ? err.message : "Failed to load PDF");
        setLoading(false);
      }
    };

    loadPdf();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [fileId]);

  if (loading) {
    return <Loading />;
  }

  if (error || !blobUrl) {
    return (
      <div className="flex h-screen items-center justify-center bg-dark-100">
        <div className="text-center">
          <p className="text-lg text-light-100">Error loading PDF</p>
          <p className="mt-2 text-light-200">{error || "Failed to load PDF"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-dark-100">
      <div className="flex items-center justify-between border-b border-dark-200 p-4">
        <h1 className="text-lg font-semibold text-light-100">{fileName}</h1>
      </div>
      <div className="flex-1">
        <iframe
          data-testid="document-iframe"
          src={blobUrl}
          className="size-full border-0"
          title={fileName}
        />
      </div>
    </div>
  );
};

export { IframePdfDocument };
