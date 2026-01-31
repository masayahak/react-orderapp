"use client";

import { useEffect } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 受注Model, 受注Input } from "@/db/model/受注Model";
import { AdvancedCombobox, ColumnDef } from "@/components/advanced-combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Plus, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // 通知ライブラリ（任意）
import { delete受注, save受注, search商品, search得意先 } from "./action";

// 検索結果の型定義
type CustomerSearchRes = { 得意先ID: string; 得意先名: string };
type ProductSearchRes = { 商品CD: string; 商品名: string; 単価: number };

interface OrderFormProps {
  initialData?: 受注Input & { 受注ID: string }; // 既存データ（ID含む）
  mode: "create" | "edit";
}

export function OrderForm({ initialData, mode }: OrderFormProps) {
  const router = useRouter();

  const form = useForm<受注Input>({
    resolver: zodResolver(受注Model),
    defaultValues: initialData || {
      受注日: new Date().toISOString().split("T")[0],
      明細: [{ 商品CD: "", 商品名: "", 単価: 0, 数量: 1, 明細金額: 0 }],
      合計金額: 0,
      version: 1,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "明細",
  });

  const watchDetails = useWatch({ control: form.control, name: "明細" });
  const totalAmount = useWatch({ control: form.control, name: "合計金額" });

  // リアルタイム集計ロジック
  useEffect(() => {
    let total = 0;
    watchDetails?.forEach((item, index) => {
      const subtotal = (Number(item.単価) || 0) * (Number(item.数量) || 0);
      if (item.明細金額 !== subtotal) {
        form.setValue(`明細.${index}.明細金額`, subtotal);
      }
      total += subtotal;
    });
    form.setValue("合計金額", total);
  }, [watchDetails, form]);

  const customerColumns: ColumnDef<CustomerSearchRes>[] = [
    { header: "得意先名", accessorKey: "得意先名" },
    { header: "ID", accessorKey: "得意先ID", width: "120px" },
  ];

  const productColumns: ColumnDef<ProductSearchRes>[] = [
    { header: "CD", accessorKey: "商品CD", width: "100px" },
    { header: "商品名", accessorKey: "商品名" },
    { header: "単価", accessorKey: "単価", width: "100px" },
  ];

  // 送信処理（新規・修正共通）
  const onSubmit = async (data: 受注Input) => {
    const res = await save受注(data, mode, initialData?.受注ID);
    if (res.success) {
      toast.success(
        mode === "create" ? "受注を登録しました" : "変更を保存しました",
      );
      router.push("/order");
      router.refresh();
    } else {
      toast.error("保存に失敗しました");
    }
  };

  // 削除処理
  const handleDelete = async () => {
    if (!initialData?.受注ID || !confirm("この受注伝票を完全に削除しますか？"))
      return;

    const res = await delete受注(initialData.受注ID);
    if (res.success) {
      toast.success("受注を削除しました");
      router.push("/order");
      router.refresh();
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* ヘッダーエリア */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tighter">
              {mode === "create" ? "受注起票" : "受注修正"}
            </h1>
            {mode === "edit" && (
              <p className="text-[10px] font-mono text-slate-400 mt-1">
                ID: {initialData?.受注ID}
              </p>
            )}
          </div>
        </div>

        {mode === "edit" && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="text-rose-500 border-rose-100 hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 className="h-4 w-4 mr-2" /> 伝票削除
          </Button>
        )}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 基本情報カード */}
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                受注日
              </label>
              <Input
                type="date"
                {...form.register("受注日")}
                className="h-10 bg-slate-50/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                得意先
              </label>
              <AdvancedCombobox<CustomerSearchRes>
                placeholder="得意先を検索..."
                searchFn={search得意先}
                columns={customerColumns}
                displayKey="得意先名"
                valueKey="得意先ID"
                initialValue={
                  initialData
                    ? {
                        得意先ID: initialData.得意先ID,
                        得意先名: initialData.得意先名!,
                      }
                    : undefined
                }
                onSelect={(customer) => {
                  form.setValue("得意先ID", customer.得意先ID);
                  form.setValue("得意先名", customer.得意先名);
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* 明細テーブルカード */}
        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <div className="bg-slate-50/80 border-b px-6 py-2.5 flex justify-between items-center">
            <h2 className="text-xs font-bold text-slate-600 uppercase tracking-widest">
              受注明細
            </h2>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
              <AlertCircle className="h-3 w-3" /> 最大10行まで
            </div>
          </div>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6 text-[11px]">商品名</TableHead>
                  <TableHead className="w-[100px] text-[11px]">単価</TableHead>
                  <TableHead className="w-[100px] text-[11px]">数量</TableHead>
                  <TableHead className="w-[140px] text-right pr-6 text-[11px]">
                    小計
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id} className="hover:bg-slate-50/20">
                    <TableCell className="pl-6 py-2">
                      <AdvancedCombobox<ProductSearchRes>
                        placeholder="商品検索..."
                        searchFn={search商品}
                        columns={productColumns}
                        displayKey="商品名"
                        valueKey="商品CD"
                        initialValue={
                          field.商品CD
                            ? {
                                商品CD: field.商品CD,
                                商品名: field.商品名,
                                // ★ Number() で明示的にキャストして、型を number に一致させる
                                単価: Number(field.単価),
                              }
                            : undefined
                        }
                        onSelect={(product) => {
                          form.setValue(`明細.${index}.商品CD`, product.商品CD);
                          form.setValue(`明細.${index}.商品名`, product.商品名);
                          form.setValue(`明細.${index}.単価`, product.単価);
                        }}
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <Input
                        type="number"
                        {...form.register(`明細.${index}.単価`)}
                        readOnly
                        className="h-9 bg-slate-50 border-none font-mono text-right text-xs"
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <Input
                        type="number"
                        {...form.register(`明細.${index}.数量`)}
                        className="h-9 text-right font-mono text-xs focus:bg-white"
                      />
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold pr-6 text-xs text-slate-700">
                      ¥{" "}
                      {(watchDetails?.[index]?.明細金額 || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="pr-4 py-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={fields.length <= 1}
                        className="h-8 w-8 text-slate-300 hover:text-rose-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-3 border-t bg-slate-50/20">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    商品CD: "",
                    商品名: "",
                    単価: 0,
                    数量: 1,
                    明細金額: 0,
                  })
                }
                disabled={fields.length >= 10}
                className="h-8 text-[11px] font-bold bg-white shadow-sm"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" /> 明細行を追加
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 固定フッター：合計と保存 */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
              Grand Total
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-medium text-slate-400">¥</span>
              <span className="text-4xl font-black tabular-nums tracking-tighter">
                {(totalAmount || 0).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1 md:flex-none border-slate-700 text-slate-300 hover:bg-slate-800 h-12 px-8"
            >
              戻る
            </Button>
            <Button
              type="submit"
              className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-500 font-bold h-12 px-16 text-base"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : mode === "create" ? (
                "受注を確定する"
              ) : (
                "変更を確定する"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
