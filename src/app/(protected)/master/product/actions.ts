"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import { 商品Input, 商品Model } from "@/db/model/商品Model";
import { 商品Repository } from "@/db/repository/商品Repository";
import { requireAdmin } from "@/lib/auth-guard";

export async function save商品(data: 商品Input, isEdit: boolean) {
  // 認可判定
  await requireAdmin();

  try {
    // クライアントから情報を信頼しない。
    //（data: 商品Input としているが、実際に受け取るのはただのJSON）
    // サーバーサイドとして、受け取った情報が商品Modelとして適切か確認する
    const validated = 商品Model.parse(data);
    if (isEdit) {
      await 商品Repository.Update(
        validated.商品CD,
        validated.version,
        validated,
      );
    } else {
      const result = await 商品Repository.Insert(validated);
      if (result.length === 0) {
        return { success: false, error: "商品が既に存在します" };
      }
    }
    // 現在表示中の商品情報キャッシュの破棄
    revalidatePath("/master/product");
    return { success: true };
  } catch (e: unknown) {
    // Zodのバリデーションエラー
    if (e instanceof ZodError) {
      return {
        success: false,
        error: "入力内容に不備があります。画面の指示に従ってください。",
      };
    }
    // 予期せぬエラー（ネットワーク切断など）の場合のフォールバック
    return {
      success: false,
      error: "予期せぬエラーが発生しました。時間をおいて再度お試しください。",
    };
  }
}

export async function delete商品(商品CD: string, version: number) {
  // 認可判定
  await requireAdmin();

  try {
    await 商品Repository.Delete(商品CD, version);
    revalidatePath("/master/products");
    return { success: true };
  } catch (e: unknown) {
    // 予期せぬエラー（ネットワーク切断など）の場合のフォールバック
    return {
      success: false,
      error: "予期せぬエラーが発生しました。時間をおいて再度お試しください。",
    };
  }
}
