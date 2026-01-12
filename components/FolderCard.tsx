"use client";

import React from "react";
import { Folder } from "lucide-react";
import FormattedDateTime from "@/components/FormattedDateTime";
import { useRouter } from "next/navigation";
import ActionDropdown from "./ActionDropdown";

interface Props {
  folder: FolderDocumentType;
}

const FolderCard = ({ folder }: Props) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/${folder.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="file-card cursor-pointer transition-colors hover:bg-light-400/10 "
    >
      <div className="flex justify-between">
        <div className="flex items-center gap-3">
          <div className=" rounded-lg bg-brand/10 p-3">
            <Folder size={24} className="text-brand" />
          </div>
          <div>
            <p className="subtitle-2 line-clamp-1">{folder.name}</p>
            <FormattedDateTime
              date={folder.createdAt || "-"}
              className="body-2 text-light-100"
            />
          </div>
        </div>

        <div className="flex flex-col items-end justify-between">
          <ActionDropdown item={folder} type="folder" />
        </div>
      </div>
    </div>
  );
};

export default FolderCard;
