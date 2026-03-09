import { 得意先Repository } from "@/db/repository/得意先Repository";

import { CustomerList } from "./得意先List";

export async function CustomerListServer({
  query,
  page,
}: {
  query: string;
  page: number;
}) {
  const pageSize = Number(process.env.PAGE_ROW_COUNT) || 20;

  // データフェッチをコンポーネントのすぐそばで行う
  const { items, totalCount } = await 得意先Repository.Search(
    query,
    page,
    pageSize,
  );

  return (
    <CustomerList
      initialData={items}
      totalCount={totalCount}
      pageSize={pageSize}
    />
  );
}
