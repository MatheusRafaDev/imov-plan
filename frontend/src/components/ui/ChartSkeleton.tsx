import React from "react";
import { Skeleton } from "./Skeleton";

/**
 * ChartSkeleton - Skeleton loading state for InvestmentChart
 */
export function ChartSkeleton() {
  return (
    <div className="p-6 border-border/50 rounded-xl border bg-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton width="180px" height="24px" />
        <div className="flex items-center gap-4">
          <Skeleton width="100px" height="16px" />
          <Skeleton width="100px" height="16px" />
        </div>
      </div>
      
      {/* Chart area */}
      <div className="h-[240px] sm:h-[280px] md:h-[320px] w-full space-y-3">
        <Skeleton width="100%" height="100%" rounded="lg" />
      </div>
    </div>
  );
}
