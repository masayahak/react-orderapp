import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// 認証ガード
export async function requireSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }
  return session;
}

// 認証+認可(admin)ガード
export async function requireAdmin() {
  // 認証チェック
  const session = await requireSession();

  // 認可エラーはルートページへリダイレクト
  if (session.user.role !== "admin") {
    redirect("/");
  }
  return session;
}
