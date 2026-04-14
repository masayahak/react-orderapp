import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  AdvancedCombobox,
  ColumnDef,
} from "@/components/advanced-combobox";

// ─── モック設定 ───────────────────────────────────────

// debounce をパススルーにして入力即時反映
vi.mock("@/hooks/use-debounce", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useDebounce: (v: any) => v,
}));

vi.mock("lucide-react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("lucide-react")>()),
  Check: () => <span data-testid="check-icon" />,
  ChevronsUpDown: () => <span data-testid="chevrons-up-down-icon" />,
  Loader2: () => <span data-testid="loader2-icon" />,
}));

// ─── テストデータ ─────────────────────────────────────

type Item = { id: string; name: string; price: number };

const columns: ColumnDef<Item>[] = [
  { header: "名前", accessorKey: "name" },
  { header: "ID", accessorKey: "id", visible: false },
  {
    header: "価格",
    accessorKey: "price",
    align: "right",
    formatter: (v) => `¥${Number(v).toLocaleString()}`,
    cellClassName: "font-mono",
  },
];

const items: Item[] = [
  { id: "1", name: "アイテムA", price: 1000 },
  { id: "2", name: "アイテムB", price: 2000 },
];

// ─── テスト ───────────────────────────────────────────

describe("AdvancedCombobox", () => {
  describe("初期表示", () => {
    it("initialValueなし: placeholder が表示されること", () => {
      render(
        <AdvancedCombobox
          placeholder="検索..."
          searchFn={vi.fn().mockResolvedValue([])}
          columns={columns}
          displayKey="name"
          valueKey="id"
          onSelect={vi.fn()}
        />,
      );
      expect(screen.getByRole("combobox")).toHaveTextContent("検索...");
    });

    it("initialValueあり: displayKey の値が表示されること", () => {
      render(
        <AdvancedCombobox
          placeholder="検索..."
          searchFn={vi.fn().mockResolvedValue([])}
          columns={columns}
          displayKey="name"
          valueKey="id"
          initialValue={items[0]}
          onSelect={vi.fn()}
        />,
      );
      expect(screen.getByRole("combobox")).toHaveTextContent("アイテムA");
    });
  });

  describe("searchFn の呼び出し", () => {
    it("マウント時に空文字で呼ばれること", async () => {
      const searchFn = vi.fn().mockResolvedValue([]);
      render(
        <AdvancedCombobox
          placeholder="検索..."
          searchFn={searchFn}
          columns={columns}
          displayKey="name"
          valueKey="id"
          onSelect={vi.fn()}
        />,
      );
      await waitFor(() => {
        expect(searchFn).toHaveBeenCalledWith("");
      });
    });

    it("検索キーワード入力後に呼ばれること", async () => {
      const searchFn = vi.fn().mockResolvedValue([]);
      render(
        <AdvancedCombobox
          placeholder="検索..."
          searchFn={searchFn}
          columns={columns}
          displayKey="name"
          valueKey="id"
          onSelect={vi.fn()}
        />,
      );

      fireEvent.click(screen.getByRole("combobox"));

      const input = await screen.findByPlaceholderText("検索キーワードを入力…");
      fireEvent.change(input, { target: { value: "アイテム" } });

      await waitFor(() => {
        expect(searchFn).toHaveBeenCalledWith("アイテム");
      });
    });
  });

  describe("検索結果の表示", () => {
    it("visible な列のヘッダーが表示されること", async () => {
      render(
        <AdvancedCombobox
          placeholder="検索..."
          searchFn={vi.fn().mockResolvedValue(items)}
          columns={columns}
          displayKey="name"
          valueKey="id"
          onSelect={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByRole("combobox"));

      await waitFor(() => {
        expect(screen.getByText("名前")).toBeInTheDocument();
        expect(screen.getByText("価格")).toBeInTheDocument();
      });
    });

    it("visible=false の列のヘッダーは表示されないこと", async () => {
      render(
        <AdvancedCombobox
          placeholder="検索..."
          searchFn={vi.fn().mockResolvedValue(items)}
          columns={columns}
          displayKey="name"
          valueKey="id"
          onSelect={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByRole("combobox"));

      await waitFor(() => {
        expect(screen.queryByText("ID")).not.toBeInTheDocument();
      });
    });

    it("検索結果のアイテムが表示されること", async () => {
      render(
        <AdvancedCombobox
          placeholder="検索..."
          searchFn={vi.fn().mockResolvedValue(items)}
          columns={columns}
          displayKey="name"
          valueKey="id"
          onSelect={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByRole("combobox"));

      await waitFor(() => {
        expect(screen.getByText("アイテムA")).toBeInTheDocument();
        expect(screen.getByText("アイテムB")).toBeInTheDocument();
      });
    });

    it("formatter が指定された列は書式付きで表示されること", async () => {
      render(
        <AdvancedCombobox
          placeholder="検索..."
          searchFn={vi.fn().mockResolvedValue(items)}
          columns={columns}
          displayKey="name"
          valueKey="id"
          onSelect={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByRole("combobox"));

      await waitFor(() => {
        expect(screen.getByText("¥1,000")).toBeInTheDocument();
      });
    });

    it("結果が0件のとき「見つかりませんでした。」が表示されること", async () => {
      render(
        <AdvancedCombobox
          placeholder="検索..."
          searchFn={vi.fn().mockResolvedValue([])}
          columns={columns}
          displayKey="name"
          valueKey="id"
          onSelect={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByRole("combobox"));

      await waitFor(() => {
        expect(screen.getByText("見つかりませんでした。")).toBeInTheDocument();
      });
    });
  });

  describe("アイテムの選択", () => {
    it("アイテムをクリックすると onSelect が呼ばれること", async () => {
      const onSelect = vi.fn();
      render(
        <AdvancedCombobox
          placeholder="検索..."
          searchFn={vi.fn().mockResolvedValue(items)}
          columns={columns}
          displayKey="name"
          valueKey="id"
          onSelect={onSelect}
        />,
      );
      fireEvent.click(screen.getByRole("combobox"));

      await waitFor(() => {
        expect(screen.getByText("アイテムA")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("アイテムA"));

      expect(onSelect).toHaveBeenCalledWith(items[0]);
    });

    it("選択後にトリガーボタンに displayKey の値が表示されること", async () => {
      render(
        <AdvancedCombobox
          placeholder="検索..."
          searchFn={vi.fn().mockResolvedValue(items)}
          columns={columns}
          displayKey="name"
          valueKey="id"
          onSelect={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByRole("combobox"));

      await waitFor(() => {
        expect(screen.getByText("アイテムA")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("アイテムA"));

      expect(screen.getByRole("combobox")).toHaveTextContent("アイテムA");
    });

    it("選択後にポップオーバーが閉じること", async () => {
      render(
        <AdvancedCombobox
          placeholder="検索..."
          searchFn={vi.fn().mockResolvedValue(items)}
          columns={columns}
          displayKey="name"
          valueKey="id"
          onSelect={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByRole("combobox"));

      await waitFor(() => {
        expect(screen.getByText("アイテムA")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("アイテムA"));

      await waitFor(() => {
        expect(
          screen.queryByPlaceholderText("検索キーワードを入力…"),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("エラーハンドリング", () => {
    it("searchFn がエラーをスローした場合、「見つかりませんでした。」が表示されること", async () => {
      render(
        <AdvancedCombobox
          placeholder="検索..."
          searchFn={vi.fn().mockRejectedValue(new Error("Network Error"))}
          columns={columns}
          displayKey="name"
          valueKey="id"
          onSelect={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByRole("combobox"));

      await waitFor(() => {
        expect(screen.getByText("見つかりませんでした。")).toBeInTheDocument();
      });
    });
  });

  describe("ローディング", () => {
    it("searchFn が pending 中は Loader2 が表示されること", async () => {
      render(
        <AdvancedCombobox
          placeholder="検索..."
          searchFn={vi.fn().mockReturnValue(new Promise(() => {}))}
          columns={columns}
          displayKey="name"
          valueKey="id"
          onSelect={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByRole("combobox"));

      await waitFor(() => {
        expect(screen.getByTestId("loader2-icon")).toBeInTheDocument();
      });
    });
  });
});
