"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLinksProps = {
  isAdmin: boolean;
};

export default function NavLinks({ isAdmin }: NavLinksProps) {
  const pathname = usePathname();

  // 共通のベーススタイル
  const baseStyle =
    "rounded-md px-4 py-2 text-sm font-medium transition-colors";

  // 受注用のスタイル（Blue系）
  const getOrderStyle = () => {
    const isActive = pathname === "/order";
    return isActive
      ? "bg-blue-600 text-white shadow-sm"
      : "text-zinc-600 hover:bg-blue-50 hover:text-blue-700 dark:text-zinc-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-200";
  };

  // マスタ用のスタイル（Amber系）
  const getMasterStyle = (path: string) => {
    const isActive = pathname === path;
    return isActive
      ? "bg-amber-600 text-white shadow-sm"
      : "text-zinc-600 hover:bg-amber-50 hover:text-amber-700 dark:text-zinc-400 dark:hover:bg-amber-900/30 dark:hover:text-amber-200";
  };

  return (
    <div className="flex items-center gap-1">
      {/* 受注セクション */}
      <Link href="/order" className={`${baseStyle} ${getOrderStyle()}`}>
        受注
      </Link>

      {/* 区切り線（オプション：視覚的なセパレーター） */}
      {isAdmin && (
        <div className="mx-2 h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
      )}

      {/* 管理者用マスタセクション */}
      {isAdmin && (
        <>
          <Link
            href="/master/product"
            className={`${baseStyle} ${getMasterStyle("/master/product")}`}
          >
            商品マスタ
          </Link>
          <Link
            href="/master/customer"
            className={`${baseStyle} ${getMasterStyle("/master/customer")}`}
          >
            得意先マスタ
          </Link>
        </>
      )}
    </div>
  );
}
