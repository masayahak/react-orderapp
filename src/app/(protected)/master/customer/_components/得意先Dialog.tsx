"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  delete得意先,
  save得意先,
} from "@/app/(protected)/master/customer/actions";
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
import { 得意先Input, 得意先Model, 得意先Output } from "@/db/model/得意先Model";

export function CustomerDialog({
  target,
  onClose,
}: {
  target: 得意先Output | null;
  onClose: () => void;
}) {
  const isEdit = !!target;
  // 削除確認ダイアログの表示状態管理
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const form = useForm<得意先Input>({
    resolver: zodResolver(得意先Model),
    defaultValues: target
      ? { ...target, 備考: target.備考 ?? "", 電話番号: target.電話番号 ?? "" }
      : {
          得意先名: "",
          電話番号: "",
          備考: "",
          version: 0,
        },
  });

  const onSubmit = async (data: 得意先Input) => {
    const payload = isEdit
      ? { ...data, 得意先ID: target?.得意先ID }
      : data;
    const res = await save得意先(payload, isEdit);
    if (res.success) {
      toast.success(isEdit ? "更新しました" : "登録しました");
      onClose();
    } else {
      toast.error(res.error);
    }
  };

  // 削除実行処理
  const handleDelete = async () => {
    if (!target?.得意先ID) return;

    const res = await delete得意先(target.得意先ID, target.version);
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
        <DialogContent className="sm:max-w-[450px]" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {isEdit ? "得意先情報の修正" : "得意先の新規登録"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="得意先名"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 font-semibold">
                      得意先名
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
                        必須
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="例: ハカマタソフト"
                        className="bg-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="電話番号"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 font-semibold">
                      電話番号
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                        任意
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="090-0000-0000"
                        value={field.value ?? ""}
                        className="bg-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="備考"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">備考</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="取引条件など"
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
              <br />『{target?.得意先名}』のデータが完全に削除されます。
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
