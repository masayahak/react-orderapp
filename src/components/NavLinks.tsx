"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLinksProps = {
  isAdmin: boolean;
};

export default function NavLinks({ isAdmin }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1">
      {/* 管理者ページへのリンクは、管理者のみ表示 */}
      {isAdmin && (
        <Link
          href="/master/product"
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            pathname === "/master/product"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          }`}
        >
          商品マスタ
        </Link>
      )}
      <Link
        href="/user"
        className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
          pathname === "/user"
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        }`}
      >
        一般ページ
      </Link>
    </div>
  );
}
