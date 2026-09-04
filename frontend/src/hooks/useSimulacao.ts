import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SimulacaoService } from '@/services/SimulacaoService';

export function useUltimaSimulacao(planoId: string | null) {
  return useQuery({
    queryKey: ['simulacao', planoId],
    queryFn: async () => {
      if (!planoId) return null;
      return await SimulacaoService.getUltimaSimulacao(planoId);
    },
    enabled: !!planoId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

export function useCalcularSimulacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planoId, payload }: { planoId: string; payload: any }) => {
      const result = await SimulacaoService.calcularSimulacao(planoId, payload);
      return result;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['simulacao', variables.planoId], data);
    },
  });
}
