import React from "react";
import {
  Download,
  Pen,
  Info,
  Trash,
  Home,
  Share2,
  Users,
  Clock,
} from "lucide-react";
import type { ActionItem } from "@/lib/hooks/useDropdownAction";

export interface NavItem {
  name: string;
  url: string;
  icon: React.ReactNode;
}

export const navItems: NavItem[] = [
  {
    name: "Board",
    icon: <Home />,
    url: "/",
  },
  {
    name: "Recent documents",
    icon: <Clock />,
    url: "/documents",
  },
  {
    name: "Shared documents",
    icon: <Users />,
    url: "/shared",
  },
];

export const actionsDropdownItems: ActionItem[] = [
  {
    label: "Rename",
    icon: <Pen size={12} />,
    value: "rename",
  },
  {
    label: "Share",
    icon: <Share2 size={12} />,
    value: "share",
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


