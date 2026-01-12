"use client";

import React from "react";
import FormattedDateTime from "@/components/FormattedDateTime";
import ActionDropdown from "./ActionDropdown";
import Thumbnail from "./Thumbnail";
import Link from "next/link";
import { convertFileSize } from "@/lib/utils/file";

interface Props {
  file: FileDocumentType;
}

const FileCard = ({ file }: Props) => {
  return (
    <div key={file.id || file.$id} className="file-card">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`documents/${file.id}?title=${file.name}`}
          target="_blank"
          className="flex min-w-0 flex-1 items-center gap-3 "
        >
          <Thumbnail extension={file.extension} />
          <div className="flex min-w-0 flex-1 flex-col gap-1 ">
            <p className="subtitle-2 truncate text-light-100 ">{file.name}</p>
            <div className="caption flex flex-col gap-2 text-light-200">
              <span>{convertFileSize(file.size)}</span>

              <FormattedDateTime date={file.createdAt || ""} />
            </div>
          </div>
        </Link>
        <ActionDropdown item={file} type="file" />
      </div>
    </div>
  );
};

export default FileCard;
