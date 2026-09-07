import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import Cookies from 'js-cookie';
import { usePlanStore } from '@/store/usePlanStore';

function obterIdUsuario(): string | null {
  const cookieUsuario = Cookies.get("user");
  if (!cookieUsuario) return null;
  try {
    return JSON.parse(cookieUsuario).id ?? null;
  } catch {
    return null;
  }
}

export function usePlanDraft(planoId: string | null) {
  const usuarioId = obterIdUsuario();
  const hydrate = usePlanStore((state) => state.hydrate);

  return useQuery({
    queryKey: ['planDraft', planoId || usuarioId],
    queryFn: async () => {
      let draftData = null;
      
      try {
        if (planoId) {
          const { data, status } = await api.get(`/plano/draft/${planoId}`);
          // 200 com dados: plano encontrado
          // 204 No Content: plano existe mas sem dados (tratado como null)
          if ((status === 200 || status === 204) && data) {
            draftData = data;
          }
        } else if (usuarioId) {
          const { data, status } = await api.get(`/plano/user/${usuarioId}`);
          // 200 com dados: draft encontrado para o usuário
          // 204 No Content: usuário autenticado mas ainda não tem plano
          if ((status === 200 || status === 204) && data) {
            draftData = data;
          }
        }
      } catch (error: any) {
        const status = error?.response?.status;
        // 404: plano/usuário não encontrado — usuário novo, tratar como "sem draft"
        // 403/401: problema de autorização — não criar dados, apenas retornar null
        // Qualquer outro erro (500, rede): também retornar null para não quebrar a UI
        if (status === 404 || status === 403 || status === 401) {
          return null;
        }
        // Erro inesperado: logar mas não propagar (não quebrar a UI)
        console.warn('[usePlanDraft] Erro ao carregar draft, continuando sem dados:', status || error?.message);
        return null;
      }

      if (draftData) {
        // Transform the backend draft data to fit the store (similar to aplicarDados)
        const mappedData = {
          objetivo: draftData.objetivo ? {
            nomePlano: draftData.objetivo.nomePlano,
            valorImovel: draftData.objetivo.valorImovel,
            percentualEntrada: draftData.objetivo.percentualEntrada,
            percentualCustosExtras: draftData.objetivo.percentualCustosExtras,
            valorJaGuardado: draftData.objetivo.valorJaGuardado,
            taxaCdiAnual: draftData.objetivo.taxaCdiAnual,
            percentualCdi: draftData.objetivo.percentualCdi,
            prazoMaxMeses: draftData.objetivo.prazoMaxMeses,
            dataInicio: draftData.objetivo.dataInicio ? new Date(draftData.objetivo.dataInicio) : new Date(),
            tipoInvestimento: draftData.objetivo.tipoInvestimento,
            estado: draftData.objetivo.estado || undefined,
            cidade: draftData.objetivo.cidade || undefined,
          } : undefined,
          pessoas: (draftData.pessoas || []).map((p: any) => ({
            id: p.id,
            nome: p.nome,
            renda_mensal: p.renda_mensal,
            renda_complementar: p.renda_complementar,
            gastos_mensais: p.gastos_mensais,
            usar_gastos_detalhados: p.usar_gastos_detalhados,
            gastos_detalhados: p.gastos_detalhados || [],
            aporte_mensal: p.aporte_mensal,
            valorInicial: p.valorInicial,
            tipoInvestimento: p.tipoInvestimento,
          })),
          bancoEscolhido: draftData.bancoEscolhido || null,
          aportesExtras: (draftData.aportesExtras || []).map((a: any) => ({
            ...a,
            data: a.data
              ? typeof a.data === "string"
                ? a.data
                : new Date(a.data).toISOString().slice(0, 10)
              : new Date().toISOString().slice(0, 10),
          })),
          aportesRegularesEditados: draftData.aportesRegularesEditados || {},
          aportesRegularesEditadosPorPessoa: draftData.aportesRegularesEditadosPorPessoa || {},
          mesesConcluidos: draftData.mesesConcluidos || [],
        };
        
        // Hydrate store
        hydrate(mappedData);

        if (draftData.id) {
          Cookies.set("imovplan_planoId", draftData.id, { expires: 30 });
        }
      }

      return draftData;
    },
    enabled: !!planoId || !!usuarioId,
    retry: false,       // Não repetir em caso de 404/403
    throwOnError: false, // Não marcar como isError — erros são tratados no queryFn
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveDraft() {
  const queryClient = useQueryClient();
  const usuarioId = obterIdUsuario();

  return useMutation({
    mutationFn: async ({ planoId, payload }: { planoId: string | null; payload: any }) => {
      if (planoId) {
        try {
          await api.put(`/plano/draft/${planoId}`, payload);
          return planoId;
        } catch (error: any) {
          const status = error?.response?.status;
          // 404: plano não existe mais no servidor (foi deletado ou cookie desatualizado)
          // Criar um novo plano via POST como fallback
          if (status === 404 && usuarioId) {
            console.warn('[useSaveDraft] Plano não encontrado (404), criando novo plano...');
            const { data } = await api.post(`/plano/draft-for-user?usuarioId=${usuarioId}`);
            if (data?.id) {
              await api.put(`/plano/draft/${data.id}`, payload);
              return data.id;
            }
            return null;
          }
          // Outros erros (401, 500, rede): propagar para o caller lidar
          throw error;
        }
      } else {
        if (!usuarioId) {
          return null; // Usuário não autenticado, não chamar a API
        }
        const { data } = await api.post(`/plano/draft-for-user?usuarioId=${usuarioId}`);
        if (data?.id) {
          await api.put(`/plano/draft/${data.id}`, payload);
          return data.id;
        }
        return null;
      }
    },
    onSuccess: (newPlanoId) => {
      if (newPlanoId) {
        Cookies.set("imovplan_planoId", newPlanoId, { expires: 30 });
      }
      queryClient.invalidateQueries({ queryKey: ['planDraft'] });
      queryClient.invalidateQueries({ queryKey: ['planos', usuarioId] });
    },
  });
}
