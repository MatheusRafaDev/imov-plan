import { useMemo } from 'react';
import { usePlanStore } from '@/store/usePlanStore';
import { useSaveDraft, usePlanDraft } from '@/hooks/usePlanDraft';
import { useCalcularSimulacao, useUltimaSimulacao } from '@/hooks/useSimulacao';
import { useDebouncedCallback } from 'use-debounce';
import { calcularEvolucaoDiariaAteHoje, calcularEvolucaoDiariaDoMes } from '@/lib/finance';

// Fila global para serializar requisições de salvamento e evitar concorrência
let globalSaveQueue: Promise<any> = Promise.resolve();

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
          taxaCdiAnual: payload.objetivo.taxaCdiAnual !== undefined && payload.objetivo.taxaCdiAnual !== null ? Number(payload.objetivo.taxaCdiAnual) : 10.5,
          percentualCdi: payload.objetivo.percentualCdi !== undefined && payload.objetivo.percentualCdi !== null ? Number(payload.objetivo.percentualCdi) : 100,
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
        pessoas: (payload.pessoas || []).map((p: any) => ({
          id: p.id,
          nome: p.nome || "",
          renda_mensal: Number(p.renda_mensal) || 0,
          renda_complementar: Number(p.renda_complementar) || 0,
          gastos_mensais: Number(p.gastos_mensais) || 0,
          usar_gastos_detalhados: Boolean(p.usar_gastos_detalhados),
          gastos_detalhados: (p.gastos_detalhados || []).map((g: any) => ({
            id: g.id,
            nome: g.nome || "",
            valor: Number(g.valor) || 0,
            categoria: g.categoria || "",
          })),
          aporte_mensal: Number(p.aporte_mensal) || 0,
          diaAporte: p.diaAporte !== undefined && p.diaAporte !== null && p.diaAporte !== "" ? Number(p.diaAporte) : 5,
          valorInicial: Number(p.valorInicial) || 0,
          tipoInvestimento: p.tipoInvestimento || undefined,
          valorAtual: p.valorAtual !== undefined && p.valorAtual !== null && p.valorAtual !== "" ? Number(p.valorAtual) : Number(p.valorInicial) || 0,
          dataValorAtual: p.dataValorAtual || new Date().toISOString(),
        })),
        bancoEscolhido: payload.bancoEscolhido ? {
          id: payload.bancoEscolhido.id,
          nome: payload.bancoEscolhido.nome || "",
          taxa: Number(payload.bancoEscolhido.taxa) || 0,
        } : null,
        aportesExtras: (payload.aportesExtras || []).map((a: any) => ({
          data: a.data || new Date().toISOString(),
          valor: Number(a.valor) || 0,
          origem: a.origem || "",
          pessoaNome: a.pessoaNome || undefined,
          pessoaId: a.pessoaId || undefined,
        })),
        aportesRegularesEditados: Object.fromEntries(
          Object.entries(payload.aportesRegularesEditados || {})
            .filter(([k, v]) => !isNaN(Number(k)) && !isNaN(Number(v)))
            .map(([k, v]) => [Number(k), Number(v)])
        ),
        aportesRegularesEditadosPorPessoa: Object.fromEntries(
          Object.entries(payload.aportesRegularesEditadosPorPessoa || {})
            .map(([pid, mesMap]) => [
              pid,
              Object.fromEntries(
                Object.entries(mesMap || {})
                  .filter(([k, v]) => !isNaN(Number(k)) && !isNaN(Number(v)))
                  .map(([k, v]) => [Number(k), Number(v)])
              )
            ])
        ),
        mesesConcluidos: (payload.mesesConcluidos || []).map((m: any) => Number(m)).filter((m: number) => !isNaN(m)),
      };

      const formattedPayloadStr = JSON.stringify(formattedPayload);
      if (formattedPayloadStr === currentState.lastSavedDraftPayloadStr) {
        console.log("[saveDraftCore] Nenhuma mudança no rascunho. Pulando salvamento.");
        return planoId;
      }

      return new Promise<string | null>((resolve) => {
        globalSaveQueue = globalSaveQueue.then(async () => {
          try {
            const savedId = await saveDraftMutation({ planoId, payload: formattedPayload });
            usePlanStore.getState().setLastSavedDraftPayloadStr(formattedPayloadStr);
            resolve(savedId);
          } catch (error: any) {
            const status = error?.response?.status;
            if (status !== 401) {
              console.error('[saveDraftCore] Erro ao salvar draft:', status || error?.message, error?.response?.data);
            }
            resolve(null);
          }
        });
      });
    } catch (error: any) {
      console.error('[saveDraftCore] Erro na preparação do payload:', error?.message);
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

  const calcularBackend = async (planoIdOverride?: string | null, patchOverride?: any) => {
    if (patchOverride) {
      usePlanStore.getState().hydrate(patchOverride);
      usePlanStore.getState().setLastCalculatedPayloadStr("");
    }
    const currentState = usePlanStore.getState();
    const idToUse = planoIdOverride || currentState.planoId;
    if (!idToUse) {
      throw new Error("Plano ainda não está disponível para calcular a simulação.");
    }
    
    // Create the SimInput payload based on current state to match backend expectations
    const payload = {
      objetivoId: idToUse,
      taxaCDI: currentState.objetivo?.taxaCdiAnual ?? 10.5,
      percentualCdi: currentState.objetivo?.percentualCdi ?? 100,
      valorImovel: currentState.objetivo?.valorImovel,
      percentualEntrada: currentState.objetivo?.percentualEntrada,
      prazoMaxMeses: currentState.objetivo?.prazoMaxMeses,
      dataInicio: currentState.objetivo?.dataInicio,
      valorJaGuardado: currentState.objetivo?.valorJaGuardado,
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
    if (!patchOverride && payloadStr === currentState.lastCalculatedPayloadStr) {
      console.log("[calcularBackend] Nenhuma mudança detectada. Pulando recalculo para poupar o backend.");
      return;
    }
    
    const res = await calcularSimulacao({ planoId: idToUse, payload });
    currentState.setLastCalculatedPayloadStr(payloadStr);
    return res;
  };

  const salvarPlano = async (patch?: any) => {
    if (patch) state.hydrate(patch);
    return await saveDraftCore(patch);
  };

  // Calcula o progresso atual com base no saldo do dia de hoje (evolução diária) ou meses concluídos
  const { progressoAtual, progressoAtualPorPessoa } = useMemo(() => {
    let pAtual = Number(state.objetivo?.valorJaGuardado || 0);
    const pPorPessoa: Record<string, number> = {};
    const taxaCdiAnual = Number(state.objetivo?.taxaCdiAnual ?? 10.5);
    const tipoInvestimento = state.objetivo?.tipoInvestimento ?? "cdb_100";
    
    state.pessoas.forEach(p => {
      const valorBase = Number(p.valorAtual ?? p.valorInicial ?? 0);
      const evolucao = p.dataValorAtual
        ? calcularEvolucaoDiariaAteHoje(valorBase, p.dataValorAtual, taxaCdiAnual, p.tipoInvestimento).saldoAtualizado
        : valorBase;
      pPorPessoa[p.id] = evolucao;
    });

    const somaPessoasGuardado = state.pessoas.reduce(
      (acc, p) => acc + Number(pPorPessoa[p.id] || 0),
      0
    );
    if (somaPessoasGuardado > 0) {
      pAtual = Math.max(pAtual, somaPessoasGuardado);
    }

    // Sincroniza com a evolução diária do mês em andamento para refletir exatamente o saldo do dia atual (ex: dia 16)
    if (simulacaoData?.detalhesMensais && simulacaoData.detalhesMensais.length > 0) {
      const hoje = new Date();
      const hojeAno = hoje.getFullYear();
      const hojeMes = hoje.getMonth() + 1; // 1-12
      const diaHoje = hoje.getDate();

      // Localiza o mês ativo pelo calendário atual ou primeiro mês da simulação
      let rowMesAtual = simulacaoData.detalhesMensais.find((r: any) => {
        try {
          const d = new Date(r.dataReferencia);
          return d.getUTCFullYear() === hojeAno && (d.getUTCMonth() + 1) === hojeMes;
        } catch {
          return false;
        }
      });

      if (!rowMesAtual) {
        if (state.mesesConcluidos.length === 0) {
          rowMesAtual = simulacaoData.detalhesMensais.find((r: any) => r.mes === 1) || simulacaoData.detalhesMensais[0];
        } else {
          const proxMes = Math.max(...state.mesesConcluidos) + 1;
          rowMesAtual = simulacaoData.detalhesMensais.find((r: any) => r.mes === proxMes) || simulacaoData.detalhesMensais[simulacaoData.detalhesMensais.length - 1];
        }
      }

      if (rowMesAtual) {
        const prevRow = simulacaoData.detalhesMensais.find((x: any) => x.mes === rowMesAtual.mes - 1);
        const saldoInicialMes = prevRow 
          ? Number(prevRow.totalAcumulado || 0) 
          : (Number(simulacaoData.valorJaGuardado || state.objetivo?.valorJaGuardado || somaPessoasGuardado) || 0);

        const rowExtras = (state.aportesExtras || []).filter(e => {
          if (!e?.data || !rowMesAtual.dataReferencia) return false;
          try {
            const dExtra = new Date(e.data);
            const dRow = new Date(rowMesAtual.dataReferencia);
            return dExtra.getUTCFullYear() === dRow.getUTCFullYear() && dExtra.getUTCMonth() === dRow.getUTCMonth();
          } catch {
            return false;
          }
        });

        const diaAporteConfig = state.diasDoAportePorMes?.[rowMesAtual.mes] ?? state.diaDoAporte ?? 5;

        const aportesParticipantes = state.pessoas.map(p => {
          const partRow = (rowMesAtual.participantes || []).find((part: any) => part.participanteId === p.id);
          const valorAporte = partRow ? Number(partRow.aporteMensal || 0) : Number(p.aporte_mensal || 0);
          const diaPessoa = p.diaAporte ?? diaAporteConfig;
          return {
            pessoaId: p.id,
            pessoaNome: p.nome,
            valor: valorAporte,
            diaAporte: diaPessoa,
          };
        });

        const evolucaoMes = calcularEvolucaoDiariaDoMes({
          dataReferencia: rowMesAtual.dataReferencia,
          saldoInicialMes,
          aporteRegular: Number(rowMesAtual.aporteMensal || 0),
          diaAporteRegular: diaAporteConfig,
          aportesParticipantes,
          aportesExtras: rowExtras,
          taxaCdiAnual,
          tipoInvestimento,
        });

        const diaCorrespondente = evolucaoMes.dias.find(d => d.dia === diaHoje) || evolucaoMes.dias[evolucaoMes.dias.length - 1];

        if (somaPessoasGuardado === 0 && diaCorrespondente && diaCorrespondente.saldoFinal > 0) {
          pAtual = diaCorrespondente.saldoFinal;

          // Distribui proporcionalmente o saldo de fechamento do dia atual entre os participantes respeitando o dia de cada um
          const totalBase = (rowMesAtual.participantes || []).reduce((acc: number, part: any) => {
            const prevPart = prevRow?.participantes?.find((p: any) => p.participanteId === part.participanteId);
            const inicialPart = prevPart ? Number(prevPart.saldo || 0) : Number(pPorPessoa[part.participanteId] || 0);
            const pessoaState = state.pessoas.find(p => p.id === part.participanteId);
            const diaPessoa = pessoaState?.diaAporte ?? diaAporteConfig;
            const aportePart = diaHoje >= diaPessoa ? Number(part.aporteMensal || 0) : 0;
            return acc + inicialPart + aportePart;
          }, 0);

          const rendimentoAteHoje = diaCorrespondente.rendimentoAcumuladoAteDia || 0;

          (rowMesAtual.participantes || []).forEach((part: any) => {
            const prevPart = prevRow?.participantes?.find((p: any) => p.participanteId === part.participanteId);
            const inicialPart = prevPart ? Number(prevPart.saldo || 0) : Number(pPorPessoa[part.participanteId] || 0);
            const pessoaState = state.pessoas.find(p => p.id === part.participanteId);
            const diaPessoa = pessoaState?.diaAporte ?? diaAporteConfig;
            const aportePart = diaHoje >= diaPessoa ? Number(part.aporteMensal || 0) : 0;
            const basePart = inicialPart + aportePart;

            const proporcao = totalBase > 0 ? (basePart / totalBase) : (1 / (rowMesAtual.participantes.length || 1));
            const rendimentoPart = rendimentoAteHoje * proporcao;

            pPorPessoa[part.participanteId] = Number((basePart + rendimentoPart).toFixed(2));
          });
        }
      }
    }

    // Se houver meses marcados manualmente como concluídos além do mês atual, prevalece o fechamento do último mês concluído
    if (state.mesesConcluidos.length > 0 && simulacaoData?.detalhesMensais) {
      const ultimoMes = Math.max(...state.mesesConcluidos);
      const row = simulacaoData.detalhesMensais.find((r: any) => r.mes === ultimoMes);
      if (row && (!pAtual || row.totalAcumulado > pAtual)) {
        pAtual = row.totalAcumulado;
        (row.participantes || []).forEach((p: any) => {
          pPorPessoa[p.participanteId] = p.saldo;
        });
      }
    }

    return { progressoAtual: pAtual, progressoAtualPorPessoa: pPorPessoa };
  }, [state.objetivo, state.pessoas, state.mesesConcluidos, state.aportesExtras, state.diasDoAportePorMes, state.diaDoAporte, simulacaoData]);

  return {
    ...state,
    planoId,
    backendData: simulacaoData,
    calculating: isCalculating || isSimulacaoLoading,
    isDraftLoading,
    saveDraft,
    salvarPlano,
    calcularBackend,
    progressoAtual,
    progressoAtualPorPessoa,
  };
}
