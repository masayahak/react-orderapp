"use server";

import { revalidatePath } from "next/cache";
import { 得意先Repository } from "@/db/repository/得意先Repository";
import { 商品Repository } from "@/db/repository/商品Repository";
import { 受注Repository } from "@/db/repository/受注Repository";
import { 受注Input } from "@/db/model/受注Model";

export async function search得意先(query: string) {
  // 最小文字数チェックなどはフロント側で行っている前提
  const { items } = await 得意先Repository.Search(query, 1, 20);

  // Comboboxに必要な型 (CustomerSearchRes) に絞って返す
  return items.map((i) => ({
    得意先ID: i.得意先ID!,
    得意先名: i.得意先名,
  }));
}

export async function search商品(query: string) {
  const { items } = await 商品Repository.Search(query, 1, 20);

  // Comboboxに必要な型 (ProductSearchRes) に絞って返す
  return items.map((i) => ({
    商品CD: i.商品CD,
    商品名: i.商品名,
    単価: i.単価,
  }));
}

export async function save受注(
  data: 受注Input,
  mode: "create" | "edit",
  orderId?: string,
) {
  try {
    await 受注Repository.Save(data, mode, orderId);

    // 関連するページのキャッシュをクリア
    revalidatePath("/dashboard");
    revalidatePath("/order");

    return { success: true };
  } catch (e) {
    console.error("Save Error:", e);
    return { success: false, error: "データベースへの保存に失敗しました" };
  }
}

export async function delete受注(orderId: string) {
  try {
    await 受注Repository.Delete(orderId);

    revalidatePath("/dashboard");
    revalidatePath("/order");

    return { success: true };
  } catch (e) {
    console.error("Delete Error:", e);
    return { success: false, error: "削除処理に失敗しました" };
  }
}
