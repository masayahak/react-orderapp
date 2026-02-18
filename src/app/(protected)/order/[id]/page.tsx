import { notFound } from "next/navigation";
import { 受注Repository } from "@/db/repository/受注Repository";
import { OrderForm } from "@/app/(protected)/order/_components/OrderForm";

interface EditOrderPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditOrderPage({ params }: EditOrderPageProps) {
  const { id } = await params;
  const order = await 受注Repository.GetById(id);
  if (!order) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50/50 py-8">
      <OrderForm
        mode="edit"
        initialData={{
          ...order,
          受注ID: order.受注ID!,
        }}
      />{" "}
    </main>
  );
}
