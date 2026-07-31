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

// Skeleton para a página de Pessoas
export function PessoasPageSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-4 w-20 animate-shimmer rounded" />
        <div className="h-10 w-64 animate-shimmer rounded" />
        <div className="h-5 w-80 animate-shimmer rounded" />
      </div>

      {/* Total guardado card */}
      <div className="p-5 border border-border/60 rounded-xl bg-secondary/20 flex flex-col gap-3">
        <div className="h-4 w-48 animate-shimmer rounded" />
        <div className="h-9 w-36 animate-shimmer rounded" />
        <div className="flex gap-2">
          {[1, 2].map(i => (
            <div key={i} className="h-6 w-20 animate-shimmer rounded-full" />
          ))}
        </div>
      </div>

      {/* Pessoa cards */}
      {[1, 2].map(i => (
        <div key={i} className="border border-border/60 rounded-2xl p-6 space-y-5 bg-card shadow-soft">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 animate-shimmer rounded-full" />
              <div className="space-y-1.5">
                <div className="h-5 w-32 animate-shimmer rounded" />
                <div className="h-3 w-20 animate-shimmer rounded" />
              </div>
            </div>
            <div className="h-8 w-20 animate-shimmer rounded" />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[1, 2, 3].map(j => (
              <div key={j} className="space-y-1.5">
                <div className="h-4 w-24 animate-shimmer rounded" />
                <div className="h-10 w-full animate-shimmer rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Bottom card */}
      <div className="p-6 border border-border/60 rounded-xl bg-secondary/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-4 w-36 animate-shimmer rounded" />
          <div className="h-9 w-32 animate-shimmer rounded" />
        </div>
        <div className="h-12 w-40 animate-shimmer rounded" />
      </div>
    </div>
  );
}

// Skeleton para a página de Planejamento (aportes extras + tabela)
export function PlanejamentoPageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-4 w-20 animate-shimmer rounded" />
        <div className="h-10 w-56 animate-shimmer rounded" />
        <div className="h-5 w-96 animate-shimmer rounded" />
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-4 sm:p-6 border border-border/50 rounded-xl space-y-4">
            <div className="h-4 w-28 animate-shimmer rounded" />
            <div className="h-14 w-24 animate-shimmer rounded mx-auto" />
            <div className="h-4 w-20 animate-shimmer rounded mx-auto" />
          </div>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-border/40">
        {/* Aportes extras skeleton */}
        <div className="rounded-2xl border border-border/40 bg-card p-6 space-y-4">
          <div className="h-7 w-36 animate-shimmer rounded" />
          <div className="h-4 w-60 animate-shimmer rounded" />
          <div className="mt-6 border-2 border-dashed border-border/40 rounded-2xl p-10 flex flex-col items-center gap-3">
            <div className="h-14 w-14 animate-shimmer rounded-full" />
            <div className="h-5 w-48 animate-shimmer rounded" />
            <div className="h-4 w-64 animate-shimmer rounded" />
            <div className="h-10 w-48 animate-shimmer rounded mt-2" />
          </div>
        </div>

        {/* Tabela skeleton */}
        <div className="rounded-2xl border border-border/40 bg-card p-6 space-y-3">
          <div className="h-7 w-28 animate-shimmer rounded" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 w-full animate-shimmer rounded" style={{ opacity: 1 - i * 0.08 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Skeleton para o Seletor de Cenário (Pessimista, Base, Otimista)
export function CenarioSelectorSkeleton() {
  return (
    <div className="inline-flex bg-secondary/40 p-1 rounded-xl w-full sm:w-auto">
      {[1, 2, 3].map(i => (
        <div 
          key={i} 
          className="px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5"
          style={{ width: "84px", height: "32px" }}
        >
          <div className="h-3 w-12 animate-shimmer rounded bg-secondary/80" />
        </div>
      ))}
    </div>
  );
}