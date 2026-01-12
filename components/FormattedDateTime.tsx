import { formatDateTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/tailwind";
import React from "react";


export const FormattedDateTime = ({
  date,
  className,
}: {
  date: string;
  className?: string;
}) => {
  return (
    <p className={cn("body-1 text-light-200", className)}>
      {formatDateTime(date)}
    </p>
  );
};
export default FormattedDateTime;
