export default function CatalogLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-8 w-32 rounded-lg bg-slate-200 dark:bg-navy-700" />
      <div className="flex gap-8">
        <div className="hidden w-52 shrink-0 space-y-4 lg:block">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-slate-200 dark:bg-navy-700" />
          ))}
        </div>
        <div className="flex-1 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-slate-200 dark:border-navy-600">
              <div className="aspect-[2/3] bg-slate-200 dark:bg-navy-700" />
              <div className="p-3 space-y-2">
                <div className="h-3 w-3/4 rounded bg-slate-200 dark:bg-navy-700" />
                <div className="h-4 w-full rounded bg-slate-200 dark:bg-navy-700" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
