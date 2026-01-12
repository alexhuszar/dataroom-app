import React, { memo } from "react";
import Thumbnail from "@/components/Thumbnail";
import FormattedDateTime from "@/components/FormattedDateTime";
import { convertFileSize } from "@/lib/utils/file";
import { formatDateTime } from "@/lib/utils/date";

const FileHeader = memo(({ file }: { file: FileDocumentType }) => (
  <div className="file-details-thumbnail">
    <Thumbnail extension={file.extension} />
    <div className="flex flex-col">
      <p className="subtitle-2 mb-1">{file.name}</p>
      <FormattedDateTime
        date={file.createdAt ?? ""}
        className="caption"
      />
    </div>
  </div>
));
FileHeader.displayName = "FileHeader";

const DetailRow = memo(
  ({ label, value }: { label: string; value: string }) => (
    <div className="flex">
      <p className="file-details-label">{label}</p>
      <p className="file-details-value">{value}</p>
    </div>
  )
);
DetailRow.displayName = "DetailRow";

export const FileDetails = ({ file }: { file: FileDocumentType }) => (
  <>
    <FileHeader file={file} />

    <div className="space-y-4 px-2 pt-2">
      <DetailRow label="Format:" value={file.extension} />
      <DetailRow label="Size:" value={convertFileSize(file.size)} />
      <DetailRow label="Owner:" value={file.owner ?? "You"} />
      <DetailRow
        label="Last edit:"
        value={formatDateTime(file?.updatedAt || '-')}
      />
    </div>
  </>
);

