"use client";

import React, { useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNavigation } from "@/components/MobileNavigation";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";
import { Loading } from "@/components/Loading";
import { OpenFileDialog } from "@/components/dialogs/OpenFileDialog";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/sign-in");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <main className="flex h-screen overflow-hidden">
      <Sidebar fullName={user.name} email={user.email} />

      <section className="flex flex-auto flex-col  overflow-hidden">
        <MobileNavigation
          $id={user.id}
          accountId={user.accountId}
          fullName={user.name}
          email={user.email}
        />
        <Header userId={user.id} accountId={user.accountId} />

        {children}
      </section>

      <OpenFileDialog />
      <Toaster />
    </main>
  );
};
export default Layout;
