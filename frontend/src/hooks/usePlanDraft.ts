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
      
      if (planoId) {
        const { data, status } = await api.get(`/plano/draft/${planoId}`);
        if (status === 200 && data) {
          draftData = data;
        }
      } else if (usuarioId) {
        const { data, status } = await api.get(`/plano/user/${usuarioId}`);
        if (status === 200 && data) {
          draftData = data;
        }
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
    retry: false, // Don't retry 404s
  });
}

export function useSaveDraft() {
  const queryClient = useQueryClient();
  const usuarioId = obterIdUsuario();

  return useMutation({
    mutationFn: async ({ planoId, payload }: { planoId: string | null; payload: any }) => {
      if (planoId) {
        await api.put(`/plano/draft/${planoId}`, payload);
        return planoId;
      } else {
        const { data } = await api.post(`/plano/draft-for-user?usuarioId=${usuarioId}`, payload);
        return data.id;
      }
    },
    onSuccess: (newPlanoId, variables) => {
      if (newPlanoId) {
        Cookies.set("imovplan_planoId", newPlanoId, { expires: 30 });
      }
      queryClient.invalidateQueries({ queryKey: ['planDraft'] });
      queryClient.invalidateQueries({ queryKey: ['planos', usuarioId] });
    },
  });
}
