import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  delete商品,
  save商品,
} from "@/app/(protected)/master/product/actions";
import { ProductDialog } from "@/app/(protected)/master/product/_components/商品Dialog";

// ─── モック設定 ───────────────────────────────────────

vi.mock("@/app/(protected)/master/product/actions", () => ({
  save商品: vi.fn().mockResolvedValue({ success: true }),
  delete商品: vi.fn().mockResolvedValue({ success: true }),
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

describe("ProductDialog コンポーネント（新規登録）", () => {
  it("新規登録フォームのタイトルが表示されること", () => {
    render(<ProductDialog target={null} onClose={vi.fn()} />);

    expect(screen.getByText("商品の新規登録")).toBeInTheDocument();
  });

  it("フォームフィールドが表示されること", () => {
    render(<ProductDialog target={null} onClose={vi.fn()} />);

    expect(screen.getByText("商品CD")).toBeInTheDocument();
    expect(screen.getByText("商品名")).toBeInTheDocument();
    expect(screen.getByText("単価")).toBeInTheDocument();
    expect(screen.getByText("備考")).toBeInTheDocument();
  });

  it("新規登録時は「削除」ボタンが表示されないこと", () => {
    render(<ProductDialog target={null} onClose={vi.fn()} />);

    expect(
      screen.queryByRole("button", { name: "削除" }),
    ).not.toBeInTheDocument();
  });

  it("「保存する」ボタンと「キャンセル」ボタンが表示されること", () => {
    render(<ProductDialog target={null} onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: "保存する" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "キャンセル" }),
    ).toBeInTheDocument();
  });

  it("「キャンセル」ボタンをクリックすると onClose が呼ばれること", () => {
    const onClose = vi.fn();
    render(<ProductDialog target={null} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("新規登録時は商品CDフィールドが編集可能であること", () => {
    render(<ProductDialog target={null} onClose={vi.fn()} />);

    const cdInput = screen.getByPlaceholderText("例: RX-78-2");
    expect(cdInput).not.toBeDisabled();
  });
});

describe("ProductDialog コンポーネント（編集）", () => {
  const existingProduct = {
    商品CD: "PROD-001",
    商品名: "テスト商品",
    単価: 1500,
    備考: "取扱注意",
    version: 2,
  };

  it("編集フォームのタイトルが表示されること", () => {
    render(<ProductDialog target={existingProduct} onClose={vi.fn()} />);

    expect(screen.getByText("商品情報の修正")).toBeInTheDocument();
  });

  it("既存データがフォームに反映されること", () => {
    render(<ProductDialog target={existingProduct} onClose={vi.fn()} />);

    expect(screen.getByDisplayValue("テスト商品")).toBeInTheDocument();
    expect(screen.getByDisplayValue("取扱注意")).toBeInTheDocument();
  });

  it("編集時は商品CDフィールドが無効化（読み取り専用）されること", () => {
    render(<ProductDialog target={existingProduct} onClose={vi.fn()} />);

    const cdInput = screen.getByDisplayValue("PROD-001");
    expect(cdInput).toBeDisabled();
  });

  it("編集時は「削除」ボタンが表示されること", () => {
    render(<ProductDialog target={existingProduct} onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: "削除" })).toBeInTheDocument();
  });

  it("「削除」ボタンをクリックすると確認ダイアログが表示されること", () => {
    render(<ProductDialog target={existingProduct} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "削除" }));

    expect(screen.getByText("本当に削除しますか？")).toBeInTheDocument();
    expect(screen.getByText(/この操作は取り消せません/)).toBeInTheDocument();
  });

  it("削除確認ダイアログに商品名が表示されること", () => {
    render(<ProductDialog target={existingProduct} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "削除" }));

    expect(screen.getByText(/テスト商品/)).toBeInTheDocument();
  });

  it("削除確認ダイアログで「キャンセル」をクリックするとダイアログが閉じること", () => {
    render(<ProductDialog target={existingProduct} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "削除" }));
    expect(screen.getByText("本当に削除しますか？")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(
      screen.queryByText("本当に削除しますか？"),
    ).not.toBeInTheDocument();
  });

  it("削除実行ボタンが表示されること", () => {
    render(<ProductDialog target={existingProduct} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "削除" }));

    expect(
      screen.getByRole("button", { name: "削除実行" }),
    ).toBeInTheDocument();
  });
});

