export function ListPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 shimmer rounded-lg" />
      <div className="h-10 rounded-xl border bg-card shimmer" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl border bg-card shimmer" />
        ))}
      </div>
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="h-4 w-24 shimmer rounded" />
      <div className="h-8 w-64 shimmer rounded-lg" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-32 rounded-xl border bg-card shimmer" />
        <div className="h-32 rounded-xl border bg-card shimmer" />
      </div>
      <div className="h-24 rounded-xl border bg-card shimmer" />
      <div className="h-48 rounded-xl border bg-card shimmer" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-5 w-32 shimmer rounded-lg" />
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-card/50 shimmer" />
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-5 w-40 shimmer rounded-lg" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-card/50 shimmer" />
        ))}
      </div>
      <div className="h-10 w-28 rounded-lg shimmer" />
    </div>
  );
}
