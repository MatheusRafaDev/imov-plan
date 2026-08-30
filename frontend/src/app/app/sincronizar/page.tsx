"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";
import { TableSkeleton } from "@/components/ui/TableSkeleton";

const TabelaConciliacao = dynamic(() => import("@/components/TabelaConciliacao").then(mod => ({ default: mod.TabelaConciliacao })), {
  loading: () => <TableSkeleton />,
  ssr: false
});

export default function SincronizarPage() {
  const router = useRouter();

  return (
    <div className="max-w-screen-xl w-full mx-auto space-y-6 px-4 sm:px-6 md:px-8 py-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-primary transition-colors" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-6 shadow-sm">
        <TabelaConciliacao />
      </div>
    </div>
  );
}
