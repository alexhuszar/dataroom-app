"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { useBreadcrumbs } from "@/lib/hooks/useBreadcrumbs";

export const Breadcrumb = () => {
  const breadcrumbs = useBreadcrumbs();

  return (
    <nav className="flex items-center space-x-2 text-sm text-light-100">
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.id ?? "root"}>
          {index > 0 && <ChevronRight size={16} className="text-light-100" />}

          {index === breadcrumbs.length - 1 ? (
            <span className="flex items-center gap-1 font-semibold text-light-100">
              {crumb.id === null ?  <><Home size={14} /> Board</>: crumb.name}
            </span>
          ) : (
            <Link
              href={crumb.url}
              className="flex items-center gap-1 transition-colors hover:text-brand"
            >
              {crumb.id === null ? <><Home size={14} /> Board</> : crumb.name}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
