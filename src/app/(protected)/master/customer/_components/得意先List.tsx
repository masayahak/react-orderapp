"use client";

import { Loader2, Pencil, Plus, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 得意先Output } from "@/db/model/得意先Model";

import { CustomerDialog } from "./得意先Dialog";

export function CustomerList({
  pageData,
  totalCount,
  pageSize,
}: {
  pageData: 得意先Output[];
  totalCount: number;
  pageSize: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentPage = Number(searchParams.get("page")) || 1;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    // shallow: true を使わず、サーバーコンポーネントの再実行を促す
    startTransition(() => router.push(`?${params.toString()}`));
  };

  const handleSearch = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams(searchParams.toString());
    const keyword = formData.get("q") as string;

    if (keyword) params.set("q", keyword);
    else params.delete("q");

    params.set("page", "1");
    // shallow: true を使わず、サーバーコンポーネントの再実行を促す
    startTransition(() => router.push(`?${params.toString()}`));
  };

  type DialogState = { open: false } | { open: true; item: 得意先Output | null };
  const [dialog, setDialog] = useState<DialogState>({ open: false });

  return (
    <div className="space-y-4">
      {/* 検索・ヘッダー部分は変更なしのため中略 */}
      <Card className="border-none shadow-sm bg-slate-50/50">
        <CardContent className="p-2">
          <form
            onSubmit={handleSearch}
            className="flex flex-col md:flex-row items-end gap-6"
          >
            <div className="space-y-2 flex-1 w-full">
              <label htmlFor="customer-search-input" className="text-xs font-semibold text-slate-500 ml-1">
                キーワード
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
                <Input
                  id="customer-search-input"
                  name="q"
                  placeholder="検索ワードを入力…"
                  defaultValue={searchParams.get("q") || ""}
                  className="pl-10 bg-white"
                />
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button
                type="submit"
                className="w-full md:w-32"
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  "検索"
                )}
              </Button>
              <Button
                type="button"
                className="ml-12 w-full md:w-auto bg-blue-600 hover:bg-blue-800"
                onClick={() => setDialog({ open: true, item: null })}
              >
                <Plus className="mr-2 h-4 w-4" /> 新規追加
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* テーブル表示。isPending中に不透明度を下げるなどの視覚フィードバックを追加可能 */}
      <div
        className={`border rounded-md bg-white ${isPending ? "opacity-50" : ""}`}
      >
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="pl-8 w-[300px]">得意先名</TableHead>
              <TableHead className="w-[200px]">電話番号</TableHead>
              <TableHead className="w-[200px]">備考</TableHead>
              <TableHead className="w-[100px] text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  該当する得意先が見つかりません
                </TableCell>
              </TableRow>
            ) : (
              pageData.map((p) => (
                <TableRow
                  key={p.得意先ID}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="pl-8 font-medium">
                    {p.得意先名}
                  </TableCell>
                  <TableCell className="text-sm">{p.電話番号}</TableCell>
                  <TableCell className="text-muted-foreground text-sm truncate max-w-[200px]">
                    {p.備考}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDialog({ open: true, item: p })}
                        aria-label={`${p.得意先名} を編集`}
                      >
                        <Pencil className="h-4 w-4 text-blue-600" aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2 py-4 border-t">
        <p className="text-sm text-muted-foreground">
          全 {totalCount.toLocaleString()} 件中{" "}
          {((currentPage - 1) * pageSize + 1).toLocaleString()} -{" "}
          {Math.min(currentPage * pageSize, totalCount).toLocaleString()}{" "}
          件を表示
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1 || isPending}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            前へ
          </Button>
          <div className="flex items-center px-4 text-sm font-medium">
            {currentPage} / {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages || isPending}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            次へ
          </Button>
        </div>
      </div>

      {dialog.open && (
        <CustomerDialog
          target={dialog.item}
          onClose={() => setDialog({ open: false })}
        />
      )}
    </div>
  );
}
