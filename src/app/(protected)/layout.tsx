import { Suspense } from "react";

import NavigationServer from "@/components/NavigationServer";

function NavigationSkeleton() {
  return (
    <div className="sticky top-0 z-50 w-full border-b border-zinc-700 bg-indigo-900 h-14" />
  );
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* 
        認証状態を確認してNavを表示している
        DB接続が必要なので、ここをSuspenseしないと
        childrenの中でどれだけSuspenseしていても
        children全体のレンダリングが始まらない
       */}
      <Suspense fallback={<NavigationSkeleton />}>
        <NavigationServer />
      </Suspense>
      {children}
    </>
  );
}
