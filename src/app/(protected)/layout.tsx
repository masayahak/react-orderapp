import NavigationServer from "@/components/NavigationServer";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* 認証者へのみナビゲーションを表示する */}
      <NavigationServer />
      {children}
    </>
  );
}
