import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CustomerListServer } from "@/app/(protected)/master/customer/_components/得意先ListServer";

// ─── モック設定 ───────────────────────────────────────

vi.mock("@/env", () => ({
  env: { PAGE_ROW_COUNT: 20 },
}));

vi.mock("@/db/repository/得意先Repository", () => ({
  得意先Repository: {
    Search: vi.fn().mockResolvedValue({
      items: [
        { 得意先ID: "uuid-001", 得意先名: "テスト株式会社", 電話番号: "03-1234-5678", version: 0 },
      ],
      totalCount: 1,
    }),
  },
}));

vi.mock(
  "@/app/(protected)/master/customer/_components/得意先List",
  () => ({
    CustomerList: () => <div data-testid="mock-customer-list" />,
  }),
);

// ─── テスト ───────────────────────────────────────────

describe("CustomerListServer コンポーネント", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("CustomerList が表示されること", async () => {
    const element = await CustomerListServer({ query: "", page: 1 });
    render(element);

    expect(screen.getByTestId("mock-customer-list")).toBeInTheDocument();
  });

  it("Repository が正しい引数で呼ばれること", async () => {
    const { 得意先Repository } = await import("@/db/repository/得意先Repository");

    await CustomerListServer({ query: "ハカマタ", page: 2 });

    expect(得意先Repository.Search).toHaveBeenLastCalledWith("ハカマタ", 2, 20);
  });
});
