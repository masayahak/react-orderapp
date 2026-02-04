import Link from "next/link";
import { Logout } from "@/components/logout";
import { requireSession } from "@/lib/auth-guard";
import NavLinks from "./NavLinks";
import { BarChart3 } from "lucide-react";

export default async function Navigation() {
  const session = await requireSession();
  const isUserAdmin = session?.user.role === "admin";
  const userName = session.user.name;
  const userRole = session.user.role;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-700 bg-indigo-900 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center justify-center text-lg font-semibold text-zinc-100 dark:text-zinc-100"
          >
            <div className="p-2.5 bg-indigo-600 mr-2">
              <BarChart3 className="h-4 w-4" />
            </div>
            受注管理デモ
          </Link>
          {/* ナビゲーションリンクは管理者とそれ以外で分ける  */}
          <NavLinks isAdmin={isUserAdmin} />
        </div>
        <div className="flex items-center gap-4">
          <>
            <span className="text-zinc-100">
              {userName}
              <span className="ml-2 rounded-full bg-amber-500 px-2 py-0.5 font-medium text-zinc-700">
                {userRole}
              </span>
            </span>
            <Logout />
          </>
        </div>
      </div>
    </nav>
  );
}
