"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import { 得意先Input, 得意先Model } from "@/db/model/得意先Model";
import { 得意先Repository } from "@/db/repository/得意先Repository";
import { requireAdmin } from "@/lib/auth-guard";

export async function save得意先(data: 得意先Input, isEdit: boolean) {
  // 認可判定
  await requireAdmin();

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
    revalidatePath("/master/customer");
    return { success: true };
  } catch (e: unknown) {
    console.error("Delete Error:", e);

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

export async function delete得意先(得意先ID: string, version: number) {
  // 認可判定
  await requireAdmin();

  try {
    await 得意先Repository.Delete(得意先ID, version);
    revalidatePath("/master/customer");
    return { success: true };
  } catch (e: unknown) {
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
