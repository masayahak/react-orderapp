import Link from "next/link";
import { Logout } from "@/components/logout";
import { requireSession } from "@/lib/auth-guard";
import NavLinks from "./NavLinks";

export default async function Navigation() {
  const session = await requireSession();
  const isUserAdmin = session?.user.role === "admin";
  const userName = session.user.name;
  const userRole = session.user.role;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
          >
            受注管理デモ
          </Link>
          {/* ナビゲーションリンクは管理者とそれ以外で分ける  */}
          <NavLinks isAdmin={isUserAdmin} />
        </div>
        <div className="flex items-center gap-4">
          <>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {userName}
              <span className="ml-2 rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
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
