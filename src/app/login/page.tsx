import { LoginForm } from "@/app/login/_components/LoginForm";
import { Footer } from "@/components/footer";

export default function Page() {
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
