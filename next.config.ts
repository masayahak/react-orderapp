import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 開発時のバグ検出強化
  reactStrictMode: true,
  // X-Powered-By: Next.js ヘッダー除去（セキュリティ）
  poweredByHeader: false,

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
