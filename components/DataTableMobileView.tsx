"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Folder } from "lucide-react";
import { Thumbnail } from "@/components/Thumbnail";
import { FormattedDateTime } from "@/components/FormattedDateTime";
import ActionDropdown from "@/components/ActionDropdown";
import { convertFileSize } from "@/lib/utils/file";
import Sort from "@/components/Sort";
import AddButton from "./AddButton";
import { useAuth } from "@/lib/contexts/AuthContext";

interface DataTableMobileViewProps {
  folders: FolderDocumentType[];
  files: FileDocumentType[];
}
const DataTableMobileView = ({ folders, files }: DataTableMobileViewProps) => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  return (
    <div className="mt-10 flex flex-col gap-2">

      {isAuthenticated && user && (
        <AddButton ownerId={user?.id} accountId={user?.accountId} />
      )}

      <Sort />

      <div className="flex flex-col gap-3">
        {folders.map((folder) => (
          <div
            key={folder.id}
            onClick={() => router.push(`/${folder.id}`)}
            className="file-card cursor-pointer"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0  flex-1 items-center gap-3 ">
                <div className="thumbnail">
                  <Folder size={24} className="text-brand" />
                </div>
                <div className="flex  min-w-0  flex-1 flex-col gap-1">
                  <p className="subtitle-2 truncate text-light-100 ">
                    {folder.name}
                  </p>
                  <div className="caption flex items-center gap-2 text-light-200">
                    <FormattedDateTime date={folder.createdAt || ""} />
                  </div>
                </div>
              </div>
              <ActionDropdown item={folder} type="folder" />
            </div>
          </div>
        ))}

        {files.map((file) => (
          <div key={file.id || file.$id} className="file-card">
            <div className="flex items-center justify-between gap-3">
              <Link
                href={`documents/${file.id}?title=${file.name}`}
                target="_blank"
                className="flex min-w-0 flex-1 items-center gap-3 "
              >
                <Thumbnail extension={file.extension} />
                <div className="flex min-w-0 flex-1 flex-col gap-1 ">
                  <p className="subtitle-2 truncate text-light-100 ">
                    {file.name}
                  </p>
                  <div className="caption flex flex-col gap-2 text-light-200">
                    <span>{convertFileSize(file.size)}</span>

                    <FormattedDateTime date={file.createdAt || ""} />
                  </div>
                </div>
              </Link>
              <ActionDropdown item={file} type="file" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataTableMobileView;
