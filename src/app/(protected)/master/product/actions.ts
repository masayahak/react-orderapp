"use server";

import { revalidatePath } from "next/cache";

import { 商品Input, 商品Model } from "@/db/model/商品Model";
import { 商品Repository } from "@/db/repository/商品Repository";

export async function save商品(data: 商品Input, isEdit: boolean) {
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
    revalidatePath("/master/products");
    return { success: true };
  } catch (e: unknown) {
    const errorMessage =
      e instanceof Error ? e.message : "予期せぬエラーが発生しました";
    return { success: false, error: errorMessage };
  }
}

export async function delete商品(商品CD: string, version: number) {
  try {
    await 商品Repository.Delete(商品CD, version);
    revalidatePath("/master/products");
    return { success: true };
  } catch (e: unknown) {
    const errorMessage =
      e instanceof Error ? e.message : "予期せぬエラーが発生しました";
    return { success: false, error: errorMessage };
  }
}
