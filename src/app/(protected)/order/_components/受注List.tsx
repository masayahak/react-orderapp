"use client";

import { FileText, Loader2, Pencil,Plus, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

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
import { 受注HeaderOutput } from "@/db/model/受注Model";

export function OrderList({
  initialData,
  totalCount,
  pageSize,
}: {
  initialData: 受注HeaderOutput[];
  totalCount: number;
  pageSize: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentPage = Number(searchParams.get("page")) || 1;
  const totalPages = Math.ceil(totalCount / pageSize);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    }).format(d);
  };

  const getDateColorClass = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "text-slate-600";

    const day = d.getDay();
    if (day === 0) return "text-red-600"; // 日曜
    if (day === 6) return "text-blue-600"; // 土曜

    return "text-slate-600"; // 平日（デフォルト）
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);
  };

  const handleSearch = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams(searchParams);

    params.set("q", formData.get("q") as string);
    params.set("startDate", formData.get("startDate") as string);
    params.set("endDate", formData.get("endDate") as string);
    params.set("page", "1");

    startTransition(() => router.push(`?${params.toString()}`));
  };

  return (
    <div className="space-y-6">
      {/* 検索・アクションエリア */}
      <Card className="border-none shadow-sm bg-slate-50/50">
        <CardContent className="p-2">
          <form
            onSubmit={handleSearch}
            className="flex flex-col md:flex-row items-end gap-6"
          >
            <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 ml-1">
                  開始日
                </label>
                <Input
                  type="date"
                  name="startDate"
                  defaultValue={searchParams.get("startDate") || ""}
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 ml-1">
                  終了日
                </label>
                <Input
                  type="date"
                  name="endDate"
                  defaultValue={searchParams.get("endDate") || ""}
                  className="bg-white"
                />
              </div>
            </div>

            <div className="space-y-2 flex-1 w-full">
              <label className="text-xs font-semibold text-slate-500 ml-1">
                キーワード (得意先・商品)
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

            <div className="flex pr-4 gap-20 w-full md:w-auto">
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
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-800"
                onClick={() => {
                  const query = searchParams.toString();
                  router.push(query ? `/order/new?${query}` : "/order/new");
                }}
              >
                <Plus className="h-4 w-4 mr-2" /> 新規受注
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* データテーブル */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="pl-8 font-bold text-slate-700 py-4">
                受注ID
              </TableHead>
              <TableHead className="font-bold text-slate-700">受注日</TableHead>
              <TableHead className="font-bold text-slate-700">
                得意先名
              </TableHead>
              <TableHead className="font-bold text-slate-700 text-right">
                合計金額
              </TableHead>
              <TableHead className="font-bold text-slate-700 text-center">
                操作
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-40 text-center text-slate-400"
                >
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-8 w-8 opacity-20" />
                    <p>該当する受注データは見つかりませんでした</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              initialData.map((order) => (
                <TableRow
                  key={order.受注ID}
                  className="group hover:bg-slate-50/50 transition-colors"
                >
                  <TableCell className="pl-8 font-mono text-[10px] text-slate-400">
                    {order.受注ID?.substring(0, 8)}
                  </TableCell>
                  <TableCell
                    className={`font-medium ${getDateColorClass(order.受注日)}`}
                  >
                    {formatDate(order.受注日)}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-900">
                    {order.得意先名}
                  </TableCell>
                  <TableCell className="text-right font-bold text-slate-900">
                    {formatCurrency(order.合計金額)}
                  </TableCell>
                  <TableCell className="text-center">
                    {/* 確認・修正ボタンに遷移処理を追加 */}
                    <div className="flex justify-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        onClick={() => {
                          const query = searchParams.toString();
                          router.push(
                            query
                              ? `/order/${order.受注ID}?${query}`
                              : `/order/${order.受注ID}`,
                          );
                        }}
                        title="修正"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* ページングUI */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 border-t">
          <p className="text-sm text-slate-500">
            全 {totalCount.toLocaleString()} 件中
            {((currentPage - 1) * pageSize + 1).toLocaleString()} -
            {Math.min(currentPage * pageSize, totalCount).toLocaleString()}
            件を表示
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              className="bg-white"
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set("page", (currentPage - 1).toString());
                startTransition(() => router.push(`?${params.toString()}`));
              }}
            >
              前へ
            </Button>
            <div className="flex items-center gap-1 px-4 text-sm font-medium">
              <span className="text-slate-900">{currentPage}</span>
              <span className="text-slate-400">/</span>
              <span className="text-slate-400">{totalPages}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              className="bg-white"
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set("page", (currentPage + 1).toString());
                startTransition(() => router.push(`?${params.toString()}`));
              }}
            >
              次へ
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
