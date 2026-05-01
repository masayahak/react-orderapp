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
      <Suspense fallback={<NavigationSkeleton />}>
        <NavigationServer />
      </Suspense>
      {children}
    </>
  );
}
