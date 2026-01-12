"use client";

import Link from "next/link";
import Image from "next/image";
import { navItems } from "@/constants";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/tailwind";

interface Props {
  fullName: string;
  email: string;
}

const Sidebar = ({ fullName, email }: Props) => {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <Link href="/dashboard" className="flex items-center gap-2">
        <Image
          src="/assets/images/logo.png"
          alt="logo"
          width={52}
          height={52}
        /> 
        <span className="h4 hidden uppercase text-brand/80 lg:block ">Dataroom</span>
      </Link>

      <nav className="sidebar-nav">
        <ul className="flex flex-1 flex-col gap-2">
          {navItems.map(({ url, name, icon }) => (
            <Link key={name} href={url} className="lg:w-full">
              <li
                className={cn(
                  "sidebar-nav-item",
                  pathname === url && "shad-active"
                )}
              >
                {icon}
                <span className="hidden lg:block">{name}</span>
              </li>
            </Link>
          ))}
        </ul>
      </nav>

      <div className="hidden lg:block">
        <p className="subtitle-2 capitalize">{fullName}</p>
        <p className="caption">{email}</p>
      </div>
    </aside>
  );
};
export default Sidebar;
