import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  delete得意先,
  save得意先,
} from "@/app/(protected)/master/customer/actions";
import { CustomerDialog } from "@/app/(protected)/master/customer/_components/得意先Dialog";

// ─── モック設定 ───────────────────────────────────────

vi.mock("@/app/(protected)/master/customer/actions", () => ({
  save得意先: vi.fn().mockResolvedValue({ success: true }),
  delete得意先: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("lucide-react", () => ({
  Loader2: () => <div data-testid="loader2-icon" />,
  XIcon: () => <div data-testid="x-icon" />,
  X: () => <div data-testid="x-icon" />,
}));

// ─── テスト ───────────────────────────────────────────

describe("CustomerDialog コンポーネント（新規登録）", () => {
  it("新規登録フォームのタイトルが表示されること", () => {
    render(<CustomerDialog target={null} onClose={vi.fn()} />);

    expect(screen.getByText("得意先の新規登録")).toBeInTheDocument();
  });

  it("フォームフィールドが表示されること", () => {
    render(<CustomerDialog target={null} onClose={vi.fn()} />);

    expect(screen.getByText("得意先名")).toBeInTheDocument();
    expect(screen.getByText("電話番号")).toBeInTheDocument();
    expect(screen.getByText("備考")).toBeInTheDocument();
  });

  it("新規登録時は「削除」ボタンが表示されないこと", () => {
    render(<CustomerDialog target={null} onClose={vi.fn()} />);

    expect(
      screen.queryByRole("button", { name: "削除" }),
    ).not.toBeInTheDocument();
  });

  it("「保存する」ボタンと「キャンセル」ボタンが表示されること", () => {
    render(<CustomerDialog target={null} onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: "保存する" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "キャンセル" }),
    ).toBeInTheDocument();
  });

  it("「キャンセル」ボタンをクリックすると onClose が呼ばれること", () => {
    const onClose = vi.fn();
    render(<CustomerDialog target={null} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("得意先名フィールドが初期値として空であること", () => {
    render(<CustomerDialog target={null} onClose={vi.fn()} />);

    const input = screen.getByPlaceholderText("例: ハカマタソフト");
    expect(input).toHaveValue("");
  });
});

describe("CustomerDialog コンポーネント（編集）", () => {
  const existingCustomer = {
    得意先ID: "customer-uuid-001",
    得意先名: "テスト株式会社",
    電話番号: "03-1234-5678",
    備考: "重要顧客",
    version: 3,
  };

  it("編集フォームのタイトルが表示されること", () => {
    render(<CustomerDialog target={existingCustomer} onClose={vi.fn()} />);

    expect(screen.getByText("得意先情報の修正")).toBeInTheDocument();
  });

  it("既存データがフォームに反映されること", () => {
    render(<CustomerDialog target={existingCustomer} onClose={vi.fn()} />);

    expect(screen.getByDisplayValue("テスト株式会社")).toBeInTheDocument();
    expect(screen.getByDisplayValue("03-1234-5678")).toBeInTheDocument();
    expect(screen.getByDisplayValue("重要顧客")).toBeInTheDocument();
  });

  it("編集時は「削除」ボタンが表示されること", () => {
    render(<CustomerDialog target={existingCustomer} onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: "削除" })).toBeInTheDocument();
  });

  it("「削除」ボタンをクリックすると確認ダイアログが表示されること", () => {
    render(<CustomerDialog target={existingCustomer} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "削除" }));

    expect(screen.getByText("本当に削除しますか？")).toBeInTheDocument();
    expect(screen.getByText(/この操作は取り消せません/)).toBeInTheDocument();
  });

  it("削除確認ダイアログに得意先名が表示されること", () => {
    render(<CustomerDialog target={existingCustomer} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "削除" }));

    expect(screen.getByText(/テスト株式会社/)).toBeInTheDocument();
  });

  it("削除確認ダイアログで「キャンセル」をクリックするとダイアログが閉じること", () => {
    render(<CustomerDialog target={existingCustomer} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "削除" }));
    expect(screen.getByText("本当に削除しますか？")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(
      screen.queryByText("本当に削除しますか？"),
    ).not.toBeInTheDocument();
  });

  it("削除実行ボタンが表示されること", () => {
    render(<CustomerDialog target={existingCustomer} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "削除" }));

    expect(
      screen.getByRole("button", { name: "削除実行" }),
    ).toBeInTheDocument();
  });
});

describe("CustomerDialog コンポーネント（保存フロー）", () => {
  const existingCustomer = {
    得意先ID: "customer-uuid-001",
    得意先名: "テスト株式会社",
    電話番号: "03-1234-5678",
    備考: "重要顧客",
    version: 3,
  };

  it("新規登録成功時に toast.success('登録しました') が呼ばれること", async () => {
    const { toast } = await import("sonner");
    vi.mocked(save得意先).mockResolvedValueOnce({ success: true });

    render(<CustomerDialog target={null} onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("例: ハカマタソフト"), {
      target: { value: "新規得意先" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "保存する" }).closest("form")!);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("登録しました");
    });
  });

  it("新規登録成功時に onClose が呼ばれること", async () => {
    vi.mocked(save得意先).mockResolvedValueOnce({ success: true });
    const onClose = vi.fn();

    render(<CustomerDialog target={null} onClose={onClose} />);
    fireEvent.change(screen.getByPlaceholderText("例: ハカマタソフト"), {
      target: { value: "新規得意先" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "保存する" }).closest("form")!);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("保存失敗時に toast.error が呼ばれること", async () => {
    const { toast } = await import("sonner");
    vi.mocked(save得意先).mockResolvedValueOnce({ success: false, error: "保存に失敗しました" });

    render(<CustomerDialog target={null} onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("例: ハカマタソフト"), {
      target: { value: "新規得意先" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "保存する" }).closest("form")!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("保存に失敗しました");
    });
  });

  it("編集保存成功時に toast.success('更新しました') が呼ばれること", async () => {
    const { toast } = await import("sonner");
    vi.mocked(save得意先).mockResolvedValueOnce({ success: true });

    render(<CustomerDialog target={existingCustomer} onClose={vi.fn()} />);
    fireEvent.submit(screen.getByRole("button", { name: "保存する" }).closest("form")!);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("更新しました");
    });
  });
});

describe("CustomerDialog コンポーネント（削除フロー）", () => {
  const existingCustomer = {
    得意先ID: "customer-uuid-001",
    得意先名: "テスト株式会社",
    電話番号: "03-1234-5678",
    備考: "重要顧客",
    version: 3,
  };

  it("削除成功時に toast.success('削除しました') が呼ばれること", async () => {
    const { toast } = await import("sonner");
    vi.mocked(delete得意先).mockResolvedValueOnce({ success: true });

    render(<CustomerDialog target={existingCustomer} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "削除" }));
    fireEvent.click(screen.getByRole("button", { name: "削除実行" }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("削除しました");
    });
  });

  it("削除成功時に onClose が呼ばれること", async () => {
    vi.mocked(delete得意先).mockResolvedValueOnce({ success: true });
    const onClose = vi.fn();

    render(<CustomerDialog target={existingCustomer} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "削除" }));
    fireEvent.click(screen.getByRole("button", { name: "削除実行" }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("削除失敗時に toast.error が呼ばれること", async () => {
    const { toast } = await import("sonner");
    vi.mocked(delete得意先).mockResolvedValueOnce({ success: false, error: "削除に失敗しました" });

    render(<CustomerDialog target={existingCustomer} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "削除" }));
    fireEvent.click(screen.getByRole("button", { name: "削除実行" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("削除に失敗しました");
    });
  });
});
