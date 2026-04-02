import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OrderForm } from "@/app/(protected)/order/_components/受注Form";

// ─── モック設定 ───────────────────────────────────────

const {
  mockPush,
  mockBack,
  mockRefresh,
  mockSearchParamsToString,
  mockSave受注,
  mockDelete受注,
  mockSearch得意先,
  mockSearch商品,
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockBack: vi.fn(),
  mockRefresh: vi.fn(),
  mockSearchParamsToString: vi.fn().mockReturnValue(""),
  mockSave受注: vi.fn(),
  mockDelete受注: vi.fn(),
  mockSearch得意先: vi.fn().mockResolvedValue([]),
  mockSearch商品: vi.fn().mockResolvedValue([]),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    refresh: mockRefresh,
  }),
  useSearchParams: () => ({
    toString: mockSearchParamsToString,
  }),
}));

vi.mock("@/app/(protected)/order/actions", () => ({
  save受注: mockSave受注,
  delete受注: mockDelete受注,
  search得意先: mockSearch得意先,
  search商品: mockSearch商品,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("lucide-react", () => ({
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  ArrowLeft: () => <div data-testid="arrow-left-icon" />,
  Loader2: () => <div data-testid="loader2-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Trash2: () => <div data-testid="trash2-icon" />,
}));

// AdvancedCombobox: placeholder を data-testid として使い、onSelect をボタンクリックで呼び出せる形にする
vi.mock("@/components/advanced-combobox", () => ({
  AdvancedCombobox: ({ onSelect, placeholder }: { onSelect: (item: Record<string, unknown>) => void; placeholder: string }) => (
    <button
      data-testid={`combobox-${placeholder}`}
      type="button"
      onClick={() => {
        if (placeholder === "得意先を検索...") {
          onSelect({ 得意先ID: "cust-001", 得意先名: "テスト株式会社" });
        } else {
          onSelect({ 商品CD: "PROD-001", 商品名: "テスト商品", 単価: 1000 });
        }
      }}
    >
      {placeholder}
    </button>
  ),
}));

// ─── テストデータ ─────────────────────────────────────

const editModeProps = {
  serverDate: "2024-01-15",
  mode: "edit" as const,
  initialData: {
    受注ID: "order-uuid-001",
    受注日: "2024-01-15",
    得意先ID: "cust-001",
    得意先名: "テスト株式会社",
    合計金額: 2000,
    version: 1,
    明細: [
      {
        商品CD: "PROD-001",
        商品名: "テスト商品",
        単価: 1000,
        数量: 2,
        明細金額: 2000,
      },
    ],
  },
};

// ─── テスト ───────────────────────────────────────────

describe("OrderForm コンポーネント（新規作成モード）", () => {
  describe("初期表示", () => {
    it("タイトル「受注起票」が表示されること", () => {
      render(<OrderForm serverDate="2024-01-15" mode="create" />);
      expect(screen.getByText("受注起票")).toBeInTheDocument();
    });

    it("受注日フィールドに serverDate が初期値として設定されること", () => {
      render(<OrderForm serverDate="2024-01-15" mode="create" />);
      expect(screen.getByDisplayValue("2024-01-15")).toBeInTheDocument();
    });

    it("得意先コンボボックスが表示されること", () => {
      render(<OrderForm serverDate="2024-01-15" mode="create" />);
      expect(screen.getByTestId("combobox-得意先を検索...")).toBeInTheDocument();
    });

    it("「受注明細」セクションが表示されること", () => {
      render(<OrderForm serverDate="2024-01-15" mode="create" />);
      expect(screen.getByText("受注明細")).toBeInTheDocument();
    });

    it("明細行が初期状態で1行表示されること", () => {
      render(<OrderForm serverDate="2024-01-15" mode="create" />);
      expect(screen.getAllByTestId("combobox-CD検索...")).toHaveLength(1);
    });

    it("「明細行を追加」ボタンが表示されること", () => {
      render(<OrderForm serverDate="2024-01-15" mode="create" />);
      expect(screen.getByRole("button", { name: /明細行を追加/ })).toBeInTheDocument();
    });

    it("「受注を確定する」ボタンが表示されること", () => {
      render(<OrderForm serverDate="2024-01-15" mode="create" />);
      expect(screen.getByRole("button", { name: "受注を確定する" })).toBeInTheDocument();
    });

    it("新規作成時は「伝票削除」ボタンが表示されないこと", () => {
      render(<OrderForm serverDate="2024-01-15" mode="create" />);
      expect(screen.queryByRole("button", { name: /伝票削除/ })).not.toBeInTheDocument();
    });
  });

  describe("曜日表示", () => {
    it("受注日が月曜日の場合は「(月)」が表示されること", () => {
      render(<OrderForm serverDate="2024-01-15" mode="create" />); // 2024-01-15 は月曜
      expect(screen.getByText("(月)")).toBeInTheDocument();
    });

    it("受注日が日曜日の場合は「(日)」が表示されること", () => {
      render(<OrderForm serverDate="2024-01-14" mode="create" />); // 2024-01-14 は日曜
      expect(screen.getByText("(日)")).toBeInTheDocument();
    });

    it("受注日が土曜日の場合は「(土)」が表示されること", () => {
      render(<OrderForm serverDate="2024-01-13" mode="create" />); // 2024-01-13 は土曜
      expect(screen.getByText("(土)")).toBeInTheDocument();
    });
  });

  describe("明細行操作", () => {
    it("「明細行を追加」ボタンをクリックすると明細が1行増えること", () => {
      render(<OrderForm serverDate="2024-01-15" mode="create" />);
      fireEvent.click(screen.getByRole("button", { name: /明細行を追加/ }));
      expect(screen.getAllByTestId("combobox-CD検索...")).toHaveLength(2);
    });

    it("明細が1行のときは行削除ボタンが無効化されること", () => {
      render(<OrderForm serverDate="2024-01-15" mode="create" />);
      // 削除ボタンは ghost/icon ボタンで Trash2 アイコンを含む
      const deleteButtons = screen.getAllByRole("button").filter(
        (btn) => btn.querySelector("[data-testid='trash2-icon']") !== null,
      );
      expect(deleteButtons[0]).toBeDisabled();
    });

    it("明細が2行以上のときは行削除ボタンが有効であること", () => {
      render(<OrderForm serverDate="2024-01-15" mode="create" />);
      fireEvent.click(screen.getByRole("button", { name: /明細行を追加/ }));
      const deleteButtons = screen.getAllByRole("button").filter(
        (btn) => btn.querySelector("[data-testid='trash2-icon']") !== null,
      );
      deleteButtons.forEach((btn) => expect(btn).not.toBeDisabled());
    });

    it("行削除ボタンをクリックすると明細行が1行減ること", () => {
      render(<OrderForm serverDate="2024-01-15" mode="create" />);
      fireEvent.click(screen.getByRole("button", { name: /明細行を追加/ }));
      expect(screen.getAllByTestId("combobox-CD検索...")).toHaveLength(2);

      const deleteButtons = screen.getAllByRole("button").filter(
        (btn) => btn.querySelector("[data-testid='trash2-icon']") !== null,
      );
      fireEvent.click(deleteButtons[0]);
      expect(screen.getAllByTestId("combobox-CD検索...")).toHaveLength(1);
    });

    it("明細が10行になると「明細行を追加」ボタンが無効化されること", () => {
      render(<OrderForm serverDate="2024-01-15" mode="create" />);
      const addBtn = screen.getByRole("button", { name: /明細行を追加/ });
      // 1行から始まり、9回追加すると10行
      for (let i = 0; i < 9; i++) {
        fireEvent.click(addBtn);
      }
      expect(addBtn).toBeDisabled();
    });
  });

  describe("戻るボタン", () => {
    it("左矢印ボタンをクリックすると router.back() が呼ばれること", () => {
      render(<OrderForm serverDate="2024-01-15" mode="create" />);
      fireEvent.click(screen.getByTestId("arrow-left-icon").closest("button")!);
      expect(mockBack).toHaveBeenCalled();
    });

    it("「戻る」ボタンをクリックすると router.back() が呼ばれること", () => {
      render(<OrderForm serverDate="2024-01-15" mode="create" />);
      fireEvent.click(screen.getByRole("button", { name: "戻る" }));
      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe("フォームサブミット", () => {
    it("得意先が未選択でサブミットすると「得意先は必須です」が表示されること", async () => {
      render(<OrderForm serverDate="2024-01-15" mode="create" />);
      fireEvent.submit(
        screen.getByRole("button", { name: "受注を確定する" }).closest("form")!,
      );
      await waitFor(() => {
        expect(screen.getByText("得意先は必須です")).toBeInTheDocument();
      });
    });

    it("有効なデータでサブミットすると save受注 が 'create' モードで呼ばれること", async () => {
      mockSave受注.mockResolvedValue({ success: true });
      render(<OrderForm serverDate="2024-01-15" mode="create" />);

      // 得意先を選択
      fireEvent.click(screen.getByTestId("combobox-得意先を検索..."));
      // 商品を選択
      fireEvent.click(screen.getByTestId("combobox-CD検索..."));

      fireEvent.submit(
        screen.getByRole("button", { name: "受注を確定する" }).closest("form")!,
      );

      await waitFor(() => {
        expect(mockSave受注).toHaveBeenCalledWith(
          expect.objectContaining({ 得意先ID: "cust-001" }),
          "create",
          undefined,
        );
      });
    });

    it("save受注 成功後に toast.success が呼ばれること", async () => {
      const { toast } = await import("sonner");
      mockSave受注.mockResolvedValue({ success: true });
      render(<OrderForm serverDate="2024-01-15" mode="create" />);

      fireEvent.click(screen.getByTestId("combobox-得意先を検索..."));
      fireEvent.click(screen.getByTestId("combobox-CD検索..."));
      fireEvent.submit(
        screen.getByRole("button", { name: "受注を確定する" }).closest("form")!,
      );

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("受注を登録しました");
      });
    });

    it("save受注 成功後に router.push('/order') が呼ばれること", async () => {
      mockSave受注.mockResolvedValue({ success: true });
      mockSearchParamsToString.mockReturnValue("");
      render(<OrderForm serverDate="2024-01-15" mode="create" />);

      fireEvent.click(screen.getByTestId("combobox-得意先を検索..."));
      fireEvent.click(screen.getByTestId("combobox-CD検索..."));
      fireEvent.submit(
        screen.getByRole("button", { name: "受注を確定する" }).closest("form")!,
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/order");
      });
    });

    it("save受注 失敗時に toast.error が呼ばれること", async () => {
      const { toast } = await import("sonner");
      mockSave受注.mockResolvedValue({ success: false, error: "保存に失敗しました" });
      render(<OrderForm serverDate="2024-01-15" mode="create" />);

      fireEvent.click(screen.getByTestId("combobox-得意先を検索..."));
      fireEvent.click(screen.getByTestId("combobox-CD検索..."));
      fireEvent.submit(
        screen.getByRole("button", { name: "受注を確定する" }).closest("form")!,
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("保存に失敗しました");
      });
    });

    it("searchParams に値がある場合、戻り先URLにクエリが付与されること", async () => {
      mockSave受注.mockResolvedValue({ success: true });
      mockSearchParamsToString.mockReturnValue("page=2&q=test");
      render(<OrderForm serverDate="2024-01-15" mode="create" />);

      fireEvent.click(screen.getByTestId("combobox-得意先を検索..."));
      fireEvent.click(screen.getByTestId("combobox-CD検索..."));
      fireEvent.submit(
        screen.getByRole("button", { name: "受注を確定する" }).closest("form")!,
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/order?page=2&q=test");
      });
    });
  });
});

describe("OrderForm コンポーネント（編集モード）", () => {
  describe("初期表示", () => {
    it("タイトル「受注確認・修正」が表示されること", () => {
      render(<OrderForm {...editModeProps} />);
      expect(screen.getByText("受注確認・修正")).toBeInTheDocument();
    });

    it("受注IDがサブタイトルに表示されること", () => {
      render(<OrderForm {...editModeProps} />);
      expect(screen.getByText(/order-uuid-001/)).toBeInTheDocument();
    });

    it("「伝票削除」ボタンが表示されること", () => {
      render(<OrderForm {...editModeProps} />);
      expect(screen.getByRole("button", { name: /伝票削除/ })).toBeInTheDocument();
    });

    it("初期データの受注日がフィールドに反映されること", () => {
      render(<OrderForm {...editModeProps} />);
      expect(screen.getByDisplayValue("2024-01-15")).toBeInTheDocument();
    });

    it("「変更を確定する」ボタンが表示されること", () => {
      render(<OrderForm {...editModeProps} />);
      expect(screen.getByRole("button", { name: "変更を確定する" })).toBeInTheDocument();
    });
  });

  describe("削除フロー", () => {
    it("「伝票削除」ボタンをクリックすると確認ダイアログが表示されること", () => {
      render(<OrderForm {...editModeProps} />);
      fireEvent.click(screen.getByRole("button", { name: /伝票削除/ }));
      expect(screen.getByText("本当に削除しますか？")).toBeInTheDocument();
    });

    it("削除確認ダイアログに「この操作は取り消せません」が表示されること", () => {
      render(<OrderForm {...editModeProps} />);
      fireEvent.click(screen.getByRole("button", { name: /伝票削除/ }));
      expect(screen.getByText(/この操作は取り消せません/)).toBeInTheDocument();
    });

    it("削除確認ダイアログで「キャンセル」をクリックするとダイアログが閉じること", () => {
      render(<OrderForm {...editModeProps} />);
      fireEvent.click(screen.getByRole("button", { name: /伝票削除/ }));
      expect(screen.getByText("本当に削除しますか？")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));

      expect(screen.queryByText("本当に削除しますか？")).not.toBeInTheDocument();
    });

    it("「削除実行」をクリックすると delete受注 が呼ばれること", async () => {
      mockDelete受注.mockResolvedValue({ success: true });
      render(<OrderForm {...editModeProps} />);

      fireEvent.click(screen.getByRole("button", { name: /伝票削除/ }));
      fireEvent.click(screen.getByRole("button", { name: "削除実行" }));

      await waitFor(() => {
        expect(mockDelete受注).toHaveBeenCalledWith("order-uuid-001", 1);
      });
    });

    it("delete受注 成功後に toast.success('受注を削除しました') が呼ばれること", async () => {
      const { toast } = await import("sonner");
      mockDelete受注.mockResolvedValue({ success: true });
      render(<OrderForm {...editModeProps} />);

      fireEvent.click(screen.getByRole("button", { name: /伝票削除/ }));
      fireEvent.click(screen.getByRole("button", { name: "削除実行" }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("受注を削除しました");
      });
    });

    it("delete受注 成功後に router.push('/order') が呼ばれること", async () => {
      mockDelete受注.mockResolvedValue({ success: true });
      mockSearchParamsToString.mockReturnValue("");
      render(<OrderForm {...editModeProps} />);

      fireEvent.click(screen.getByRole("button", { name: /伝票削除/ }));
      fireEvent.click(screen.getByRole("button", { name: "削除実行" }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/order");
      });
    });

    it("delete受注 失敗時に toast.error が呼ばれること", async () => {
      const { toast } = await import("sonner");
      mockDelete受注.mockResolvedValue({ success: false, error: "削除に失敗しました" });
      render(<OrderForm {...editModeProps} />);

      fireEvent.click(screen.getByRole("button", { name: /伝票削除/ }));
      fireEvent.click(screen.getByRole("button", { name: "削除実行" }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("削除に失敗しました");
      });
    });
  });

  describe("フォームサブミット", () => {
    it("有効なデータでサブミットすると save受注 が 'edit' モードで受注IDとともに呼ばれること", async () => {
      mockSave受注.mockResolvedValue({ success: true });
      render(<OrderForm {...editModeProps} />);

      fireEvent.submit(
        screen.getByRole("button", { name: "変更を確定する" }).closest("form")!,
      );

      await waitFor(() => {
        expect(mockSave受注).toHaveBeenCalledWith(
          expect.objectContaining({ 得意先ID: "cust-001" }),
          "edit",
          "order-uuid-001",
        );
      });
    });

    it("save受注 成功後に toast.success が呼ばれること", async () => {
      const { toast } = await import("sonner");
      mockSave受注.mockResolvedValue({ success: true });
      render(<OrderForm {...editModeProps} />);

      fireEvent.submit(
        screen.getByRole("button", { name: "変更を確定する" }).closest("form")!,
      );

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("変更を保存しました");
      });
    });
  });
});
