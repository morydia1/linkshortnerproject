import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-32 w-full" />
    </main>
  );
}
