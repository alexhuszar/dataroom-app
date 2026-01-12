"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "./AuthContext";
import { FileProvider } from "./FileContext";
import { FolderProvider } from "./FolderContext";
import { ShareProvider } from "./ShareContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <FolderProvider>
          <FileProvider>
            <ShareProvider>{children}</ShareProvider>
          </FileProvider>
        </FolderProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
