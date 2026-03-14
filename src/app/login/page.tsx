import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { LoginForm } from "@/app/login/_components/LoginForm";
import { Footer } from "@/components/footer";
import { auth } from "@/lib/auth";

export default async function Page() {
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
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>テスト用のアカウントを用意しています。</p>
          <p className="font-mono mt-1">test@example.com / kyouhayuki</p>
          <p className="font-mono mt-1">admin@test.com / admintarou</p>
        </div>
        <Footer />
      </div>
    </div>
  );
}
