import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProductDialog } from "@/app/(protected)/master/product/_components/商品Dialog";
import { delete商品, save商品 } from "@/app/(protected)/master/product/actions";

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

  it("新規登録時は「削除」ボタンが表示されないこと", () => {
    render(<ProductDialog target={null} onClose={vi.fn()} />);

    expect(
      screen.queryByRole("button", { name: "削除" }),
    ).not.toBeInTheDocument();
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

  it("削除確認ダイアログで「キャンセル」をクリックするとダイアログが閉じること", () => {
    render(<ProductDialog target={existingProduct} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "削除" }));
    expect(screen.getByText("本当に削除しますか？")).toBeInTheDocument();

    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "キャンセル" }),
    );

    expect(screen.queryByText("本当に削除しますか？")).not.toBeInTheDocument();
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("新規登録成功時に onClose が呼ばれること", async () => {
    const onClose = vi.fn();

    render(<ProductDialog target={null} onClose={onClose} />);
    fireEvent.change(screen.getByPlaceholderText("例: RX-78-2"), {
      target: { value: "NEW-001" },
    });
    fireEvent.change(screen.getByPlaceholderText("例: ガンダム"), {
      target: { value: "新商品" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "保存する" }).closest("form")!,
    );

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("商品CD重複エラー時にフィールドエラーが表示されること", async () => {
    vi.mocked(save商品).mockResolvedValueOnce({
      success: false,
      error: "商品が既に存在します",
    });

    render(<ProductDialog target={null} onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("例: RX-78-2"), {
      target: { value: "PROD-001" },
    });
    fireEvent.change(screen.getByPlaceholderText("例: ガンダム"), {
      target: { value: "新商品" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "保存する" }).closest("form")!,
    );

    await waitFor(() => {
      expect(screen.getByText("商品が既に存在します")).toBeInTheDocument();
    });
  });

  it("その他の保存失敗時に toast.error が呼ばれること", async () => {
    const { toast } = await import("sonner");
    vi.mocked(save商品).mockResolvedValueOnce({
      success: false,
      error: "排他エラーが発生しました",
    });

    render(<ProductDialog target={null} onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("例: RX-78-2"), {
      target: { value: "NEW-001" },
    });
    fireEvent.change(screen.getByPlaceholderText("例: ガンダム"), {
      target: { value: "新商品" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "保存する" }).closest("form")!,
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("排他エラーが発生しました");
    });
  });

  it("新規登録時に save商品 が正しい引数で1回呼ばれること", async () => {
    render(<ProductDialog target={null} onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("例: RX-78-2"), {
      target: { value: "NEW-001" },
    });
    fireEvent.change(screen.getByPlaceholderText("例: ガンダム"), {
      target: { value: "新商品" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "保存する" }).closest("form")!,
    );

    await waitFor(() => {
      expect(save商品).toHaveBeenCalledOnce();
      expect(save商品).toHaveBeenCalledWith(
        { 商品CD: "NEW-001", 商品名: "新商品", 単価: 0, 備考: "", version: 0 },
        false,
      );
    });
  });

  it("編集時に save商品 が正しい引数で1回呼ばれること", async () => {
    render(<ProductDialog target={existingProduct} onClose={vi.fn()} />);
    fireEvent.submit(
      screen.getByRole("button", { name: "保存する" }).closest("form")!,
    );

    await waitFor(() => {
      expect(save商品).toHaveBeenCalledOnce();
      expect(save商品).toHaveBeenCalledWith(
        { 商品CD: "PROD-001", 商品名: "テスト商品", 単価: 1500, 備考: "取扱注意", version: 2 },
        true,
      );
    });
  });

  it("新規登録成功時に toast.success が呼ばれること", async () => {
    const { toast } = await import("sonner");

    render(<ProductDialog target={null} onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("例: RX-78-2"), {
      target: { value: "NEW-001" },
    });
    fireEvent.change(screen.getByPlaceholderText("例: ガンダム"), {
      target: { value: "新商品" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "保存する" }).closest("form")!,
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("登録しました");
    });
  });

  it("編集成功時に toast.success が呼ばれること", async () => {
    const { toast } = await import("sonner");

    render(<ProductDialog target={existingProduct} onClose={vi.fn()} />);
    fireEvent.submit(
      screen.getByRole("button", { name: "保存する" }).closest("form")!,
    );

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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("削除成功時に onClose が呼ばれること", async () => {
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
    vi.mocked(delete商品).mockResolvedValueOnce({
      success: false,
      error: "削除に失敗しました",
    });

    render(<ProductDialog target={existingProduct} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "削除" }));
    fireEvent.click(screen.getByRole("button", { name: "削除実行" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("削除に失敗しました");
    });
  });

  it("delete商品 が正しい引数で1回呼ばれること", async () => {
    render(<ProductDialog target={existingProduct} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "削除" }));
    fireEvent.click(screen.getByRole("button", { name: "削除実行" }));

    await waitFor(() => {
      expect(delete商品).toHaveBeenCalledOnce();
      expect(delete商品).toHaveBeenCalledWith("PROD-001", 2);
    });
  });

  it("削除成功時に toast.success が呼ばれること", async () => {
    const { toast } = await import("sonner");

    render(<ProductDialog target={existingProduct} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "削除" }));
    fireEvent.click(screen.getByRole("button", { name: "削除実行" }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("削除しました");
    });
  });
});
