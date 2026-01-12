"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/db/indexeddb";
import { useAuth } from "@/lib/contexts/AuthContext";

export function useBreadcrumbs(): BreadcrumbItem[] {
  const params = useParams();
  const folderId = (params?.id as string) || null;
  const { user } = useAuth();

  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: null, name: "Root", url: "/" }
  ]);

  useEffect(() => {
    const buildBreadcrumbs = async () => {
      if (folderId === null) {
        setBreadcrumbs([{ id: null, name: "Root", url: "/" }]);
        return;
      }

      if (!user) return;

      await db.init();
      const userFolders = await db.getAllFoldersByUser(user.id);
      const trail: BreadcrumbItem[] = [];
      let currentId: string | null = folderId;

      while (currentId !== null) {
        const folder = userFolders.find(f => f.id === currentId);
        if (!folder) break;

        trail.unshift({
          id: folder.id,
          name: folder.name,
          url: `/${folder.id}`,
        });

        currentId = folder.parentId;
      }

      trail.unshift({ id: null, name: "Root", url: "/" });
      setBreadcrumbs(trail);
    };

    buildBreadcrumbs();
  }, [folderId, user]);

  return breadcrumbs;
}
