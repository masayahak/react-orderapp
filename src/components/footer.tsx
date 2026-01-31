export function Footer() {
  return (
    <>
      <footer className="mt-8 mb-4 text-xs text-center text-muted-foreground">
        <div className="mb-2">
          <span>Developed by </span>
          <a
            href="https://hakamata-soft.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-900 hover:underline"
          >
            HakamataSoft
          </a>
        </div>

        <div className="flex text-xs items-center justify-center gap-2">
          <span className="text-muted-foreground">Powered by</span>
          {/* Next.js のブランドカラー (黒/白) */}
          <span className="bg-black text-white px-2 py-0.5 rounded font-bold">
            Next.js
          </span>
          <span className="text-gray-800">&</span>
          {/* Tailwind CSS のブランドカラー (シアン) */}
          <span className="bg-cyan-500 text-white px-2 py-0.5 rounded font-bold">
            Tailwind CSS
          </span>
        </div>
      </footer>
    </>
  );
}
