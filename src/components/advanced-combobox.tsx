"use client";

import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

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

/**
 * プロパティの型定義
 */
interface AdvancedComboboxProps<T> {
  placeholder: string;
  searchFn: (query: string) => Promise<T[]>;
  columns: ColumnDef<T>[];
  displayKey: keyof T;
  valueKey: keyof T;
  onSelect: (item: T) => void;
  initialValue?: T; // 修正モード用の初期値
  className?: string;
}

export function AdvancedCombobox<T>({
  placeholder,
  searchFn,
  columns,
  displayKey,
  valueKey,
  onSelect,
  initialValue,
  className,
}: AdvancedComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<T | null>(initialValue || null);

  const debouncedQuery = useDebounce(query, 300);

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

  useEffect(() => {
    fetchResults(debouncedQuery);
  }, [debouncedQuery, fetchResults]);

  const visibleColumns = columns.filter((col) => col.visible !== false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
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
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-(--radix-popover-trigger-width) min-w-[400px]"
        align="start"
      >
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <CommandInput
              placeholder="検索キーワードを入力..."
              value={query}
              onValueChange={setQuery}
              className="h-10 w-full bg-transparent outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
                      setOpen(false);
                      setQuery("");
                    }}
                    className="flex items-center px-2 py-2 cursor-pointer"
                  >
                    <div className="w-8 flex justify-center shrink-0">
                      <Check
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
