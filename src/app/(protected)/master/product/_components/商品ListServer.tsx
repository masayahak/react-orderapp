import { 商品Repository } from "@/db/repository/商品Repository";

import { ProductList } from "./商品List";

export async function ProductListServer({
  query,
  page,
}: {
  query: string;
  page: number;
}) {
  const pageSize = Number(process.env.PAGE_ROW_COUNT) || 20;

  // データフェッチをコンポーネントのすぐそばで行う
  const { items, totalCount } = await 商品Repository.Search(
    query,
    page,
    pageSize,
  );

  return (
    <ProductList
      initialData={items}
      totalCount={totalCount}
      pageSize={pageSize}
    />
  );
}
