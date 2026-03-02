import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 公開パスの定義
  const publicPaths = ["/login", "/signup"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // HTTP(ローカル)とHTTPS(本番)の両方のCookie名で取得を試みる
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token");

  const isAuthenticated = !!sessionCookie;

  // -------------------------------------------------------------
  // パターンの分岐
  // -------------------------------------------------------------

  // ケース0：ルートへのアクセス
  if (pathname === "/") {
    const target = isAuthenticated ? "/dashboard" : "/login";
    return NextResponse.redirect(new URL(target, request.url));
  }

  // ケース1：未ログイン ＋ 公開パス以外にアクセスしようとした
  if (!isAuthenticated && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ケース2：ログイン済み ＋ ログイン・登録系ページにアクセスしようとした（逆流防止）
  if (isAuthenticated && isPublicPath) {
    // 認証済みルートへリダイレクト
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
