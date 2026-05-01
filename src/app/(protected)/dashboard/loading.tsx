export default function DashboardLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50/30 overflow-hidden">
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="h-10 rounded-lg bg-slate-200 animate-pulse" />
      </div>
      <main className="flex-1 min-h-0 px-3 pb-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-full">
          <div className="lg:col-span-8 h-full min-h-0 rounded-xl bg-slate-200 animate-pulse" />
          <div className="lg:col-span-4 flex flex-col gap-3 h-full min-h-0">
            <div className="flex-1 min-h-0 rounded-xl bg-slate-200 animate-pulse" />
            <div className="flex-1 min-h-0 rounded-xl bg-slate-200 animate-pulse" />
          </div>
        </div>
      </main>
    </div>
  );
}
