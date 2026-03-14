import { Loader2 } from "lucide-react";
import { Suspense } from "react";

import { requireSession } from "@/lib/auth-guard";

import { OrderFormServer } from "../_components/受注FormServer";

interface EditOrderPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditOrderPage({ params }: EditOrderPageProps) {
  // 認証判定
  requireSession();

  const { id } = await params;

  return (
    <main className="min-h-screen bg-slate-50/50 py-8">
      <Suspense
        fallback={
          <div className="flex justify-center pt-20">
            <Loader2 className="animate-spin h-10 w-10 text-slate-400" />
          </div>
        }
      >
        <OrderFormServer mode={"edit"} id={id} />
      </Suspense>
    </main>
  );
}
