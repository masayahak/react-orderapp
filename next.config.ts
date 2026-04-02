import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // 開発時のバグ検出強化
  reactStrictMode: true,
  // X-Powered-By: Next.js ヘッダー除去（セキュリティ）
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self'",
              "img-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join("; "),
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },

  // 大きなパッケージのツリーシェイクを強制する
  // (lucideなどのimort対象分のみパッケージ対象)
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },

  // neon DBは WebSocket経由でDBにPool接続するためバンドル対象外にする
  // (WebSocketはバンドル対象に含めない)
  serverExternalPackages: ["@neondatabase/serverless", "ws"],
};

export default nextConfig;
