# middleware.ts/proxy.ts

- Next.js 16から proxy.tsが正式
- あえて高速化のために proxy.ts ではcookieの存在チェックのみにしている
- 各ページのレンダリング前に sessionやroleの確実な確認を実装している
