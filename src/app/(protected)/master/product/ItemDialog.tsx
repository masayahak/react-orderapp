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
import { toast } from "sonner";
import { 商品Input, 商品Output, 商品Model } from "@/db/model/商品Model";
import { save商品 } from "./actions";

export function ItemDialog({
  target,
  onClose,
}: {
  target: 商品Output | null;
  onClose: () => void;
}) {
  const isEdit = !!target;

  const form = useForm<商品Input>({
    resolver: zodResolver(商品Model),
    defaultValues: target
      ? { ...target, 備考: target.備考 ?? "" }
      : {
          商品CD: "",
          商品名: "",
          単価: 0,
          備考: "",
          version: 0,
        },
  });

  const onSubmit = async (data: 商品Input) => {
    // バリデーション済みデータを Output 型として Server Action へ渡す
    const res = await save商品(data as 商品Output, isEdit);
    if (res.success) {
      toast.success("保存しました");
      onClose();
    } else {
      // 排他制御エラー（バージョン不一致）などがここで表示される
      toast.error(res.error || "保存に失敗しました");
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "商品修正" : "商品登録"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* 商品CD */}
            <FormField
              control={form.control}
              name="商品CD"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>商品CD</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isEdit}
                      placeholder="例: RX-78-2"
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
                  <FormLabel>商品名</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="例: ガンダム" />
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
                  <FormLabel>単価</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      // 文字列のまま渡し Zod の coerce.number に処理を任せることで
                      // 空文字時の挙動（NaN回避）を安定させる
                      onChange={(e) => field.onChange(e.target.value)}
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
                  <FormLabel>備考</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "保存中..." : "保存"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
