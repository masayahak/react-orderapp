import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// テスト対象のコンポーネント（Server Component）
import LoginPage from "@/app/login/page";

// --- モックの設定 ---

// 1. next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Map()),
}));

// 2. next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: vi.fn().mockReturnValue({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// 3. @/lib/auth
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue(null), // 未ログイン状態をシミュレーション
    },
  },
}));

// 4. lucide-react (Client Component 内で使われているアイコン等のエラーを防ぐため)
vi.mock("lucide-react", () => ({
  Loader2: () => <div data-testid="loader2-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  EyeOff: () => <div data-testid="eye-off-icon" />,
  Check: () => <div data-testid="check-icon" />,
  ChevronsUpDown: () => <div data-testid="chevrons-up-down-icon" />,
  Search: () => <div data-testid="search-icon" />,
  LogOut: () => <div data-testid="log-out-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  User: () => <div data-testid="user-icon" />,
}));

describe("Login Page Rendering", () => {
  it("初期レンダリングでテスト用アカウントの案内文が表示されること", async () => {
    // Server Component (非同期関数) を呼び出して JSX を取得
    const pageElement = await LoginPage();

    // JSX を render で評価
    render(pageElement);

    // テキストが表示されているか確認
    expect(screen.getByText("テスト用のアカウントを用意しています。")).toBeInTheDocument();
    expect(screen.getByText("test@example.com / kyouhayuki")).toBeInTheDocument();
    expect(screen.getByText("admin@test.com / admintarou")).toBeInTheDocument();
  });

  it("セッションがある場合は /dashboard にリダイレクトされること", async () => {
    const { auth } = await import("@/lib/auth");
    const { redirect } = await import("next/navigation");
    vi.mocked(auth.api.getSession).mockResolvedValueOnce({
      user: { id: "user-id", name: "テストユーザー", email: "test@example.com" },
      session: { id: "session-id" },
    } as never);

    await LoginPage();

    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });
});
