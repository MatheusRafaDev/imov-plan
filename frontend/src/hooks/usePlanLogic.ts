import { usePlanStore } from '@/store/usePlanStore';
import { useSaveDraft, usePlanDraft } from '@/hooks/usePlanDraft';
import { useCalcularSimulacao, useUltimaSimulacao } from '@/hooks/useSimulacao';
import { useDebouncedCallback } from 'use-debounce';
import Cookies from 'js-cookie';

export function usePlanLogic() {
  const planoId = Cookies.get("imovplan_planoId") || null;
  
  // 1. Data Fetching (Queries)
  const { data: draftData, isLoading: isDraftLoading } = usePlanDraft(planoId);
  const { data: simulacaoData, isLoading: isSimulacaoLoading } = useUltimaSimulacao(planoId);
  
  // 2. Local State (Zustand)
  const state = usePlanStore();
  
  // 3. Mutations
  const { mutateAsync: saveDraftMutation } = useSaveDraft();
  const { mutateAsync: calcularSimulacao, isPending: isCalculating } = useCalcularSimulacao();

  // 4. Combined Save Function with Debounce
  const saveDraftCore = async (patch?: Partial<typeof state>) => {
    const payload = {
      objetivo: patch?.objetivo !== undefined ? patch.objetivo : state.objetivo,
      pessoas: patch?.pessoas !== undefined ? patch.pessoas : state.pessoas,
      bancoEscolhido: patch?.bancoEscolhido !== undefined ? patch.bancoEscolhido : state.bancoEscolhido,
      aportesExtras: patch?.aportesExtras !== undefined ? patch.aportesExtras : state.aportesExtras,
      aportesRegularesEditados: patch?.aportesRegularesEditados !== undefined ? patch.aportesRegularesEditados : state.aportesRegularesEditados,
      aportesRegularesEditadosPorPessoa: patch?.aportesRegularesEditadosPorPessoa !== undefined ? patch.aportesRegularesEditadosPorPessoa : state.aportesRegularesEditadosPorPessoa,
      mesesConcluidos: patch?.mesesConcluidos !== undefined ? patch.mesesConcluidos : state.mesesConcluidos,
    };
    
    // Format the payload to PlanoDraftPayload structure before sending
    const formattedPayload = {
      objetivo: payload.objetivo ? {
        valorImovel: Number(payload.objetivo.valorImovel) || 0,
        percentualEntrada: Number(payload.objetivo.percentualEntrada) || 0,
        percentualCustosExtras: Number(payload.objetivo.percentualCustosExtras) || 0,
        valorJaGuardado: Number(payload.objetivo.valorJaGuardado) || 0,
        taxaCdiAnual: Number(payload.objetivo.taxaCdiAnual) || 10.5,
        percentualCdi: Number(payload.objetivo.percentualCdi) || 100,
        prazoMaxMeses: Number(payload.objetivo.prazoMaxMeses) || 0,
        dataInicio: payload.objetivo.dataInicio ? (() => {
          const d = new Date(payload.objetivo.dataInicio);
          if (isNaN(d.getTime())) return null;
          const y = d.getFullYear();
          const mo = String(d.getMonth() + 1).padStart(2, "0");
          return `${y}-${mo}-01`;
        })() : null,
        nomePlano: payload.objetivo.nomePlano || "Imóvel",
        tipoInvestimento: payload.objetivo.tipoInvestimento || "",
        estado: payload.objetivo.estado || undefined,
        cidade: payload.objetivo.cidade || undefined,
      } : null,
      pessoas: payload.pessoas || [],
      bancoEscolhido: payload.bancoEscolhido || null,
      aportesExtras: payload.aportesExtras || [],
      aportesRegularesEditados: payload.aportesRegularesEditados || {},
      aportesRegularesEditadosPorPessoa: payload.aportesRegularesEditadosPorPessoa || {},
      mesesConcluidos: payload.mesesConcluidos || [],
    };

    return await saveDraftMutation({ planoId, payload: formattedPayload });
  };

  // Debounced save
  const debouncedSaveDraft = useDebouncedCallback(saveDraftCore, 1000);

  // Expose traditional saveDraft API
  const saveDraft = async (patch?: any) => {
    // Optimistic update
    if (patch) {
      state.hydrate(patch);
    }
    // Fire debounce
    debouncedSaveDraft(patch);
  };

  const calcularBackend = async (planoIdOverride?: string | null) => {
    const idToUse = planoIdOverride || planoId;
    if (!idToUse) return;
    
    // Create the SimInput payload based on current state
    const payload = {
      objetivo: state.objetivo,
      pessoas: state.pessoas,
      aportesExtras: state.aportesExtras,
      aportesRegularesEditados: state.aportesRegularesEditados,
      aportesRegularesEditadosPorPessoa: state.aportesRegularesEditadosPorPessoa,
    };
    
    await calcularSimulacao({ planoId: idToUse, payload });
  };

  const salvarPlano = async (patch?: any) => {
    if (patch) state.hydrate(patch);
    return await saveDraftCore(patch);
  };

  return {
    ...state,
    planoId,
    backendData: simulacaoData,
    calculating: isCalculating || isSimulacaoLoading,
    isDraftLoading,
    saveDraft,
    salvarPlano,
    calcularBackend,
  };
}
