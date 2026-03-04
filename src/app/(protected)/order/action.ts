"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import { 受注Model, 受注Output } from "@/db/model/受注Model";
import { 受注Repository } from "@/db/repository/受注Repository";
import { 商品Repository } from "@/db/repository/商品Repository";
import { 得意先Repository } from "@/db/repository/得意先Repository";
import { requireSession } from "@/lib/auth-guard";

export async function search得意先(query: string) {
  // 認証ガード
  await requireSession();

  // 最小文字数チェックなどはフロント側で行っている前提
  const pageSize = Number(process.env.PAGE_ROW_COUNT) || 20;
  const { items } = await 得意先Repository.Search(query, 1, pageSize);

  // Comboboxに必要な型 (CustomerSearchRes) に絞って返す
  return items.map((i) => ({
    得意先ID: i.得意先ID!,
    得意先名: i.得意先名,
  }));
}

export async function search商品(query: string) {
  // 認証ガード
  await requireSession();

  const pageSize = Number(process.env.PAGE_ROW_COUNT) || 20;
  const { items } = await 商品Repository.Search(query, 1, pageSize);

  // Comboboxに必要な型 (ProductSearchRes) に絞って返す
  return items.map((i) => ({
    商品CD: i.商品CD,
    商品名: i.商品名,
    単価: i.単価,
  }));
}

export async function save受注(
  data: 受注Output,
  mode: "create" | "edit",
  orderId?: string,
) {
  // 認証ガード
  await requireSession();

  try {
    // サーバーサイドで型を確認
    const validated = 受注Model.parse(data);
    await 受注Repository.Save(validated, mode, orderId);

    // 関連するページのキャッシュをクリア
    revalidatePath("/dashboard");
    revalidatePath("/order");

    return { success: true };
  } catch (e) {
    console.error("Save Error:", e);

    // Zodのバリデーションエラー
    if (e instanceof ZodError) {
      return {
        success: false,
        error: "入力内容に不備があります。画面の指示に従ってください。",
      };
    }

    // 楽観的排他ロックの失敗など、
    // Error インスタンスであれば、そのメッセージをフロントに返す
    if (e instanceof Error) {
      return {
        success: false,
        error: e.message,
      };
    }

    // 予期せぬエラー（ネットワーク切断など）の場合のフォールバック
    return {
      success: false,
      error: "予期せぬエラーが発生しました。時間をおいて再度お試しください。",
    };
  }
}

export async function delete受注(orderId: string, version: number) {
  // 認証ガード
  await requireSession();

  try {
    await 受注Repository.Delete(orderId, version);

    revalidatePath("/dashboard");
    revalidatePath("/order");

    return { success: true };
  } catch (e) {
    console.error("Delete Error:", e);

    // 楽観的排他ロックの失敗など、
    // Error インスタンスであれば、そのメッセージをフロントに返す
    if (e instanceof Error) {
      return {
        success: false,
        error: e.message,
      };
    }

    // 予期せぬエラー（ネットワーク切断など）の場合のフォールバック
    return {
      success: false,
      error: "予期せぬエラーが発生しました。時間をおいて再度お試しください。",
    };
  }
}
