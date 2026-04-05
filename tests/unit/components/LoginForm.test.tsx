import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/app/login/_components/LoginForm";

// ─── モック設定 ───────────────────────────────────────

const { mockPush, mockRefresh, mockPrefetch, mockSignInEmail } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
  mockPrefetch: vi.fn(),
  mockSignInEmail: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    prefetch: mockPrefetch,
  }),
}));

vi.mock("@/lib/auth-client", () => ({
  signIn: {
    email: mockSignInEmail,
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("lucide-react", () => ({
  Eye: () => <div data-testid="eye-icon" />,
  EyeOff: () => <div data-testid="eye-off-icon" />,
  Loader2: () => <div data-testid="loader2-icon" />,
}));

// ─── ヘルパー ─────────────────────────────────────────

function fillAndSubmit(email: string, password: string) {
  fireEvent.change(screen.getByPlaceholderText("m@example.com"), {
    target: { value: email },
  });
  fireEvent.change(screen.getByPlaceholderText("パスワードを入力…"), {
    target: { value: password },
  });
  fireEvent.submit(screen.getByRole("button", { name: "ログイン" }).closest("form")!);
}

// ─── テスト ───────────────────────────────────────────

describe("LoginForm コンポーネント", () => {
  describe("初期表示", () => {
    it("タイトル「受注管理アプリ デモ」が表示されること", () => {
      render(<LoginForm />);
      expect(screen.getByText("受注管理アプリ デモ")).toBeInTheDocument();
    });

    it("メールアドレスフィールドが表示されること", () => {
      render(<LoginForm />);
      expect(screen.getByPlaceholderText("m@example.com")).toBeInTheDocument();
    });

    it("パスワードフィールドが表示されること", () => {
      render(<LoginForm />);
      expect(screen.getByPlaceholderText("パスワードを入力…")).toBeInTheDocument();
    });

    it("「ログイン」ボタンが表示されること", () => {
      render(<LoginForm />);
      expect(screen.getByRole("button", { name: "ログイン" })).toBeInTheDocument();
    });

    it("「アカウント作成」リンクが表示されること", () => {
      render(<LoginForm />);
      expect(screen.getByRole("link", { name: "アカウント作成" })).toBeInTheDocument();
    });

    it("初期状態ではパスワードが非表示（type=password）であること", () => {
      render(<LoginForm />);
      expect(screen.getByPlaceholderText("パスワードを入力…")).toHaveAttribute("type", "password");
    });
  });

  describe("パスワード表示切替", () => {
    it("目のアイコンをクリックするとパスワードが表示される（type=text）こと", () => {
      render(<LoginForm />);
      fireEvent.click(screen.getByTestId("eye-icon").parentElement!);
      expect(screen.getByPlaceholderText("パスワードを入力…")).toHaveAttribute("type", "text");
    });

    it("もう一度クリックするとパスワードが非表示（type=password）に戻ること", () => {
      render(<LoginForm />);
      const toggleBtn = screen.getByTestId("eye-icon").parentElement!;
      fireEvent.click(toggleBtn);
      fireEvent.click(screen.getByTestId("eye-off-icon").parentElement!);
      expect(screen.getByPlaceholderText("パスワードを入力…")).toHaveAttribute("type", "password");
    });
  });

  describe("バリデーション", () => {
    it("メールアドレスが空のままサブミットするとエラーが表示されること", async () => {
      render(<LoginForm />);
      fireEvent.submit(screen.getByRole("button", { name: "ログイン" }).closest("form")!);
      await waitFor(() => {
        expect(screen.getByText("正しいメールアドレスの形式で入力してください")).toBeInTheDocument();
      });
    });

    it("不正なメール形式でサブミットするとバリデーションエラーが表示されること", async () => {
      render(<LoginForm />);
      fireEvent.change(screen.getByPlaceholderText("m@example.com"), {
        target: { value: "invalid-email" },
      });
      fireEvent.submit(screen.getByRole("button", { name: "ログイン" }).closest("form")!);
      await waitFor(() => {
        expect(screen.getByText("正しいメールアドレスの形式で入力してください")).toBeInTheDocument();
      });
    });

    it("パスワードが空のままサブミットすると「パスワードは必須です」が表示されること", async () => {
      render(<LoginForm />);
      fireEvent.change(screen.getByPlaceholderText("m@example.com"), {
        target: { value: "test@example.com" },
      });
      fireEvent.submit(screen.getByRole("button", { name: "ログイン" }).closest("form")!);
      await waitFor(() => {
        expect(screen.getByText("パスワードは必須です")).toBeInTheDocument();
      });
    });
  });

  describe("ログイン成功", () => {
    it("正常な値でサブミットすると signIn.email が呼ばれること", async () => {
      mockSignInEmail.mockImplementation(async (_creds: unknown, { onSuccess }: { onSuccess: () => void }) => {
        onSuccess();
      });
      render(<LoginForm />);
      fillAndSubmit("test@example.com", "password123");
      await waitFor(() => {
        expect(mockSignInEmail).toHaveBeenCalledWith(
          { email: "test@example.com", password: "password123" },
          expect.objectContaining({ onSuccess: expect.any(Function) }),
        );
      });
    });

    it("ログイン成功後に router.refresh() と router.push('/') が呼ばれること", async () => {
      mockSignInEmail.mockImplementation(async (_creds: unknown, { onSuccess }: { onSuccess: () => void }) => {
        onSuccess();
      });
      render(<LoginForm />);
      fillAndSubmit("test@example.com", "password123");
      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/");
      });
    });
  });

  describe("ログイン失敗", () => {
    it("ログイン失敗時に toast.error が呼ばれること", async () => {
      const { toast } = await import("sonner");
      mockSignInEmail.mockImplementation(
        async (_creds: unknown, { onError }: { onError: (ctx: { error: { message: string } }) => void }) => {
          onError({ error: { message: "Invalid credentials" } });
        },
      );
      render(<LoginForm />);
      fillAndSubmit("test@example.com", "wrongpass");
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "ログインに失敗しました: Invalid credentials",
        );
      });
    });

    it("ログイン失敗時にローディングが解除されること", async () => {
      mockSignInEmail.mockImplementation(
        async (_creds: unknown, { onError }: { onError: (ctx: { error: { message: string } }) => void }) => {
          onError({ error: { message: "Invalid credentials" } });
        },
      );
      render(<LoginForm />);
      fillAndSubmit("test@example.com", "wrongpass");
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "ログイン" })).not.toBeDisabled();
      });
    });
  });
});