describe("ProductDialog コンポーネント（保存フロー）", () => {
  const existingProduct = {
    商品CD: "PROD-001",
    商品名: "テスト商品",
    単価: 1500,
    備考: "取扱注意",
    version: 2,
  };

  it("新規登録成功時に toast.success('登録しました') が呼ばれること", async () => {
    const { toast } = await import("sonner");
    vi.mocked(save商品).mockResolvedValueOnce({ success: true });

    render(<ProductDialog target={null} onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("例: RX-78-2"), {
      target: { value: "NEW-001" },
    });
    fireEvent.change(screen.getByPlaceholderText("例: ガンダム"), {
      target: { value: "新商品" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "保存する" }).closest("form")!);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("登録しました");
    });
  });

  it("新規登録成功時に onClose が呼ばれること", async () => {
    vi.mocked(save商品).mockResolvedValueOnce({ success: true });
    const onClose = vi.fn();

    render(<ProductDialog target={null} onClose={onClose} />);
    fireEvent.change(screen.getByPlaceholderText("例: RX-78-2"), {
      target: { value: "NEW-001" },
    });
    fireEvent.change(screen.getByPlaceholderText("例: ガンダム"), {
      target: { value: "新商品" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "保存する" }).closest("form")!);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("商品CD重複エラー時にフィールドエラーが表示されること", async () => {
    vi.mocked(save商品).mockResolvedValueOnce({ success: false, error: "商品が既に存在します" });

    render(<ProductDialog target={null} onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("例: RX-78-2"), {
      target: { value: "PROD-001" },
    });
    fireEvent.change(screen.getByPlaceholderText("例: ガンダム"), {
      target: { value: "新商品" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "保存する" }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("商品が既に存在します")).toBeInTheDocument();
    });
  });

  it("その他の保存失敗時に toast.error が呼ばれること", async () => {
    const { toast } = await import("sonner");
    vi.mocked(save商品).mockResolvedValueOnce({ success: false, error: "排他エラーが発生しました" });

    render(<ProductDialog target={null} onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("例: RX-78-2"), {
      target: { value: "NEW-001" },
    });
    fireEvent.change(screen.getByPlaceholderText("例: ガンダム"), {
      target: { value: "新商品" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "保存する" }).closest("form")!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("排他エラーが発生しました");
    });
  });

  it("編集保存成功時に toast.success('更新しました') が呼ばれること", async () => {
    const { toast } = await import("sonner");
    vi.mocked(save商品).mockResolvedValueOnce({ success: true });

    render(<ProductDialog target={existingProduct} onClose={vi.fn()} />);
    fireEvent.submit(screen.getByRole("button", { name: "保存する" }).closest("form")!);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("更新しました");
    });
  });
});

describe("ProductDialog コンポーネント（削除フロー）", () => {
  const existingProduct = {
    商品CD: "PROD-001",
    商品名: "テスト商品",
    単価: 1500,
    備考: "取扱注意",
    version: 2,
  };

  it("削除成功時に toast.success('削除しました') が呼ばれること", async () => {
    const { toast } = await import("sonner");
    vi.mocked(delete商品).mockResolvedValueOnce({ success: true });

    render(<ProductDialog target={existingProduct} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "削除" }));
    fireEvent.click(screen.getByRole("button", { name: "削除実行" }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("削除しました");
    });
  });

  it("削除成功時に onClose が呼ばれること", async () => {
    vi.mocked(delete商品).mockResolvedValueOnce({ success: true });
    const onClose = vi.fn();

    render(<ProductDialog target={existingProduct} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "削除" }));
    fireEvent.click(screen.getByRole("button", { name: "削除実行" }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("削除失敗時に toast.error が呼ばれること", async () => {
    const { toast } = await import("sonner");
    vi.mocked(delete商品).mockResolvedValueOnce({ success: false, error: "削除に失敗しました" });

    render(<ProductDialog target={existingProduct} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "削除" }));
    fireEvent.click(screen.getByRole("button", { name: "削除実行" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("削除に失敗しました");
    });
  });
});
