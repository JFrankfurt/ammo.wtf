import LogoutButton from "@/src/components/LogoutButton";
import Link from "next/link";
import { PropsWithChildren } from "react";

export default function Layout(props: PropsWithChildren<{}>) {
  return (
    <div>
      <nav className="sticky top-0 z-10 bg-slate-900 transition-colors text-gray-200 shadow-lg">
        <div className="container mx-auto flex justify-end gap-3 items-center p-4">
          <Link href="/ship-ammo" className="hover:text-gray-300">
            ship ammo
          </Link>
          <Link href="/settings" className="hover:text-gray-300">
            settings
          </Link>
          <LogoutButton />
        </div>
      </nav>
      <main>{props.children}</main>
    </div>
  );
}
