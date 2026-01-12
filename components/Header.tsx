"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import AddButton from "@/components/AddButton";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Breadcrumb from "./Breadcrumb";

const Header = ({
  userId,
  accountId,
}: {
  userId: string;
  accountId: string;
}) => {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  return (
    <header className="header">
      <Breadcrumb />
      <div className="header-wrapper">
        <AddButton ownerId={userId} accountId={accountId} />
        <Button onClick={handleSignOut} className="sign-out-button">
          <LogOut />
        </Button>
      </div>

    </header>
  );
};
export default Header;
