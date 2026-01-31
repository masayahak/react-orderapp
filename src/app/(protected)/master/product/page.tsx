import { 商品Repository } from "@/db/repository/商品Repository";
import { ProductListClient } from "./ProductListClient";

// サーバーコンポーネントはデフォルトエクスポートにする必要がある
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const query = (await searchParams).q || "";
  const data = await 商品Repository.Search(query);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">商品マスタメンテナンス</h1>
      <ProductListClient initialData={data} />
    </main>
  );
}
