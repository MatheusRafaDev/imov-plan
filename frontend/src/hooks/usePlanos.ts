import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import Cookies from 'js-cookie';
import type { PlanoResumo } from '@/context/PlanContext';

function obterIdUsuario(): string | null {
  const cookieUsuario = Cookies.get("user");
  if (!cookieUsuario) return null;
  try {
    return JSON.parse(cookieUsuario).id ?? null;
  } catch {
    return null;
  }
}

export function usePlanos() {
  const usuarioId = obterIdUsuario();
  return useQuery({
    queryKey: ['planos', usuarioId],
    queryFn: async () => {
      if (!usuarioId) return [];
      const { data } = await api.get<PlanoResumo[]>(`/plano/user/${usuarioId}/todos`);
      return data;
    },
    enabled: !!usuarioId,
  });
}

export function useCriarPlano() {
  const queryClient = useQueryClient();
  const usuarioId = obterIdUsuario();

  return useMutation({
    mutationFn: async () => {
      if (!usuarioId) throw new Error("Usuário não autenticado");
      const { data } = await api.post(`/plano/user/${usuarioId}/novo`);
      return data.id as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planos', usuarioId] });
    },
  });
}

export function useExcluirPlano() {
  const queryClient = useQueryClient();
  const usuarioId = obterIdUsuario();

  return useMutation({
    mutationFn: async (planoId: string) => {
      await api.delete(`/plano/${planoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planos', usuarioId] });
    },
  });
}

export function useRenomearPlano() {
  const queryClient = useQueryClient();
  const usuarioId = obterIdUsuario();

  return useMutation({
    mutationFn: async ({ planoId, novoNome }: { planoId: string; novoNome: string }) => {
      await api.patch(`/plano/${planoId}/nome`, JSON.stringify(novoNome), {
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onMutate: async ({ planoId, novoNome }) => {
      await queryClient.cancelQueries({ queryKey: ['planos', usuarioId] });
      const previousPlanos = queryClient.getQueryData<PlanoResumo[]>(['planos', usuarioId]);

      if (previousPlanos) {
        queryClient.setQueryData<PlanoResumo[]>(['planos', usuarioId], (old) => 
          old?.map(plano => plano.id === planoId ? { ...plano, nomePlano: novoNome } : plano)
        );
      }

      return { previousPlanos };
    },
    onError: (err, variables, context) => {
      if (context?.previousPlanos) {
        queryClient.setQueryData(['planos', usuarioId], context.previousPlanos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['planos', usuarioId] });
    },
  });
}
