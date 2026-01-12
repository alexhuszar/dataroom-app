import { File, FileText } from "lucide-react";

export const convertFileToUrl = (file: File) => URL.createObjectURL(file);
export const convertFileSize = (
  bytes: number,
  digits = 1
): string => {
  const units = ["Bytes", "KB", "MB", "GB", "TB"];

  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : digits)} ${units[unitIndex]}`;
};

export const getFileType = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (!extension) return { type: "other", extension: "" };

  const documentExtensions = [
    "pdf",
  ];

  if (documentExtensions.includes(extension))
    return { type: "document", extension };
  
  return { type: "other", extension };
};

export const getFileIcon = (
  extension: string | undefined,
) => {
  switch (extension) {
    case "pdf":
      return <FileText size={16}/>;
    default:
      return <File size={16}/>;
  }
};

export const getFileTypesParams = (type: string) => {
  switch (type) {
    case "others":
      return ["other"];
    default:
      return ["document"];
  }
};
