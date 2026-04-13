"use client";

import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

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
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

/**
 * 列定義の型
 */
export interface ColumnDef<T> {
  header: string;
  accessorKey: keyof T;
  width?: string;
  visible?: boolean;
  align?: "left" | "center" | "right";
  isCurrency?: boolean;
}

/* -------------------------------------------------
なぜ、一覧表示する書式付きリストを直接受け取らず、
一覧を取得するロジック searchFn を受け取るのか？
----------------------------------------------------
対象のマスタなどのデータの分母がせいぜい数百件なら
全データを取得・加工し受け取れば良い。
ただし、データの分母が数十万件など大きい場合、
巨大なデータを無駄に受け取ってメモリを圧迫したくない。
絞り込み条件へ検索キーワードを入力してはじめて、
絞り込んだデータのみをコンボボックスへ表示したい。
そのため、事前に表示対象のリストを受け取るのではなく、
表示対象のリストを取得する関数で受け取らざるを得ない。
------------------------------------------------- */

interface AdvancedComboboxProps<T> {
  placeholder: string;
  idForLabel?: string;
  searchFn: (query: string) => Promise<T[]>;
  columns: ColumnDef<T>[];
  displayKey: keyof T;
  valueKey: keyof T;
  initialValue?: T;
  onSelect: (item: T) => void;
  className?: string;
}

export function AdvancedCombobox<T>({
  placeholder,
  idForLabel,
  searchFn,
  columns,
  displayKey,
  valueKey,
  initialValue,
  onSelect,
  className,
}: AdvancedComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<T | null>(initialValue || null);

  // 受け取った columns の定義から、表示対象の取得を定義する
  // なお 再レンダリングされても、columns が変わらない限り再定義する必要はないのでメモ化
  const visibleColumns = useMemo(
    () => columns.filter((col) => col.visible !== false),
    [columns],
  );

  // fetchResults は useEffect の監視対象なので、
  // 再レンダリング時に再作成しないように useCallback でメモ化する
  // 監視対象の searchFn が変わった時だけ再作成する
  const fetchResults = useCallback(
    async (q: string) => {
      setIsLoading(true);
      try {
        const data = await searchFn(q);
        setResults(data);
      } catch (error) {
        console.error("Search Error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [searchFn],
  );

  // queryはキー入力でリアルタイムに変化する
  // しかし一文字ずつSQLを発行すると負荷が高すぎる
  // debouncedQueryは queryが変化しても 300ms 入力が止まるまで、値の更新を遅らせる
  const debouncedQuery = useDebounce(query, 300);

  // debouncedQuery が変化したら fetchResults 実行
  useEffect(() => {
    fetchResults(debouncedQuery);
  }, [debouncedQuery, fetchResults]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* PopoverTriggerをクリックするとonOpenChange(true) */}
      <PopoverTrigger asChild>
        <Button
          id={idForLabel}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-10 px-3 font-normal",
            className,
          )}
        >
          <span className="truncate">
            {selected ? String(selected[displayKey]) : placeholder}
          </span>
          <ChevronsUpDown
            className="ml-2 h-4 w-4 shrink-0 opacity-50"
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="p-0 w-(--radix-popover-trigger-width) min-w-[400px]"
        align="start"
      >
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3 focus-within:ring-1 focus-within:ring-indigo-500">
            <CommandInput
              aria-label="検索キーワードを入力"
              placeholder="検索キーワードを入力…"
              value={query}
              onValueChange={setQuery}
              className="h-10 w-full bg-transparent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
            {isLoading && (
              <Loader2 className="ml-2 h-4 w-4 animate-spin text-slate-400" />
            )}
          </div>

          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty className="py-6 text-center text-sm text-slate-500">
              見つかりませんでした。
            </CommandEmpty>

            <CommandGroup>
              {/* ヘッダー行 */}
              <div className="flex items-center px-2 py-1.5 border-b bg-slate-50/50">
                <div className="w-8" />
                {visibleColumns.map((col) => (
                  <div
                    key={String(col.accessorKey)}
                    className={cn(
                      "text-[10px] font-bold text-slate-400 uppercase tracking-wider pr-4",
                      col.align === "center" && "text-center",
                      col.align === "right" && "text-right",
                      (!col.align || col.align === "left") && "text-left",
                    )}
                    style={{
                      width: col.width || "auto",
                      flex: col.width ? "none" : 1,
                    }}
                  >
                    {col.header}
                  </div>
                ))}
              </div>

              {/* 結果リスト */}
              {results.map((item) => {
                const isSelected =
                  selected && selected[valueKey] === item[valueKey];
                return (
                  <CommandItem
                    key={String(item[valueKey])}
                    value={String(item[valueKey])}
                    onSelect={() => {
                      setSelected(item);
                      onSelect(item);
                      setOpen(false); // 選択したらコンボボックスを閉じる
                      setQuery("");
                    }}
                    className="flex items-center px-2 py-2 cursor-pointer"
                  >
                    <div className="w-8 flex justify-center shrink-0">
                      <Check
                        aria-hidden="true"
                        className={cn(
                          "h-4 w-4 text-indigo-600",
                          isSelected ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </div>
                    {visibleColumns.map((col) => {
                      // 値の取得とフォーマット処理
                      const rawValue = item[col.accessorKey];
                      let displayValue = String(rawValue);

                      if (col.isCurrency && !isNaN(Number(rawValue))) {
                        displayValue = `¥${Number(rawValue).toLocaleString()}`;
                      }

                      return (
                        <div
                          key={String(col.accessorKey)}
                          className={cn(
                            "text-xs truncate pr-4",
                            isSelected
                              ? "font-bold text-indigo-900"
                              : "text-slate-700",
                            col.align === "center" && "text-center",
                            col.align === "right" && "text-right",
                            (!col.align || col.align === "left") && "text-left",
                            // 通貨の場合は等幅フォントを適用して見栄えを良くする
                            col.isCurrency && "font-mono",
                          )}
                          style={{
                            width: col.width || "auto",
                            flex: col.width ? "none" : 1,
                          }}
                        >
                          {displayValue}
                        </div>
                      );
                    })}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
