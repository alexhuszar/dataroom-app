"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { db } from "@/lib/db/indexeddb";

export function useIndexedDBSync() {
  const { data: session, status } = useSession();

  const email = session?.user?.email;
  const user = session?.user;

  useEffect(() => {
    if (status !== "authenticated" || !user || !email) return;

    const syncUser = async () => {
      try {
        await db.init();

        const exists = await db.getUserByEmail(email);

        if (exists) return;

        await db.createUser({
          email: user.email || "",
          name: user.name ?? "",
          provider: user.provider as "credentials" | "google",
          accountId: email,
        });

        console.log("User synced to IndexedDB:", email);
      } catch (error) {
        console.error("Failed to sync user to IndexedDB:", error);
      }
    };

    syncUser();
  }, [status, session, email, user]);
}
