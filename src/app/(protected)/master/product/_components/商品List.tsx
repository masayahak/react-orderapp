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
import { 商品Output } from "@/db/model/商品Model";

import { ProductDialog } from "./商品Dialog";

export function ProductList({
  initialData,
  totalCount,
  pageSize,
}: {
  initialData: 商品Output[];
  totalCount: number;
  pageSize: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentPage = Number(searchParams.get("page")) || 1;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const [editingItem, setEditingItem] = useState<商品Output | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 検索処理実行
  const handleSearch = (e: React.SyntheticEvent<HTMLFormElement>) => {
    // フォームのデフォルト送信をキャンセル
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams(searchParams);
    const keyword = formData.get("q") as string;
    if (keyword) params.set("q", keyword);
    else params.delete("q");
    params.set("page", "1"); // 検索時は1ページ目に戻す

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-4">
      <Card className="border-none shadow-sm bg-slate-50/50">
        <CardContent className="p-2">
          <form
            onSubmit={handleSearch}
            className="flex flex-col md:flex-row items-end gap-6"
          >
            <div className="space-y-2 flex-1 w-full">
              <label className="text-xs font-semibold text-slate-500 ml-1">
                キーワード (商品CD・商品名)
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  name="q"
                  placeholder="検索ワードを入力..."
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
                className=" ml-12 w-full md:w-auto bg-blue-600 hover:bg-blue-800"
                onClick={() => {
                  setEditingItem(null);
                  setIsDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> 新規追加
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="pl-8 w-[120px]">商品CD</TableHead>
              <TableHead className="w-[300px]">商品名</TableHead>
              <TableHead className="w-[120px] text-right pr-8">単価</TableHead>
              <TableHead className="w-[200px]">備考</TableHead>
              <TableHead className="w-[100px] text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  該当する商品が見つかりません
                </TableCell>
              </TableRow>
            ) : (
              initialData.map((p) => (
                <TableRow
                  key={p.商品CD}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="pl-8 font-mono text-sm">
                    {p.商品CD}
                  </TableCell>
                  <TableCell className="font-medium">{p.商品名}</TableCell>
                  <TableCell className="text-right pr-4">
                    {/* Output型なので p.単価 は確実に number。
                        JSの限界値内であれば toLocaleString() で安全にフォーマット可能 */}
                    ¥{p.単価.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm truncate max-w-[200px]">
                    {p.備考}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingItem(p);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4 text-blue-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ページングUI */}
      <div className="flex items-center justify-between px-2 py-4 border-t">
        <p className="text-sm text-muted-foreground">
          全 {totalCount.toLocaleString()} 件中
          {((currentPage - 1) * pageSize + 1).toLocaleString()} -
          {Math.min(currentPage * pageSize, totalCount).toLocaleString()}
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

      {isDialogOpen && (
        <ProductDialog
          target={editingItem}
          onClose={() => setIsDialogOpen(false)}
        />
      )}
    </div>
  );
}
