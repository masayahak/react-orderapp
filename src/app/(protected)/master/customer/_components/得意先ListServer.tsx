import { 得意先Repository } from "@/db/repository/得意先Repository";
import { env } from "@/env";

import { CustomerList } from "./得意先List";

export async function CustomerListServer({
  query,
  page,
}: {
  query: string;
  page: number;
}) {
  const pageSize = env.PAGE_ROW_COUNT;

  // データフェッチをコンポーネントのすぐそばで行う
  const { items, totalCount } = await 得意先Repository.Search(
    query,
    page,
    pageSize,
  );

  return (
    <CustomerList
      pageData={items}
      totalCount={totalCount}
      pageSize={pageSize}
    />
  );
}
