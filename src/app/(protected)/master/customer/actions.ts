"use server";

import { revalidatePath } from "next/cache";

import { 得意先Input, 得意先Model } from "@/db/model/得意先Model";
import { 得意先Repository } from "@/db/repository/得意先Repository";

export async function save得意先(data: 得意先Input, isEdit: boolean) {
  try {
    const validated = 得意先Model.parse(data);
    if (isEdit) {
      if (!validated.得意先ID) {
        throw new Error("更新対象のIDが指定されていません。");
      }
      await 得意先Repository.Update(
        validated.得意先ID,
        validated.version,
        validated,
      );
    } else {
      await 得意先Repository.Insert(validated);
    }
    revalidatePath("/admin/products");
    return { success: true };
  } catch (e: unknown) {
    const errorMessage =
      e instanceof Error ? e.message : "予期せぬエラーが発生しました";
    return { success: false, error: errorMessage };
  }
}

export async function delete得意先(得意先ID: string, version: number) {
  try {
    await 得意先Repository.Delete(得意先ID, version);
    revalidatePath("/admin/products");
    return { success: true };
  } catch (e: unknown) {
    const errorMessage =
      e instanceof Error ? e.message : "予期せぬエラーが発生しました";
    return { success: false, error: errorMessage };
  }
}
