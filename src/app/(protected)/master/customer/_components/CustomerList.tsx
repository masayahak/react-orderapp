"use client";

import { useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Plus, Loader2, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { CustomerDialog } from "./CustomerDialog";
import { 得意先Output } from "@/db/model/得意先Model";

export function CustomerList({
  initialData,
  totalCount,
  pageSize,
}: {
  initialData: 得意先Output[];
  totalCount: number;
  pageSize: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentPage = Number(searchParams.get("page")) || 1;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (newPage: number) => {
    // 現在のURLクエリ文字列をベースに新しいクエリを作成
    const params = new URLSearchParams(searchParams);

    // ページ番号を更新（または追加）
    params.set("page", newPage.toString());

    // startTransition で包むことで、ページ遷移中のもっさり感を防ぐ
    // (router.pushのレンダリング完了後にisPendingがfalseになる)
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const [editingItem, setEditingItem] = useState<得意先Output | null>(null);
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
                キーワード (得意先名・電話番号)
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
              <TableHead className="pl-8 w-[300px]">得意先名</TableHead>
              <TableHead className="w-[200px]">電話番号</TableHead>
              <TableHead className="w-[200px]">備考</TableHead>
              <TableHead className="w-[100px] text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  該当する得意先が見つかりません
                </TableCell>
              </TableRow>
            ) : (
              initialData.map((p) => (
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

      {isDialogOpen && (
        <CustomerDialog
          target={editingItem}
          onClose={() => setIsDialogOpen(false)}
        />
      )}
    </div>
  );
}
