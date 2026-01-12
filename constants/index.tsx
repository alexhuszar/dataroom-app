import React from "react";
import {
  Download,
  FileText,
  Pen,
  Info,
  Trash,
  Home,
} from "lucide-react";
import type { ActionItem } from "@/lib/hooks/useDropdownAction";

export const navItems = [
  {
    name: "Home",
    icon: <Home />,
    url: "/",
  },
  {
    name: "Recent documents",
    icon: <FileText />,
    url: "/documents",
  },
];

export const actionsDropdownItems: ActionItem[] = [
  {
    label: "Rename",
    icon: <Pen size={12} />,
    value: "rename",
  },
  {
    label: "Download",
    icon: <Download size={12} />,
    value: "download",
  },
  {
    label: "Delete",
    icon: <Trash size={12} />,
    value: "delete",
  },
  {
    label: "Details",
    icon: <Info size={12} />,
    value: "details",
  }
];

export const sortTypes = [
  {
    label: "Date created (newest)",
    value: "createdAt-desc",
  },
  {
    label: "Created Date (oldest)",
    value: "createdAt-asc",
  },
  {
    label: "Name (A-Z)",
    value: "name-asc",
  },
  {
    label: "Name (Z-A)",
    value: "name-desc",
  },
  {
    label: "Size (Highest)",
    value: "size-desc",
  },
  {
    label: "Size (Lowest)",
    value: "size-asc",
  },
];


