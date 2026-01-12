"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import { Separator } from "@radix-ui/react-separator";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import FileUploader from "@/components/FileUploader";
import { navItems } from "@/constants";
import { cn } from "@/lib/utils/tailwind";
import { useAuth } from "@/lib/contexts/AuthContext";

interface MobileNavigationProps {
  $id: string;
  accountId: string;
  fullName: string;
  email: string;
}

const MobileNavigation = ({
  $id: ownerId,
  accountId,
  fullName,
  email,
}: MobileNavigationProps) => {
  const pathname = usePathname();
  const params = useParams();
  const { signOut } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const currentFolderId = (params?.id as string) || null;

  const closeSheet = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    closeSheet();
  }, [signOut, closeSheet]);

  return (
    <header className="mobile-header">
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/assets/images/logo.png"
          alt="Dataroom"
          width={36}
          height={36}
          priority
          className="w-auto"
        />
      </Link>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger aria-label="Open menu">
          <Menu size={24} />
        </SheetTrigger>

        <SheetContent className="shad-sheet h-screen px-3">
          <SheetTitle>
            <div className="p-4 sm:hidden lg:block">
              <p className="subtitle-2 capitalize">{fullName}</p>
              <p className="caption">{email}</p>
            </div>
            <Separator className="mb-4 bg-light-200/20" />
          </SheetTitle>

          <nav className="mobile-nav">
            <ul className="mobile-nav-list">
              {navItems.map(({ url, name, icon }) => (
                <li key={name}>
                  <Link
                    href={url}
                    onClick={closeSheet}
                    className={cn(
                      "mobile-nav-item",
                      pathname === url && "shad-active"
                    )}
                  >
                    {icon}
                    <span>{name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Separator className="my-5 bg-light-200/20" />

          <div className="flex flex-col gap-5 pb-5">
            <FileUploader
              ownerId={ownerId}
              accountId={accountId}
              currentFolderId={currentFolderId}
            />

            <Button
              type="button"
              className="mobile-sign-out-button"
              onClick={handleSignOut}
            >
              <LogOut size={20} />
              <span>Logout</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
};

export default MobileNavigation;
