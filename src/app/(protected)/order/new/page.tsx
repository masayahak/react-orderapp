import { Loader2 } from "lucide-react"; // ローディング表示用（任意）
import { Suspense } from "react"; // 追加

import { OrderForm } from "@/app/(protected)/order/_components/受注Form";

export default function NewOrderPage() {
  // サーバーサイドで日本時間の「今日」を生成
  // Intl を使えばライブラリなしで安全に取得可能
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
  }).format(new Date()); // "2026-03-02"

  return (
    <main className="min-h-screen bg-slate-50/50 py-8">
      {/* Suspenseで囲む */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 className="animate-spin h-8 w-8 text-slate-400" />
          </div>
        }
      >
        <OrderForm mode="create" serverDate={today} />
      </Suspense>
    </main>
  );
}
