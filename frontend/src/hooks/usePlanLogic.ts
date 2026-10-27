import { useMemo } from 'react';
import { usePlanStore } from '@/store/usePlanStore';
import { useSaveDraft, usePlanDraft } from '@/hooks/usePlanDraft';
import { useCalcularSimulacao, useUltimaSimulacao } from '@/hooks/useSimulacao';
import { useDebouncedCallback } from 'use-debounce';
import { calcularEvolucaoDiariaDoMes } from '@/lib/finance';
import { getBrasiliaToday } from '@/utils/dates';


// Fila global para serializar requisições de salvamento e evitar concorrência
let globalSaveQueue: Promise<any> = Promise.resolve();

function formatarDataCheckpoint(value?: string | null): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  return getBrasiliaToday().dataStr;
}

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
  const saveDraftCore = async (patch?: any) => {
    try {
      const patchObj =
        patch && (patch.valorImovel !== undefined || patch.nomePlano !== undefined || patch.percentualEntrada !== undefined) && patch.objetivo === undefined
          ? { objetivo: patch }
          : patch;

      if (patchObj?.objetivo) {
        usePlanStore.getState().setObjetivo(patchObj.objetivo);
      }

      const currentState = usePlanStore.getState();
      const payload = {
        objetivo: patchObj?.objetivo !== undefined ? patchObj.objetivo : currentState.objetivo,
        pessoas: patchObj?.pessoas !== undefined ? patchObj.pessoas : currentState.pessoas,
        bancoEscolhido: patchObj?.bancoEscolhido !== undefined ? patchObj.bancoEscolhido : currentState.bancoEscolhido,
        aportesExtras: patchObj?.aportesExtras !== undefined
          ? patchObj.aportesExtras
          : (currentState.aportesExtras.length > 0 ? currentState.aportesExtras : (isDraftLoading ? undefined : [])),
        aportesRegularesEditados: patchObj?.aportesRegularesEditados !== undefined ? patchObj.aportesRegularesEditados : currentState.aportesRegularesEditados,
        aportesRegularesEditadosPorPessoa: patchObj?.aportesRegularesEditadosPorPessoa !== undefined ? patchObj.aportesRegularesEditadosPorPessoa : currentState.aportesRegularesEditadosPorPessoa,
        mesesConcluidos: patchObj?.mesesConcluidos !== undefined ? patchObj.mesesConcluidos : currentState.mesesConcluidos,
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
          dataValorAtual: formatarDataCheckpoint(p.dataValorAtual),
        })),
        bancoEscolhido: payload.bancoEscolhido ? {
          id: payload.bancoEscolhido.id,
          nome: payload.bancoEscolhido.nome || "",
          taxa: Number(payload.bancoEscolhido.taxa) || 0,
        } : null,
        aportesExtras: payload.aportesExtras !== undefined ? (payload.aportesExtras || []).map((a: any) => ({
          data: a.data || new Date().toISOString(),
          valor: Number(a.valor) || 0,
          origem: a.origem || "",
          pessoaNome: a.pessoaNome || undefined,
          pessoaId: a.pessoaId || undefined,
          tipo: (a.tipo ? String(a.tipo).toLowerCase() : "aporte") === "retirada" ? "retirada" : "aporte",
          motivo: a.motivo || undefined,
          revertido: Boolean(a.revertido),
          revertidoEm: a.revertidoEm || undefined,
        })) : undefined,
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
            const currentPlanoId = usePlanStore.getState().planoId || planoId;
            const savedId = await saveDraftMutation({ planoId: currentPlanoId, payload: formattedPayload });
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
        dataValorAtual: formatarDataCheckpoint(p.dataValorAtual)
      })),
      aportesExtras: currentState.aportesExtras.map((a) => ({
        pessoaId: a.pessoaId || '',
        pessoaNome: a.pessoaNome || undefined,
        valor: Number(a.valor) || 0,
        data: a.data,
        origem: a.origem || 'Aporte Extra',
        tipo: (a.tipo ? String(a.tipo).toLowerCase() : "aporte") === "retirada" ? "retirada" : "aporte",
        motivo: a.motivo || undefined,
        revertido: Boolean(a.revertido),
        revertidoEm: a.revertidoEm || undefined,
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
    const normalizedPatch =
      patch && (patch.valorImovel !== undefined || patch.nomePlano !== undefined || patch.percentualEntrada !== undefined) && patch.objetivo === undefined
        ? { objetivo: patch }
        : patch;

    if (normalizedPatch) {
      if (normalizedPatch.objetivo) {
        usePlanStore.getState().setObjetivo(normalizedPatch.objetivo);
      }
      state.hydrate(normalizedPatch);
    }
    return await saveDraftCore(normalizedPatch);
  };

  // Calcula o progresso atual com base no saldo do dia de hoje (evolução diária) ou meses concluídos
  const { progressoAtual, progressoAtualPorPessoa } = useMemo(() => {
    let pAtual = Number(state.objetivo?.valorJaGuardado || 0);
    const pPorPessoa: Record<string, number> = {};
    const taxaCdiAnual = Number(simulacaoData?.taxaCdiAnual || state.objetivo?.taxaCdiAnual || 10.5);
    const tipoInvestimento = state.objetivo?.tipoInvestimento ?? "cdb_100";
    
    const { ano: hojeAno, mes: hojeMes, dia: diaHoje } = getBrasiliaToday();

    // 1. Saldo base de cada participante informado diretamente no cadastro/plano
    state.pessoas.forEach(p => {
      const valorBase = Number(p.valorAtual ?? p.valorInicial ?? 0);
      pPorPessoa[p.id] = valorBase;
    });

    if (state.pessoas.length === 1 && (!pPorPessoa[state.pessoas[0].id] || pPorPessoa[state.pessoas[0].id] === 0) && Number(state.objetivo?.valorJaGuardado || 0) > 0) {
      pPorPessoa[state.pessoas[0].id] = Number(state.objetivo?.valorJaGuardado || 0);
    }

    const somaPessoasGuardado = state.pessoas.reduce(
      (acc, p) => acc + Number(pPorPessoa[p.id] || 0),
      0
    );
    if (somaPessoasGuardado > 0) {
      pAtual = Math.max(pAtual, somaPessoasGuardado);
    }

    let rowMesAtual: any = null;

    // Sincroniza com a evolução diária do mês em andamento para refletir exatamente o saldo do dia atual (ex: dia 16).
    // IMPORTANTE: detalhesMensais[0] é sempre o Mês 0 ("Início", marco zero sem aportes regulares).
    // Os meses em andamento de acumulação e aportes são sempre meses de evolução com mes >= 1.
    const mesesEvolucao = (simulacaoData?.detalhesMensais || []).filter((r: any) => r.mes > 0);

    if (mesesEvolucao.length > 0) {
      // 1. Tenta localizar pelo mês do calendário oficial de Brasília (evita divergência de fuso horário)
      rowMesAtual = mesesEvolucao.find((r: any) => {
        if (!r.dataReferencia) return false;
        const match = String(r.dataReferencia).match(/^(\d{4})-(\d{2})/);
        if (match) {
          const refAno = parseInt(match[1], 10);
          const refMes = parseInt(match[2], 10);
          return refAno === hojeAno && refMes === hojeMes;
        }
        return false;
      });

      // 2. Se não casar por calendário, verifica se hoje é antes do primeiro mês ou seleciona o mês em andamento
      if (!rowMesAtual) {
        const primeiroMes = mesesEvolucao[0];
        const matchPrim = String(primeiroMes?.dataReferencia || "").match(/^(\d{4})-(\d{2})/);
        let antesDoInicio = false;
        if (matchPrim) {
          const pAno = parseInt(matchPrim[1], 10);
          const pMes = parseInt(matchPrim[2], 10);
          if (hojeAno < pAno || (hojeAno === pAno && hojeMes < pMes)) {
            antesDoInicio = true;
          }
        }

        if (!antesDoInicio) {
          if (state.mesesConcluidos.length === 0) {
            rowMesAtual = mesesEvolucao[0];
          } else {
            const proxMes = Math.max(...state.mesesConcluidos) + 1;
            rowMesAtual = mesesEvolucao.find((r: any) => r.mes === proxMes) || mesesEvolucao[mesesEvolucao.length - 1];
          }
        }
      }
    }

    if (rowMesAtual) {
      const prevRow = simulacaoData?.detalhesMensais?.find((x: any) => x.mes === rowMesAtual.mes - 1);
      const saldoInicialMes = (prevRow && Number(prevRow.totalAcumulado) > 0)
        ? Number(prevRow.totalAcumulado)
        : (Number(simulacaoData?.valorJaGuardado || state.objetivo?.valorJaGuardado || somaPessoasGuardado) || 0);

      const prevParts = prevRow?.participantes || [];
      const saldosIniciaisPorPessoa: Record<string, number> = {};
      state.pessoas.forEach((p, idx) => {
        let prevPart = prevParts.find((part: any) => (part.participanteId || part.id) === p.id);
        if (!prevPart && p.nome) {
          prevPart = prevParts.find((part: any) => part.nome && part.nome.trim().toLowerCase() === p.nome.trim().toLowerCase());
        }
        if (!prevPart && prevParts.length === 1 && state.pessoas.length === 1) {
          prevPart = prevParts[0];
        }
        if (!prevPart && prevParts[idx]) {
          prevPart = prevParts[idx];
        }

        const saldoPart = prevPart && Number(prevPart.saldo) > 0
          ? Number(prevPart.saldo)
          : Number(p.valorInicial ?? p.valorAtual ?? 0);
        saldosIniciaisPorPessoa[p.id] = saldoPart;
      });

      const rowExtras = (state.aportesExtras || []).filter(e => {
        if (!e?.data || !rowMesAtual.dataReferencia) return false;
        try {
          const extraMatch = String(e.data).match(/^(\d{4})-(\d{2})/);
          const rowMatch = String(rowMesAtual.dataReferencia).match(/^(\d{4})-(\d{2})/);
          if (extraMatch && rowMatch) {
            return extraMatch[1] === rowMatch[1] && extraMatch[2] === rowMatch[2];
          }
          return e.data.startsWith(rowMesAtual.dataReferencia.split("T")[0]);
        } catch {
          return false;
        }
      });

      const diaAporteConfig = state.diasDoAportePorMes?.[rowMesAtual.mes] ?? state.diaDoAporte ?? 5;

      const partRows = rowMesAtual.participantes || [];
      const aportesParticipantes = state.pessoas.map((p, idx) => {
        let partRow = partRows.find((part: any) => (part.participanteId || part.id) === p.id);
        if (!partRow && p.nome) {
          partRow = partRows.find((part: any) => part.nome && part.nome.trim().toLowerCase() === p.nome.trim().toLowerCase());
        }
        if (!partRow && partRows.length === 1 && state.pessoas.length === 1) {
          partRow = partRows[0];
        }
        if (!partRow && partRows[idx]) {
          partRow = partRows[idx];
        }

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
        saldosIniciaisPorPessoa,
        aporteRegular: Number(rowMesAtual.aporteMensal || 0),
        diaAporteRegular: diaAporteConfig,
        aportesParticipantes,
        aportesExtras: rowExtras,
        taxaCdiAnual,
        tipoInvestimento,
      });

      // Seleciona o dia correspondente a hoje (ex: dia 16)
      const diaCorrespondente = evolucaoMes.dias.find(d => d.dia === diaHoje) || evolucaoMes.dias[evolucaoMes.dias.length - 1];

      if (diaCorrespondente && diaCorrespondente.saldoFinal > 0) {
        pAtual = diaCorrespondente.saldoFinal;

        if (diaCorrespondente.saldoPorPessoa) {
          state.pessoas.forEach(p => {
            if (diaCorrespondente.saldoPorPessoa && diaCorrespondente.saldoPorPessoa[p.id] !== undefined) {
              pPorPessoa[p.id] = Number(diaCorrespondente.saldoPorPessoa[p.id].toFixed(2));
            }
          });
        }
      }
    }

    // Se houver meses marcados manualmente como concluídos estritamente posteriores ao mês atual em andamento, prevalece o fechamento do último mês concluído
    if (state.mesesConcluidos.length > 0 && simulacaoData?.detalhesMensais) {
      const ultimoMes = Math.max(...state.mesesConcluidos);
      if (!rowMesAtual || ultimoMes >= rowMesAtual.mes) {
        const row = simulacaoData.detalhesMensais.find((r: any) => r.mes === ultimoMes);
        if (row && (!pAtual || row.totalAcumulado > pAtual)) {
          pAtual = row.totalAcumulado;
          (row.participantes || []).forEach((p: any) => {
            const pid = p.participanteId || p.id;
            if (pid) pPorPessoa[pid] = p.saldo;
          });
        }
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
