"use client";

import Sort from "@/components/Sort";
import AddButton from "./AddButton";
import { useAuth } from "@/lib/contexts/AuthContext";
import FolderCard from "./FolderCard";
import FileCard from "./FileCard";

interface DataTableMobileViewProps {
  folders: FolderDocumentType[];
  files: FileDocumentType[];
}
const DataTableMobileView = ({ folders, files }: DataTableMobileViewProps) => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="mt-10 flex flex-col gap-2">
      {isAuthenticated && user && (
        <AddButton ownerId={user?.id} accountId={user?.accountId} />
      )}

      <Sort />

      <div className="flex flex-col gap-3">
        {folders.map((folder) => (
          <FolderCard key={folder.id} folder={folder} />
        ))}

        {files.map((file) => (
          <FileCard key={file.id} file={file} />
        ))}
      </div>
    </div>
  );
};

export default DataTableMobileView;
