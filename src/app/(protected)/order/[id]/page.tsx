import { notFound } from "next/navigation";

import { OrderForm } from "@/app/(protected)/order/_components/受注Form";
import { 受注Repository } from "@/db/repository/受注Repository";

interface EditOrderPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditOrderPage({ params }: EditOrderPageProps) {
  const { id } = await params;
  const order = await 受注Repository.GetById(id);
  if (!order) {
    notFound();
  }
  // サーバーサイドで日本時間の「今日」を生成
  // Intl を使えばライブラリなしで安全に取得可能
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
  }).format(new Date()); // "2026-03-02"

  return (
    <main className="min-h-screen bg-slate-50/50 py-8">
      <OrderForm
        mode="edit"
        serverDate={today}
        initialData={{
          ...order,
          受注ID: order.受注ID!,
        }}
      />
    </main>
  );
}
