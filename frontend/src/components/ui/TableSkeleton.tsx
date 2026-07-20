import React from "react";
import { Skeleton } from "./Skeleton";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showFinancials?: boolean;
}

/**
 * TableSkeleton - Skeleton loading state for TabelaMesAMes
 */
export function TableSkeleton({ rows = 8, columns = 5, showFinancials = true }: TableSkeletonProps) {
  const totalColumns = showFinancials ? columns + 4 : columns;
  
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton width="200px" height="28px" />
          <Skeleton width="300px" height="16px" />
        </div>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto border border-border/50 rounded-xl shadow-sm bg-card">
        <div className="min-w-max">
          {/* Table Header */}
          <div className="bg-secondary/95 border-b border-border/50 px-3 py-2.5 flex gap-3">
            {Array.from({ length: totalColumns }).map((_, i) => (
              <Skeleton key={`header-${i}`} width={i === 0 ? "60px" : "80px"} height="16px" />
            ))}
          </div>
          
          {/* Table Body */}
          <div className="divide-y divide-border/40">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <div key={`row-${rowIndex}`} className="px-3 py-3 flex gap-3">
                {Array.from({ length: totalColumns }).map((_, colIndex) => (
                  <Skeleton 
                    key={`cell-${rowIndex}-${colIndex}`} 
                    width={colIndex === 0 ? "40px" : "70px"} 
                    height="16px" 
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
