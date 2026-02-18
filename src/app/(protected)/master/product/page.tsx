import { ItemList } from "@/app/(protected)/master/product/_components/ItemList";
import { 商品Repository } from "@/db/repository/商品Repository";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const page = Number(params.page) || 1;

  const pageSize = Number(process.env.PAGE_ROW_COUNT) || 20;

  // リポジトリから「データ」と「件数」を両方受け取る
  const { items, totalCount } = await 商品Repository.Search(
    query,
    page,
    pageSize,
  );

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">商品マスタメンテナンス</h1>
      <ItemList
        initialData={items}
        totalCount={totalCount}
        pageSize={pageSize}
      />
    </main>
  );
}
