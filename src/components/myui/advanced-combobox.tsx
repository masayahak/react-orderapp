"use client";

import * as React from "react";
import { ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// 列定義の型
export type ColumnDef<T> = {
  header: string;
  accessorKey: keyof T;
  width?: string;
};

interface AdvancedComboboxProps<T> {
  searchFn: (query: string) => Promise<T[]>;
  columns: ColumnDef<T>[];
  displayKey: keyof T; // 選択後に表示する列
  valueKey: keyof T; // 一意の識別子
  minChars?: number;
  placeholder?: string;
  onSelect: (item: T) => void;
}

export function AdvancedCombobox<T>({
  searchFn,
  columns,
  displayKey,
  valueKey,
  minChars = 2,
  placeholder = "検索...",
  onSelect,
}: AdvancedComboboxProps<T>) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [items, setItems] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedDisplay, setSelectedDisplay] = React.useState("");

  const handleSearch = React.useCallback(
    async (q: string) => {
      setLoading(true);
      try {
        const results = await searchFn(q);
        setItems(results.slice(0, 20)); // 最大20件制限
      } finally {
        setLoading(false);
      }
    },
    [searchFn],
  );

  // 入力時のトリガー
  React.useEffect(() => {
    if (query.length >= minChars) {
      handleSearch(query);
    } else {
      setItems([]);
    }
  }, [query, minChars, handleSearch]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedDisplay || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-(--radix-popover-trigger-width)">
        <Command shouldFilter={false}>
          {" "}
          {/* ローカルフィルタを無効化 */}
          <CommandInput
            placeholder={placeholder}
            value={query}
            onValueChange={setQuery}
            onKeyDown={(e) => {
              // 下矢印キーで文字数に関わらず検索実行
              if (e.key === "ArrowDown" && !open) {
                setOpen(true);
                handleSearch(query);
              }
            }}
          />
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            <CommandEmpty>該当なし</CommandEmpty>

            {/* ヘッダー行 */}
            {items.length > 0 && (
              <div className="flex px-2 py-1.5 border-b bg-muted/50 text-xs font-medium">
                {columns.map((col) => (
                  <div
                    key={String(col.accessorKey)}
                    style={{ width: col.width || "auto" }}
                    className="flex-1"
                  >
                    {col.header}
                  </div>
                ))}
              </div>
            )}

            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={String(item[valueKey])}
                  value={String(item[valueKey])}
                  onSelect={() => {
                    onSelect(item); // オブジェクト全体を返す
                    setSelectedDisplay(String(item[displayKey]));
                    setOpen(false);
                  }}
                  className="flex"
                >
                  {columns.map((col) => (
                    <div
                      key={String(col.accessorKey)}
                      style={{ width: col.width || "auto" }}
                      className="flex-1 truncate"
                    >
                      {String(item[col.accessorKey])}
                    </div>
                  ))}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
