import { formatDateTime } from "@/lib/utils/date";
import React from "react";


export const FormattedDateTime = ({
  date,
  className,
}: {
  date: string;
  className?: string;
}) => {
  return (
    <span className={ className}>
      {formatDateTime(date)}
    </span>
  );
};
export default FormattedDateTime;
