import { Skeleton } from "@/components/ui/skeleton";

export function OverviewSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading overview">
      <Skeleton className="mt-6 h-4 w-96 max-w-full" />
      <Skeleton className="mt-10 h-5 w-48" />
      <Skeleton className="mt-5 h-56 w-full" />
      <div className="mt-12 grid gap-12 xl:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}
