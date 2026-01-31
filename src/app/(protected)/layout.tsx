import Navigation from "@/components/Navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* 認証者へのみナビゲーションを表示する */}
      <Navigation />
      {children}
    </>
  );
}
