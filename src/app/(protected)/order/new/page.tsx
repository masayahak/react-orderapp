import { Loader2 } from "lucide-react"; // ローディング表示用（任意）
import { Suspense } from "react"; // 追加

import { requireSession } from "@/lib/auth-guard";

import { OrderFormServer } from "../_components/受注FormServer";

export default async function NewOrderPage() {
  // 認証判定
  await requireSession();

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
        <OrderFormServer mode="create" />
      </Suspense>
    </main>
  );
}
