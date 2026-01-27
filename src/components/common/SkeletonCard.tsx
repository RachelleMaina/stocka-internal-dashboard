import Skeleton from "react-loading-skeleton";

export const SkeletonCard= ()=> {
  return (
 <div className="p-2 md:p-4 rounded-md bg-neutral-100 border border-neutral-200 dark:bg-neutral-800 dark:border-neutral-600">
  <div className="flex items-center gap-2 md:gap-4">
    <Skeleton circle height={32} width={32} />
    <div className="flex-1 space-y-1 md:space-y-2">
      <Skeleton height={8} width="50%" />
      <Skeleton height={16} width="70%" />
    </div>
  </div>
</div>

  );
}