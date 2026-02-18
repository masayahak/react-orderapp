"use client";

import { useState, useTransition } from "react"; // useTransition を追加
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
import { Pencil, Plus, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { ItemDialog } from "./ItemDialog";
import { 商品Output } from "@/db/model/商品Model";

export function ItemList({
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

  // 検索処理 (URLクエリを更新してServer Componentを再走らせる)
  const handleSearch = (q: string) => {
    const params = new URLSearchParams(searchParams);
    if (q) params.set("q", q);
    else params.delete("q");

    params.set("page", "1");
    // startTransition で包むことで、入力中のもっさり感を防ぐ
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="商品CDまたは名称で検索..."
            onChange={(e) => handleSearch(e.target.value)}
            defaultValue={searchParams.get("q") || ""}
          />
          {isPending && (
            <div className="absolute right-3 top-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setIsDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> 新規追加
        </Button>
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[120px]">商品CD</TableHead>
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
                  <TableCell className="font-mono text-sm">
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
        <ItemDialog
          target={editingItem}
          onClose={() => setIsDialogOpen(false)}
        />
      )}
    </div>
  );
}
