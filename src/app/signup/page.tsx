import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { SignupForm } from "@/app/signup/_components/SignupForm";
import { auth } from "@/lib/auth";

export default async function SignupPage() {
  // ログインページ表示時に、1回だけ厳密なセッション確認を行う（DB照会あり）
  // proxy.tsではなくここで行うことで、サイト全体のパフォーマンス低下を防ぐ
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // 「本物のセッション」がある場合のみ、ダッシュボードへリダイレクト
  if (session) {
    redirect("/dashboard");
  }
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <SignupForm />
      </div>
    </div>
  );
}
