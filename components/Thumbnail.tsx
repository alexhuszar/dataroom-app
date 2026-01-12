import React from "react";
import { cn } from "@/lib/utils/tailwind";
import { getFileIcon } from "@/lib/utils/file";

interface Props {
  extension: string;
  imageClassName?: string;
  className?: string;
}

export const Thumbnail = ({
  extension,
  className,
}: Props) => {
  return (
    <figure className={cn("thumbnail", className)}>
      {getFileIcon(extension)}
    </figure>
  );
};
export default Thumbnail;
