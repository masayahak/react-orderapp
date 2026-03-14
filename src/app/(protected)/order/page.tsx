import { Loader2 } from "lucide-react";
import { Suspense } from "react";

import { requireSession } from "@/lib/auth-guard";

import { OrderListServer } from "./_components/受注ListServer";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // 認証判定
  await requireSession();

  const params = await searchParams;

  return (
    <div className="flex flex-col pt-8 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          受注一覧
        </h1>
      </div>{" "}
      {/* 検索条件ごとにSuspenseで境界を作ることで、UXを向上させる */}
      <Suspense
        key={JSON.stringify(params)}
        fallback={<Loader2 className="animate-spin m-auto" />}
      >
        <OrderListServer searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
