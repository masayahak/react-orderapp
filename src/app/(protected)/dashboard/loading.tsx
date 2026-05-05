import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
      <div className="bg-white rounded-xl shadow-xl px-10 py-8 flex flex-col items-center gap-4 max-w-sm w-full mx-4">
        <Loader2 className="size-10 animate-spin text-indigo-600" />
        <p className="text-sm text-slate-600 text-center">
          データを読み込んでいます。しばらくお待ち下さい。
        </p>
      </div>
    </div>
  );
}
