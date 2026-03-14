"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { AdvancedCombobox, ColumnDef } from "@/components/advanced-combobox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { 受注Input, 受注Model } from "@/db/model/受注Model";

import { delete受注, save受注, search商品, search得意先 } from "../actions";

type CustomerSearchRes = { 得意先ID: string; 得意先名: string };
type ProductSearchRes = { 商品CD: string; 商品名: string; 単価: number };

interface OrderFormProps {
  serverDate: string; // サーバーサイドで生成した日付を受け取る
  initialData?: 受注Input & { 受注ID: string };
  mode: "create" | "edit";
}

export function OrderForm({ serverDate, initialData, mode }: OrderFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 削除確認ダイアログの表示状態管理
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const form = useForm<受注Input>({
    resolver: zodResolver(受注Model),
    defaultValues: initialData || {
      受注日: serverDate,
      得意先ID: "",
      得意先名: "",
      明細: [{ 商品CD: "", 商品名: "", 単価: 0, 数量: 1, 明細金額: 0 }],
      合計金額: 0,
      version: 0,
    },
  });

  // 動的に変化する明細行を管理する
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "明細",
  });

  const watchDetails = useWatch({ control: form.control, name: "明細" });
  const totalAmount = useWatch({ control: form.control, name: "合計金額" });

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
    { header: "ID", accessorKey: "得意先ID", visible: false },
  ];

  const productColumns: ColumnDef<ProductSearchRes>[] = [
    { header: "CD", accessorKey: "商品CD", width: "100px" },
    { header: "商品名", accessorKey: "商品名" },
    {
      header: "単価",
      accessorKey: "単価",
      width: "100px",
      align: "right",
      isCurrency: true,
    },
  ];

  const onSubmit = async (data: 受注Input) => {
    const validated = 受注Model.parse(data);
    const res = await save受注(validated, mode, initialData?.受注ID);
    if (res.success) {
      toast.success(
        mode === "create" ? "受注を登録しました" : "変更を保存しました",
      );
      const query = searchParams.toString();
      router.push(query ? `/order?${query}` : "/order");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  const handleDelete = async () => {
    const id = initialData?.受注ID;
    const ver = initialData?.version;

    // ID または version が欠けている場合は削除不可
    if (!id || ver === undefined) return;

    const res = await delete受注(id, ver);
    if (res.success) {
      toast.success("受注を削除しました");
      setShowDeleteAlert(false);
      const query = searchParams.toString();
      router.push(query ? `/order?${query}` : "/order");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  // 受注日から曜日を算出する関数
  const orderDate = useWatch({
    control: form.control,
    name: "受注日",
  });
  const getDayOfWeekInfo = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;

    const days = ["日", "月", "火", "水", "木", "金", "土"];
    const dayIndex = date.getDay();

    let colorClass = "text-slate-700"; // デフォルト（平日）
    if (dayIndex === 0) colorClass = "text-red-600"; // 日曜
    if (dayIndex === 6) colorClass = "text-blue-600"; // 土曜

    return {
      label: `(${days[dayIndex]})`,
      colorClass,
    };
  };
  const dayInfo = getDayOfWeekInfo(orderDate);

  return (
    <>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
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
                {mode === "create" ? "受注起票" : "受注確認・修正"}
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
              disabled={form.formState.isSubmitting}
              onClick={() => setShowDeleteAlert(true)}
              className="text-rose-500 border-rose-100 hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 className="h-4 w-4 mr-2" /> 伝票削除
            </Button>
          )}
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  受注日
                  <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
                    必須
                  </span>
                  {dayInfo && (
                    <span
                      className={`normal-case text-xs ml-1 font-bold ${dayInfo.colorClass}`}
                    >
                      {dayInfo.label}
                    </span>
                  )}
                </label>
                <Input
                  type="date"
                  {...form.register("受注日")}
                  className="h-10 bg-slate-50/50"
                />
                {/* エラー表示 */}
                {form.formState.errors.受注日 && (
                  <p className="text-xs text-red-600 font-medium">
                    {form.formState.errors.受注日.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  得意先
                  <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
                    必須
                  </span>
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
                {/* エラー表示 */}
                {form.formState.errors.得意先ID && (
                  <p className="text-xs text-red-600 font-medium">
                    {form.formState.errors.得意先ID.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <div className="bg-slate-300/80 border-b px-6 py-2.5 flex justify-between items-center">
              <h2 className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                受注明細
              </h2>
              <div className="flex items-center gap-2 text-[10px] text-slate-600 font-medium">
                <AlertCircle className="h-3 w-3" /> 最大10行まで
              </div>
            </div>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/30">
                  <TableRow className="hover:bg-transparent">
                    {/* 修正1: 商品CD列を先頭へ */}
                    <TableHead className="w-[180px] pl-6 text-[11px]">
                      <div className="flex items-center gap-2">
                        商品CD
                        <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
                          必須
                        </span>
                      </div>
                    </TableHead>
                    {/* 修正2: 商品名列を2番目へ */}
                    <TableHead className="text-[11px]">商品名</TableHead>
                    {/* 修正3: 単価列の幅を拡張 */}
                    <TableHead className="w-[180px] text-[11px] text-right pr-6">
                      単価
                    </TableHead>
                    <TableHead className="w-[140px] text-[11px]  text-right pr-6">
                      数量
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
                        必須
                      </span>
                    </TableHead>
                    <TableHead className="w-[180px] text-right pr-6 text-[11px]">
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
                          placeholder="CD検索..."
                          searchFn={search商品}
                          columns={productColumns}
                          displayKey="商品CD"
                          valueKey="商品CD"
                          initialValue={
                            field.商品CD
                              ? {
                                  商品CD: field.商品CD,
                                  商品名: field.商品名,
                                  単価: Number(field.単価),
                                }
                              : undefined
                          }
                          onSelect={(product) => {
                            form.setValue(
                              `明細.${index}.商品CD`,
                              product.商品CD,
                            );
                            form.setValue(
                              `明細.${index}.商品名`,
                              product.商品名,
                            );
                            form.setValue(`明細.${index}.単価`, product.単価);
                          }}
                        />
                        {/* 商品CDのエラー表示 */}
                        {form.formState.errors.明細?.[index]?.商品CD && (
                          <p className="text-[10px] text-red-600 font-medium mt-1">
                            {form.formState.errors.明細[index]?.商品CD?.message}
                          </p>
                        )}
                      </TableCell>
                      {/* 修正2: 商品名を読取専用Inputで表示 */}
                      <TableCell className="py-2">
                        <Input
                          {...form.register(`明細.${index}.商品名`)}
                          readOnly
                          tabIndex={-1}
                          className="h-9 bg-transparent border-none text-xs text-slate-500 focus-visible:ring-0"
                        />
                      </TableCell>
                      <TableCell className="py-2">
                        <input
                          type="hidden"
                          {...form.register(`明細.${index}.単価`)}
                        />
                        <Input
                          readOnly
                          tabIndex={-1}
                          value={`¥${(watchDetails?.[index]?.単価 || 0).toLocaleString()}`}
                          className="h-9 bg-slate-50 border-none font-mono text-right text-xs"
                        />
                      </TableCell>
                      <TableCell className="py-2">
                        <Input
                          type="number"
                          {...form.register(`明細.${index}.数量`)}
                          className="h-9 text-right font-mono text-xs focus:bg-white"
                        />
                        {/* 数量のエラー表示 */}
                        {form.formState.errors.明細?.[index]?.数量 && (
                          <p className="text-[10px] text-red-600 font-medium mt-1 text-right">
                            {form.formState.errors.明細[index]?.数量?.message}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="py-2 align-top">
                        <Input
                          readOnly
                          tabIndex={-1}
                          value={`¥${(watchDetails?.[index]?.明細金額 || 0).toLocaleString()}`}
                          className="h-9 bg-slate-50 border-none font-mono text-right text-xs"
                        />
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

          <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
            <div className="flex flex-col">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                合計金額
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
                className="flex-1 md:flex-none border-slate-700 text-slate-600 hover:bg-slate-200 h-12 px-8"
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

      {/* 削除確認アラートダイアログ */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。
              <br />
              この受注が完全に削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              削除実行
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
