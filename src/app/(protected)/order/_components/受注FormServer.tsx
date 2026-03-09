import { notFound } from "next/navigation";

import { 受注Repository } from "@/db/repository/受注Repository";

import { OrderForm } from "./受注Form";

interface OrderEditServerProps {
  mode: "create" | "edit";
  id?: string;
}

export async function OrderFormServer({ id, mode }: OrderEditServerProps) {
  // サーバーサイドで日本時間の「今日」を生成
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
  }).format(new Date());

  // 新規作成モード
  if (mode === "create") {
    return <OrderForm mode="create" serverDate={today} />;
  }

  // 編集モード
  if (!id) notFound(); // IDがない編集呼び出しは404

  const order = await 受注Repository.GetById(id);
  if (!order) {
    notFound();
  }

  return (
    <OrderForm
      mode={mode}
      serverDate={today}
      initialData={{
        ...order,
        受注ID: order.受注ID!,
      }}
    />
  );
}
