export type CenarioCompra = "entrada" | "pronto" | "planta";

export type GastoDetalhado = {
  id: string;
  nome: string;
  valor: number;
};

export type Banco = {
  id: string;
  nome: string;
  taxa: number;
};

export type Pessoa = {
  id: string;
  nome: string;
  renda_mensal: number;
  renda_complementar: number;
  gastos_mensais: number;
  gastos_detalhados?: GastoDetalhado[];
  usar_gastos_detalhados?: boolean;
  aporte_mensal: number;
  valorInicial?: number;
  tipoInvestimento?: string;
};

export type PlanoResumo = {
  id: string;
  nomePlano: string;
  valorImovel: number;
  percentualEntrada: number;
  prazoMaxMeses: number | null;
  estado?: string;
  cidade?: string;
  status: string;
  createdAt: string;
};

export type PlanoDraftPayload = {
  usuarioId?: string;
  objetivo: {
    valorImovel: number;
    percentualEntrada: number;
    percentualCustosExtras: number;
    valorJaGuardado: number;
    taxaCdiAnual: number;
    percentualCdi: number;
    prazoMaxMeses: number;
    dataInicio: string | null;
    nomePlano: string;
    tipoInvestimento: string;
    estado?: string;
    cidade?: string;
  } | null;
  pessoas: Pessoa[];
  bancoEscolhido: Banco | null;
  aportesExtras: import('@/lib/finance').Aporte[];
  aportesRegularesEditados: Record<number, number>;
  aportesRegularesEditadosPorPessoa: Record<string, Record<number, number>>;
  mesesConcluidos: number[];
};
