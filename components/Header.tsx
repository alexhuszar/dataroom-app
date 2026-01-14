"use client";

import React from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import Breadcrumb from "./Breadcrumb";
import { navItems } from "@/constants";
import ActionButtons from "./ActionButtons";

const Header = ({
  userId,
  accountId,
}: {
  userId: string;
  accountId: string;
}) => {
  const pathname = usePathname();

  const activeItem = navItems.find(
    (item) => item.url === pathname && pathname !== "/"
  );

  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  return (
    <header className="header">
      {activeItem ? (
        <span className="text-light-100">{activeItem.name}</span>
      ) : (
        <Breadcrumb />
      )}
      <div className="header-wrapper">
        <ActionButtons ownerId={userId} accountId={accountId} />
        <Button onClick={handleSignOut} className="sign-out-button">
          <LogOut />
        </Button>
      </div>
    </header>
  );
};
export default Header;
