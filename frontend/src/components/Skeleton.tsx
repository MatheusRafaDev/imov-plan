import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-shimmer rounded bg-secondary", className)}
      {...props}
    />
  );
}

// Skeleton para o card de meta
export function MetaCardSkeleton() {
  return (
    <div className="p-5 sm:p-8 bg-gradient-ink text-primary-foreground shadow-elevated border-0">
      <div className="h-4 w-32 bg-white/20 rounded mb-2 animate-shimmer" />
      <div className="h-12 w-48 bg-white/20 rounded mb-2 animate-shimmer" />
      <div className="h-4 w-40 bg-white/20 rounded mb-8 animate-shimmer" />
      <div className="grid grid-cols-2 gap-4 sm:gap-6 pt-6 border-t border-white/10">
        <div>
          <div className="h-3 w-16 bg-white/20 rounded mb-1 animate-shimmer" />
          <div className="h-6 w-24 bg-white/20 rounded animate-shimmer" />
        </div>
        <div>
          <div className="h-3 w-12 bg-white/20 rounded mb-1 animate-shimmer" />
          <div className="h-6 w-20 bg-white/20 rounded animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

// Skeleton para o card de falta juntar
export function FaltaJuntarSkeleton() {
  return (
    <div className="p-5 sm:p-8 shadow-soft border-border/60">
      <div className="flex items-center gap-3 mb-1">
        <div className="p-2 bg-secondary/50 rounded-lg">
          <div className="h-5 w-5 bg-secondary rounded animate-shimmer" />
        </div>
        <div className="h-4 w-24 bg-secondary rounded animate-shimmer" />
      </div>
      <div className="h-10 w-32 bg-secondary rounded mb-8 animate-shimmer" />

      <div className="space-y-5">
        <div className="h-6 w-full bg-secondary rounded animate-shimmer" />
        <div className="h-px w-full bg-border/40" />
        <div className="h-6 w-full bg-secondary rounded animate-shimmer" />
        <div className="h-px w-full bg-border/40" />
        <div className="h-6 w-full bg-secondary rounded animate-shimmer" />
      </div>
    </div>
  );
}

// Skeleton para o formulário de imóvel
export function ImovelFormSkeleton() {
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 shadow-soft border-border/60">
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-5 w-32 animate-shimmer rounded" />
          <div className="h-12 w-full animate-shimmer rounded" />
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="h-5 w-28 animate-shimmer rounded" />
            <div className="h-12 w-full animate-shimmer rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-5 w-20 animate-shimmer rounded" />
            <div className="h-4 w-full animate-shimmer rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-5 w-24 animate-shimmer rounded" />
            <div className="h-12 w-full animate-shimmer rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-5 w-32 animate-shimmer rounded" />
            <div className="h-12 w-full animate-shimmer rounded" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-6">
        <div className="h-12 w-48 animate-shimmer rounded" />
      </div>
    </div>
  );
}