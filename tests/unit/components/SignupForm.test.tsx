import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SignupForm } from "@/app/signup/_components/SignupForm";

// ─── モック設定 ───────────────────────────────────────

const { mockPush, mockRefresh, mockSignUpEmail } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
  mockSignUpEmail: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

vi.mock("@/lib/auth-client", () => ({
  signUp: {
    email: mockSignUpEmail,
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("lucide-react", () => ({
  ArrowLeft: () => <div data-testid="arrow-left-icon" />,
  Loader2: () => <div data-testid="loader2-icon" />,
}));

// ─── ヘルパー ─────────────────────────────────────────

function fillAndSubmit(userName: string, email: string, password: string) {
  fireEvent.change(screen.getByPlaceholderText("○山 太郎"), {
    target: { value: userName },
  });
  fireEvent.change(screen.getByPlaceholderText("test@example.com"), {
    target: { value: email },
  });
  fireEvent.change(screen.getByPlaceholderText("********"), {
    target: { value: password },
  });
  fireEvent.submit(screen.getByRole("button", { name: "登録" }).closest("form")!);
}

// ─── テスト ───────────────────────────────────────────

describe("SignupForm コンポーネント", () => {
  describe("初期表示", () => {
    it("タイトル「アカウントの作成」が表示されること", () => {
      render(<SignupForm />);
      expect(screen.getByText("アカウントの作成")).toBeInTheDocument();
    });

    it("ユーザー名フィールドが表示されること", () => {
      render(<SignupForm />);
      expect(screen.getByPlaceholderText("○山 太郎")).toBeInTheDocument();
    });

    it("メールアドレスフィールドが表示されること", () => {
      render(<SignupForm />);
      expect(screen.getByPlaceholderText("test@example.com")).toBeInTheDocument();
    });

    it("パスワードフィールドが表示されること", () => {
      render(<SignupForm />);
      expect(screen.getByPlaceholderText("********")).toBeInTheDocument();
    });

    it("「登録」ボタンが表示されること", () => {
      render(<SignupForm />);
      expect(screen.getByRole("button", { name: "登録" })).toBeInTheDocument();
    });

    it("「ログイン画面に戻る」ボタンが表示されること", () => {
      render(<SignupForm />);
      expect(screen.getByRole("button", { name: /ログイン画面に戻る/ })).toBeInTheDocument();
    });
  });

  describe("バリデーション", () => {
    it("ユーザー名が3文字以下のままサブミットすると「ユーザー名は4文字以上必要です」が表示されること", async () => {
      render(<SignupForm />);
      fillAndSubmit("abc", "test@example.com", "password123");
      await waitFor(() => {
        expect(screen.getByText("ユーザー名は4文字以上必要です")).toBeInTheDocument();
      });
    });

    it("不正なメール形式でサブミットするとバリデーションエラーが表示されること", async () => {
      render(<SignupForm />);
      fillAndSubmit("testuser", "invalid-email", "password123");
      await waitFor(() => {
        expect(screen.getByText("正しいメールアドレスの形式で入力してください")).toBeInTheDocument();
      });
    });

    it("パスワードが7文字以下のままサブミットすると「パスワードは8文字以上必要です」が表示されること", async () => {
      render(<SignupForm />);
      fillAndSubmit("testuser", "test@example.com", "short");
      await waitFor(() => {
        expect(screen.getByText("パスワードは8文字以上必要です")).toBeInTheDocument();
      });
    });

    it("パスワードが51文字以上のままサブミットすると「パスワードは50文字以内にしてください」が表示されること", async () => {
      render(<SignupForm />);
      fillAndSubmit("testuser", "test@example.com", "a".repeat(51));
      await waitFor(() => {
        expect(screen.getByText("パスワードは50文字以内にしてください")).toBeInTheDocument();
      });
    });
  });

  describe("登録成功", () => {
    it("正常な値でサブミットすると signUp.email が呼ばれること", async () => {
      mockSignUpEmail.mockImplementation(async (_creds: unknown, { onSuccess }: { onSuccess: () => void }) => {
        onSuccess();
      });
      render(<SignupForm />);
      fillAndSubmit("testuser", "test@example.com", "password123");
      await waitFor(() => {
        expect(mockSignUpEmail).toHaveBeenCalledWith(
          { email: "test@example.com", password: "password123", name: "testuser" },
          expect.objectContaining({ onSuccess: expect.any(Function) }),
        );
      });
    });

    it("登録成功後に router.push('/') が呼ばれること", async () => {
      mockSignUpEmail.mockImplementation(async (_creds: unknown, { onSuccess }: { onSuccess: () => void }) => {
        onSuccess();
      });
      render(<SignupForm />);
      fillAndSubmit("testuser", "test@example.com", "password123");
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/");
      });
    });
  });

  describe("登録失敗", () => {
    it("登録失敗時に toast.error が呼ばれること", async () => {
      const { toast } = await import("sonner");
      mockSignUpEmail.mockImplementation(
        async (_creds: unknown, { onError }: { onError: (ctx: { error: { message: string } }) => void }) => {
          onError({ error: { message: "Email already exists" } });
        },
      );
      render(<SignupForm />);
      fillAndSubmit("testuser", "test@example.com", "password123");
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "登録に失敗しました: Email already exists",
        );
      });
    });

    it("登録失敗時にローディングが解除されること", async () => {
      mockSignUpEmail.mockImplementation(
        async (_creds: unknown, { onError }: { onError: (ctx: { error: { message: string } }) => void }) => {
          onError({ error: { message: "Email already exists" } });
        },
      );
      render(<SignupForm />);
      fillAndSubmit("testuser", "test@example.com", "password123");
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "登録" })).not.toBeDisabled();
      });
    });
  });

  describe("キャンセル", () => {
    it("「ログイン画面に戻る」ボタンをクリックすると router.push('/login') が呼ばれること", () => {
      render(<SignupForm />);
      fireEvent.click(screen.getByRole("button", { name: /ログイン画面に戻る/ }));
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });
});
