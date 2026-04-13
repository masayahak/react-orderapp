import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import NewOrderPage from "@/app/(protected)/order/new/page";

// ─── モック設定 ───────────────────────────────────────

vi.mock("@/lib/auth-guard", () => ({
  requireSession: vi.fn().mockResolvedValue({
    user: { id: "test-user-id", name: "テストユーザー", role: "user" },
  }),
}));

vi.mock("lucide-react", () => ({
  Loader2: () => <div data-testid="loader2-icon" />,
}));

vi.mock("@/app/(protected)/order/_components/受注FormServer", () => ({
  OrderFormServer: ({ mode }: { mode: string }) => (
    <div data-testid="mock-order-form-server" data-mode={mode} />
  ),
}));

// ─── テスト ───────────────────────────────────────────

// ─── 認可チェック ─────────────────────────────────────

describe("認可チェック", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ページレンダリング時に requireSession が呼ばれること", async () => {
    const { requireSession } = await import("@/lib/auth-guard");
    const pageElement = await NewOrderPage();
    render(pageElement);

    expect(requireSession).toHaveBeenCalledOnce();
  });
});

describe("受注新規作成ページ", () => {
  it("OrderFormServer が create モードで表示されること", async () => {
    const pageElement = await NewOrderPage();
    render(pageElement);

    const formServer = screen.getByTestId("mock-order-form-server");
    expect(formServer).toBeInTheDocument();
    expect(formServer).toHaveAttribute("data-mode", "create");
  });
});
