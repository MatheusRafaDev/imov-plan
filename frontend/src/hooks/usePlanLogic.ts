import { usePlanStore } from '@/store/usePlanStore';
import { useSaveDraft, usePlanDraft } from '@/hooks/usePlanDraft';
import { useCalcularSimulacao, useUltimaSimulacao } from '@/hooks/useSimulacao';
import { useDebouncedCallback } from 'use-debounce';

export function usePlanLogic() {
  const state = usePlanStore();
  const planoId = state.planoId;

  // 1. Data Fetching (Queries)
  const { isLoading: isDraftLoading } = usePlanDraft(planoId);
  const { data: simulacaoData, isLoading: isSimulacaoLoading } = useUltimaSimulacao(planoId);
  
  // 3. Mutations
  const { mutateAsync: saveDraftMutation } = useSaveDraft();
  const { mutateAsync: calcularSimulacao, isPending: isCalculating } = useCalcularSimulacao();

  // 4. Combined Save Function with Debounce
  const saveDraftCore = async (patch?: Partial<typeof state>) => {
    try {
      const currentState = usePlanStore.getState();
      const payload = {
        objetivo: patch?.objetivo !== undefined ? patch.objetivo : currentState.objetivo,
        pessoas: patch?.pessoas !== undefined ? patch.pessoas : currentState.pessoas,
        bancoEscolhido: patch?.bancoEscolhido !== undefined ? patch.bancoEscolhido : currentState.bancoEscolhido,
        aportesExtras: patch?.aportesExtras !== undefined ? patch.aportesExtras : currentState.aportesExtras,
        aportesRegularesEditados: patch?.aportesRegularesEditados !== undefined ? patch.aportesRegularesEditados : currentState.aportesRegularesEditados,
        aportesRegularesEditadosPorPessoa: patch?.aportesRegularesEditadosPorPessoa !== undefined ? patch.aportesRegularesEditadosPorPessoa : currentState.aportesRegularesEditadosPorPessoa,
        mesesConcluidos: patch?.mesesConcluidos !== undefined ? patch.mesesConcluidos : currentState.mesesConcluidos,
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
    } catch (error: any) {
      const status = error?.response?.status;
      // Não logar erros de autenticação (são esperados e tratados no interceptor do axios)
      if (status !== 401) {
        console.error('[saveDraftCore] Erro ao salvar draft:', status || error?.message);
      }
      return null;
    }
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
    const currentState = usePlanStore.getState();
    const idToUse = planoIdOverride || currentState.planoId;
    if (!idToUse) {
      throw new Error("Plano ainda não está disponível para calcular a simulação.");
    }
    
    // Create the SimInput payload based on current state to match backend expectations
    const payload = {
      objetivoId: idToUse,
      taxaCDI: currentState.objetivo?.taxaCdiAnual || 10.5,
      percentualCdi: currentState.objetivo?.percentualCdi || 100,
      aportesMensais: currentState.pessoas.map((p) => ({
        pessoaId: p.id,
        valor: p.aporte_mensal,
        valorAtual: p.valorAtual,
        dataValorAtual: p.dataValorAtual
      })),
      aportesExtras: currentState.aportesExtras.map((a) => ({
        pessoaId: a.pessoaId || '',
        valor: a.valor,
        data: a.data,
        origem: a.origem
      })),
      aportesRegularesEditados: currentState.aportesRegularesEditados,
      aportesRegularesEditadosPorPessoa: currentState.aportesRegularesEditadosPorPessoa,
      cenario: currentState.cenarioSimulacao || "realista"
    };

    const payloadStr = JSON.stringify(payload);
    if (payloadStr === currentState.lastCalculatedPayloadStr) {
      console.log("[calcularBackend] Nenhuma mudança detectada. Pulando recalculo para poupar o backend.");
      return;
    }
    
    await calcularSimulacao({ planoId: idToUse, payload });
    currentState.setLastCalculatedPayloadStr(payloadStr);
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
