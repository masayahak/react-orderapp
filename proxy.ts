import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 公開パスの定義
  const publicPaths = ["/login", "/signup"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // -------------------------------------------------------------
  // パターンの分岐
  // -------------------------------------------------------------

  // ケース1：未ログイン ＋ 公開パス以外にアクセスしようとした
  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ケース2：ログイン済み ＋ ログイン・登録系ページにアクセスしようとした（逆流防止）
  if (session && isPublicPath) {
    // 認証済みルート（(protected)/page.tsx すなわち "/"）へリダイレクト
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  /*
   * 以下のパス以外すべてに proxy を適用する:
   * 1. api (API routes)
   * 2. _next/static (static files)
   * 3. _next/image (image optimization files)
   * 4. favicon.ico, sitemap.xml, robots.txt (metadata files)
   */
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
