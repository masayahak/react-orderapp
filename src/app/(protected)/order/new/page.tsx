import { OrderForm } from "@/app/(protected)/order/_components/受注Form";

export default function NewOrderPage() {
  return (
    <main className="min-h-screen bg-slate-50/50 py-8">
      <OrderForm mode="create" />
    </main>
  );
}
