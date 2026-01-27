import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const PageSkeleton = () => {
  return (
    <SkeletonTheme
      baseColor="var(--skeleton-base, #e5e7eb)"
      highlightColor="var(--skeleton-highlight, #f3f4f6)"
    >
      <div className="min-h-screen w-full bg-neutral-100 dark:bg-neutral-950 dark:[--skeleton-base:#374151] dark:[--skeleton-highlight:#4b5563]">
        {/* Main Content */}
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton width={80} height={16} borderRadius={4} />
              <Skeleton width={16} height={16} />
              <Skeleton width={100} height={16} borderRadius={4} />
            </div>
            <Skeleton width={100} height={32} borderRadius={9999} />
          </div>

          {/* Cards (Default: Mobile) or Table (md: Desktop) */}
          <div className="md:hidden grid gap-4">
            {Array(3).fill(0).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-neutral-100 rounded-xl p-4 flex flex-col gap-3 dark:bg-neutral-900 dark:border-neutral-600"
              >
                <div className="flex justify-between items-start gap-2">
                  <Skeleton width={150} height={24} borderRadius={4} />
                  <Skeleton circle width={24} height={24} />
                </div>
                <div className="mb-2">
                  <Skeleton width={120} height={16} borderRadius={4} />
                </div>
                <div className="flex gap-4 flex-wrap justify-between">
                  <div className="text-sm">
                    <div className="flex items-center gap-1">
                      <Skeleton circle width={16} height={16} />
                      <Skeleton width={60} height={12} borderRadius={4} />
                    </div>
                    <Skeleton width={100} height={16} borderRadius={4} />
                  </div>
                  <div className="text-sm">
                    <div className="flex items-center gap-1">
                      <Skeleton circle width={16} height={16} />
                      <Skeleton width={60} height={12} borderRadius={4} />
                    </div>
                    <Skeleton width={80} height={16} borderRadius={4} />
                  </div>
                  <div className="text-sm">
                    <div className="flex items-center gap-1">
                      <Skeleton circle width={16} height={16} />
                      <Skeleton width={60} height={12} borderRadius={4} />
                    </div>
                    <Skeleton width={100} height={16} borderRadius={4} />
                  </div>
                </div>
                <Skeleton height={40} borderRadius={9999} />
              </div>
            ))}
          </div>

          <div className="hidden md:block bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-600 rounded-xl overflow-hidden">
            <div className="p-4">
              <Skeleton width={200} height={24} borderRadius={4} className="mb-4" />
              <div className="grid grid-cols-6 gap-4">
                {Array(6).fill(0).map((_, i) => (
                  <Skeleton key={i} width={100} height={16} borderRadius={4} />
                ))}
              </div>
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="grid grid-cols-6 gap-4 py-2 border-t border-neutral-100 dark:border-neutral-600">
                  {Array(6).fill(0).map((_, j) => (
                    <Skeleton key={j} width={100} height={16} borderRadius={4} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
};

export default PageSkeleton;