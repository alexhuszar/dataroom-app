"use client";

import React, { useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import MobileNavigation from "@/components/MobileNavigation";
import Header from "@/components/Header";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";
import Loading from "@/components/Loading";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/sign-in");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <Loading />
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <main className="flex h-screen">
      <Sidebar
        fullName={user.name}
        email={user.email}
      />

      <section className="flex h-full flex-1 flex-col">
        <MobileNavigation
          $id={user.id}
          accountId={user.accountId}
          fullName={user.name}
          email={user.email}
        />
        <Header userId={user.id} accountId={user.accountId} />
        <div className="main-content">
          <div className="dashboard-container">
            {children}
          </div>
        </div>
      </section>

      <Toaster />
    </main>
  );
};
export default Layout;
