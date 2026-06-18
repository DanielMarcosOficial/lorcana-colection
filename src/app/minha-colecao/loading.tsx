export default function CollectionLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-44 rounded-lg bg-gray-200 dark:bg-gray-700" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-gray-200 dark:bg-gray-700" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-56 rounded-xl bg-gray-200 dark:bg-gray-700" />
        ))}
      </div>
    </div>
  );
}
