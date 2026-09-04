"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function VersionPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["version"],
    queryFn: async () => {
      const response = await api.get("/Version");
      return response.data;
    },
  });

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8 font-mono">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-brand-500">Deploy Version</h1>
        
        {isLoading && <p className="animate-pulse text-neutral-400">Loading deploy information...</p>}
        {error && <p className="text-red-400 bg-red-950/50 p-4 rounded-lg border border-red-900">Erro ao buscar a versão. O backend pode estar fora do ar ou atualizando.</p>}
        
        {data && (
          <>
            <div className="bg-neutral-800/50 p-4 rounded-lg border border-neutral-700/50">
              <h2 className="text-xl font-semibold mb-2 text-neutral-200">Commit Hash (Backend)</h2>
              <p className="bg-neutral-950 p-3 rounded font-bold text-green-400 border border-neutral-800">
                {data.commit}
              </p>
            </div>

            <div className="bg-neutral-800/50 p-4 rounded-lg border border-neutral-700/50">
              <h2 className="text-xl font-semibold mb-2 text-neutral-200">Último Deploy Log</h2>
              <pre className="bg-neutral-950 p-4 rounded overflow-auto text-sm text-neutral-300 whitespace-pre-wrap max-h-[60vh] border border-neutral-800">
                {data.lastDeployLog}
              </pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
