import { Loader2 } from "lucide-react";
import { Suspense } from "react";

import { requireAdmin } from "@/lib/auth-guard";

import { CustomerListServer } from "./_components/得意先ListServer";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">得意先マスタメンテナンス</h1>
      {/* 検索条件ごとにSuspenseで境界を作ることで、UXを向上させる */}
      <Suspense
        key={JSON.stringify(params)}
        fallback={<Loader2 className="animate-spin m-auto" />}
      >
        <CustomerListServer
          query={params.q || ""}
          page={Number(params.page) || 1}
        />
      </Suspense>
    </main>
  );
}
