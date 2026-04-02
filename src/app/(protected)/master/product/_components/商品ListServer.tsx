import { 商品Repository } from "@/db/repository/商品Repository";
import { env } from "@/env";

import { ProductList } from "./商品List";

export async function ProductListServer({
  query,
  page,
}: {
  query: string;
  page: number;
}) {
  const pageSize = env.PAGE_ROW_COUNT;

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
