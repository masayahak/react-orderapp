import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import EditOrderPage from "@/app/(protected)/order/[id]/page";

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
  OrderFormServer: ({ mode, id }: { mode: string; id?: string }) => (
    <div
      data-testid="mock-order-form-server"
      data-mode={mode}
      data-id={id ?? ""}
    />
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
    const params = Promise.resolve({ id: "order-uuid-001" });
    const pageElement = await EditOrderPage({ params });
    render(pageElement);

    expect(requireSession).toHaveBeenCalledOnce();
  });
});

describe("受注編集ページ", () => {
  it("OrderFormServer が edit モードで表示されること", async () => {
    const params = Promise.resolve({ id: "order-uuid-001" });
    const pageElement = await EditOrderPage({ params });
    render(pageElement);

    const formServer = screen.getByTestId("mock-order-form-server");
    expect(formServer).toBeInTheDocument();
    expect(formServer).toHaveAttribute("data-mode", "edit");
  });

  it("URL の id が OrderFormServer に渡されること", async () => {
    const params = Promise.resolve({ id: "order-uuid-001" });
    const pageElement = await EditOrderPage({ params });
    render(pageElement);

    expect(screen.getByTestId("mock-order-form-server")).toHaveAttribute(
      "data-id",
      "order-uuid-001",
    );
  });
});
