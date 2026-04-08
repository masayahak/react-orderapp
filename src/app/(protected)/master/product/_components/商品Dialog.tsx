"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { delete商品, save商品 } from "@/app/(protected)/master/product/actions";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 商品Input, 商品Model, 商品Output } from "@/db/model/商品Model";

export function ProductDialog({
  target,
  onClose,
}: {
  target: 商品Output | null;
  onClose: () => void;
}) {
  const isEdit = !!target;
  // 削除確認ダイアログの表示状態管理
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const form = useForm<商品Input>({
    resolver: zodResolver(商品Model),
    defaultValues: target // 既存データの修正の場合
      ? { ...target, 備考: target.備考 ?? "" } // nullの可能性がある列は空文字に変換
      : {
          // 新規登録の場合
          商品CD: "",
          商品名: "",
          単価: 0,
          備考: "",
          version: 0,
        },
  });

  const onSubmit = async (data: 商品Input) => {
    // 編集時は商品CDは入力値ではなく、編集前の商品CDを利用
    const payload = isEdit ? { ...data, 商品CD: target?.商品CD } : data;
    const res = await save商品(payload, isEdit);
    if (res.success) {
      toast.success(isEdit ? "更新しました" : "登録しました");
      onClose();
    } else {
      // エラーメッセージの内容で商品CDの重複か判定する
      if (res.error === "商品が既に存在します") {
        form.setError("商品CD", {
          type: "manual",
          message: res.error,
        });
      } else {
        // 排他制御など、全体に関するエラーはトーストで表示
        toast.error(res.error);
      }
    }
  };

  // 削除実行処理
  const handleDelete = async () => {
    if (!target?.商品CD) return;

    const res = await delete商品(target.商品CD, target.version);
    if (res.success) {
      toast.success("削除しました");
      setShowDeleteAlert(false); // アラートを閉じる
      onClose(); // 本体のダイアログも閉じる
    } else {
      toast.error(res.error);
    }
  };

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {isEdit ? "商品情報の修正" : "商品の新規登録"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="商品CD"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 font-semibold">
                      商品CD
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
                        必須
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isEdit}
                        placeholder="例: RX-78-2"
                        className="bg-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 商品名 */}
              <FormField
                control={form.control}
                name="商品名"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 font-semibold">
                      商品名
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
                        必須
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="例: ガンダム"
                        className="bg-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 単価 */}
              <FormField
                control={form.control}
                name="単価"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 font-semibold">
                      単価
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
                        必須
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        // 文字列のまま渡し Zod の coerce.number に処理を任せることで
                        // 空文字時の挙動（NaN回避）を安定させる
                        onChange={(e) => field.onChange(e.target.value)}
                        className="bg-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 備考 */}
              <FormField
                control={form.control}
                name="備考"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">備考</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        className="bg-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between pt-4">
                {isEdit ? (
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={form.formState.isSubmitting}
                    onClick={() => setShowDeleteAlert(true)}
                  >
                    削除
                  </Button>
                ) : (
                  <div />
                )}

                <div className="flex gap-3">
                  <Button type="button" variant="ghost" onClick={onClose}>
                    キャンセル
                  </Button>
                  <Button
                    type="submit"
                    className="min-w-[100px]"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        保存中
                      </>
                    ) : (
                      "保存する"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 削除確認アラートダイアログ */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。
              <br />『{target?.商品名}』のデータが完全に削除されます。
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
