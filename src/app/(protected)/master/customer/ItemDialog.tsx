"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { save得意先 } from "@/app/(protected)/master/customer/actions";
import { 得意先Input, 得意先Output, 得意先Model } from "@/db/model/得意先Model";

export function ItemDialog({
  target,
  onClose,
}: {
  target: 得意先Output | null;
  onClose: () => void;
}) {
  const isEdit = !!target;

  const form = useForm<得意先Input>({
    resolver: zodResolver(得意先Model),
    defaultValues: target
      ? { ...target, 備考: target.備考 ?? "", 電話番号: target.電話番号 ?? "" }
      : {
          得意先名: "",
          電話番号: "",
          備考: "",
          version: 1,
        },
  });

  const onSubmit = async (data: 得意先Input) => {
    // 画面には出さないが、更新時は target.得意先ID を確実に紐付ける
    const payload = isEdit ? { ...data, 得意先ID: target?.得意先ID } : data;

    const res = await save得意先(payload as 得意先Output, isEdit);
    if (res.success) {
      toast.success(isEdit ? "更新しました" : "登録しました");
      onClose();
    } else {
      toast.error(res.error || "保存に失敗しました");
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isEdit ? "得意先情報の修正" : "得意先の新規登録"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* ID表示は完全に削除。DTO（data）の配送のみに専念 */}

            {/* 得意先名 */}
            <FormField
              control={form.control}
              name="得意先名"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">得意先名</FormLabel>
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

            {/* 電話番号 */}
            <FormField
              control={form.control}
              name="電話番号"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">電話番号</FormLabel>
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
                      placeholder="取引条件など"
                      value={field.value ?? ""}
                      className="bg-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
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
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
