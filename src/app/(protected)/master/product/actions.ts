"use server";

import { 商品Repository } from "@/db/repository/商品Repository";
import { 商品Input, 商品Schema } from "@/db/schema/商品Schema";
import { revalidatePath } from "next/cache";

export async function save商品(data: 商品Input, isEdit: boolean) {
  try {
    const validated = 商品Schema.parse(data);
    if (isEdit) {
      await 商品Repository.Update(
        validated.商品CD,
        validated.version,
        validated,
      );
    } else {
      await 商品Repository.Insert(validated);
    }
    revalidatePath("/admin/products");
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
    revalidatePath("/admin/products");
    return { success: true };
  } catch (e: unknown) {
    const errorMessage =
      e instanceof Error ? e.message : "予期せぬエラーが発生しました";
    return { success: false, error: errorMessage };
  }
}
