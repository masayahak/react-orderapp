"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Check, ChevronsUpDown, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
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

/**
 * 列定義の型
 */
export interface ColumnDef<T> {
  header: string;
  accessorKey: keyof T;
  width?: string;
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

  // 1. 修正モードなどで外部から初期値が変更された場合に同期する
  useEffect(() => {
    if (initialValue) {
      setSelected(initialValue);
    } else {
      setSelected(null);
    }
  }, [initialValue]);

  // 2. 検索実行ロジック
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
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
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
                <div className="w-8" /> {/* Check用スペース */}
                {columns.map((col) => (
                  <div
                    key={String(col.accessorKey)}
                    className="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
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
                    <div className="w-8 flex justify-center">
                      <Check
                        className={cn(
                          "h-4 w-4 text-indigo-600",
                          isSelected ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </div>
                    {columns.map((col) => (
                      <div
                        key={String(col.accessorKey)}
                        className={cn(
                          "text-xs truncate pr-4",
                          isSelected
                            ? "font-bold text-indigo-900"
                            : "text-slate-700",
                        )}
                        style={{
                          width: col.width || "auto",
                          flex: col.width ? "none" : 1,
                        }}
                      >
                        {String(item[col.accessorKey])}
                      </div>
                    ))}
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
