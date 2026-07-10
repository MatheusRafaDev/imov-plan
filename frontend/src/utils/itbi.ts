/**
 * Cálculo dinâmico de ITBI + Cartório por município.
 *
 * Fontes:
 * - SP: Lei Municipal 11.154/1991, atualizada em 2024 (isenção R$335k, SFH 0,5%, acima 3%)
 * - RJ: 3% (lei 2.185/94)
 * - DF: 3%, isenção até R$200k (1° imóvel MCMV)
 * - Demais: tabela de referência baseada na legislação vigente 2024/2025
 */

export type ITBIFaixa = "isento" | "reduzido" | "cheio";

export type CustoITBIResult = {
  itbi: number;
  cartorio: number;
  total: number;
  percentualTotal: number;
  isento: boolean;
  faixa: ITBIFaixa;
  aliquota: number; // % efetiva aplicada
  descricaoRegra: string;
};

type RegraITBI = {
  aliquota: number;            // % ITBI cheio
  aliquotaReduzida?: number;   // % ITBI reduzido (SFH/MCMV)
  limiteReduzido?: number;     // teto $ para aliquotaReduzida
  isencaoAte?: number;         // $ abaixo do qual ITBI = 0
  descricao: string;
};

// Mapa: "UF/Cidade" → regra. Chave "UF" serve como fallback para o estado inteiro.
const REGRAS_ITBI: Record<string, RegraITBI> = {
  // ── São Paulo ──
  "SP/São Paulo":              { aliquota: 3, aliquotaReduzida: 0.5, limiteReduzido: 1500000, isencaoAte: 335000, descricao: "ITBI SP: isento ≤ R$335k (1º imóvel/MCMV), 0,5% SFH, 3% acima" },
  "SP/Campinas":               { aliquota: 3, aliquotaReduzida: 0.5, limiteReduzido: 1500000, isencaoAte: 335000, descricao: "ITBI Campinas: mesmas regras estaduais SP" },
  "SP/Guarulhos":              { aliquota: 3, aliquotaReduzida: 0.5, limiteReduzido: 1500000, isencaoAte: 335000, descricao: "ITBI Guarulhos: mesmas regras estaduais SP" },
  "SP/São Bernardo do Campo":  { aliquota: 3, aliquotaReduzida: 0.5, limiteReduzido: 1500000, isencaoAte: 335000, descricao: "ITBI SBC: mesmas regras estaduais SP" },
  "SP/Santo André":            { aliquota: 3, aliquotaReduzida: 0.5, limiteReduzido: 1500000, isencaoAte: 335000, descricao: "ITBI Santo André: mesmas regras estaduais SP" },
  "SP":                        { aliquota: 3, aliquotaReduzida: 0.5, limiteReduzido: 1500000, isencaoAte: 335000, descricao: "ITBI SP (geral): isento ≤ R$335k, 0,5% SFH, 3% acima" },

  // ── Rio de Janeiro ──
  "RJ/Rio de Janeiro":         { aliquota: 3, descricao: "ITBI RJ: 3% sobre valor venal" },
  "RJ/Niterói":                { aliquota: 2, descricao: "ITBI Niterói: 2%" },
  "RJ/Petrópolis":             { aliquota: 2, descricao: "ITBI Petrópolis: 2%" },
  "RJ":                        { aliquota: 3, descricao: "ITBI RJ (geral): 3%" },

  // ── Minas Gerais ──
  "MG/Belo Horizonte":         { aliquota: 3, descricao: "ITBI BH: 3%" },
  "MG/Uberlândia":             { aliquota: 2, descricao: "ITBI Uberlândia: 2%" },
  "MG/Contagem":               { aliquota: 2, descricao: "ITBI Contagem: 2%" },
  "MG":                        { aliquota: 2, descricao: "ITBI MG (geral): 2%" },

  // ── Rio Grande do Sul ──
  "RS/Porto Alegre":           { aliquota: 3, descricao: "ITBI Porto Alegre: 3%" },
  "RS/Caxias do Sul":          { aliquota: 2, descricao: "ITBI Caxias do Sul: 2%" },
  "RS":                        { aliquota: 2, descricao: "ITBI RS (geral): 2%" },

  // ── Paraná ──
  "PR/Curitiba":               { aliquota: 2.7, descricao: "ITBI Curitiba: 2,7%" },
  "PR/Londrina":               { aliquota: 2, descricao: "ITBI Londrina: 2%" },
  "PR/Maringá":                { aliquota: 2, descricao: "ITBI Maringá: 2%" },
  "PR":                        { aliquota: 2, descricao: "ITBI PR (geral): 2%" },

  // ── Bahia ──
  "BA/Salvador":               { aliquota: 3, descricao: "ITBI Salvador: 3%" },
  "BA":                        { aliquota: 2, descricao: "ITBI BA (geral): 2%" },

  // ── Ceará ──
  "CE/Fortaleza":              { aliquota: 3, descricao: "ITBI Fortaleza: 3%" },
  "CE":                        { aliquota: 2, descricao: "ITBI CE (geral): 2%" },

  // ── Pernambuco ──
  "PE/Recife":                 { aliquota: 2, descricao: "ITBI Recife: 2%" },
  "PE":                        { aliquota: 2, descricao: "ITBI PE (geral): 2%" },

  // ── Distrito Federal ──
  "DF/Brasília":               { aliquota: 3, isencaoAte: 200000, descricao: "ITBI DF: 3%, isento ≤ R$200k (1º imóvel MCMV)" },
  "DF":                        { aliquota: 3, isencaoAte: 200000, descricao: "ITBI DF: 3%, isento ≤ R$200k (1º imóvel MCMV)" },

  // ── Goiás ──
  "GO/Goiânia":                { aliquota: 3, descricao: "ITBI Goiânia: 3%" },
  "GO":                        { aliquota: 2, descricao: "ITBI GO (geral): 2%" },

  // ── Amazonas ──
  "AM/Manaus":                 { aliquota: 2, descricao: "ITBI Manaus: 2%" },
  "AM":                        { aliquota: 2, descricao: "ITBI AM (geral): 2%" },

  // ── Santa Catarina ──
  "SC/Florianópolis":          { aliquota: 1, descricao: "ITBI Florianópolis: 1%" },
  "SC/Joinville":              { aliquota: 2, descricao: "ITBI Joinville: 2%" },
  "SC/Blumenau":               { aliquota: 2, descricao: "ITBI Blumenau: 2%" },
  "SC/Balneário Camboriú":     { aliquota: 2, descricao: "ITBI Balneário Camboriú: 2%" },
  "SC":                        { aliquota: 2, descricao: "ITBI SC (geral): 2%" },

  // ── Espírito Santo ──
  "ES/Vitória":                { aliquota: 2, descricao: "ITBI Vitória: 2%" },
  "ES/Vila Velha":             { aliquota: 2, descricao: "ITBI Vila Velha: 2%" },
  "ES":                        { aliquota: 2, descricao: "ITBI ES (geral): 2%" },

  // ── Maranhão ──
  "MA/São Luís":               { aliquota: 2, descricao: "ITBI São Luís: 2%" },
  "MA":                        { aliquota: 2, descricao: "ITBI MA (geral): 2%" },

  // ── Pará ──
  "PA/Belém":                  { aliquota: 2, descricao: "ITBI Belém: 2%" },
  "PA":                        { aliquota: 2, descricao: "ITBI PA (geral): 2%" },

  // Demais estados — default nacional
  "default":                   { aliquota: 2, descricao: "ITBI: 2% (estimativa geral)" },
};

/** Tabela nacional de cartório/registro escalonada por valor do imóvel. */
function calcularCartorio(valorImovel: number): number {
  if (valorImovel <= 100000)   return 1500;
  if (valorImovel <= 300000)   return valorImovel * 0.015;
  if (valorImovel <= 700000)   return valorImovel * 0.013;
  if (valorImovel <= 1500000)  return valorImovel * 0.011;
  return valorImovel * 0.009;
}

function resolverRegra(estado: string, cidade: string): RegraITBI {
  const chaveCompleta = cidade && cidade !== "Outra cidade" ? `${estado}/${cidade}` : null;
  if (chaveCompleta && REGRAS_ITBI[chaveCompleta]) return REGRAS_ITBI[chaveCompleta];
  if (REGRAS_ITBI[estado]) return REGRAS_ITBI[estado];
  return REGRAS_ITBI["default"];
}

export function calcularCustosITBI(
  valorImovel: number,
  estado = "SP",
  cidade = "São Paulo"
): CustoITBIResult {
  if (valorImovel <= 0) {
    return {
      itbi: 0, cartorio: 0, total: 0,
      percentualTotal: 0, isento: false,
      faixa: "cheio", aliquota: 0,
      descricaoRegra: "",
    };
  }

  const regra = resolverRegra(estado, cidade);
  let itbi = 0;
  let isento = false;
  let faixa: ITBIFaixa = "cheio";
  let aliquota = regra.aliquota;

  if (regra.isencaoAte && valorImovel <= regra.isencaoAte) {
    itbi = 0;
    isento = true;
    faixa = "isento";
    aliquota = 0;
  } else if (regra.aliquotaReduzida && regra.limiteReduzido && valorImovel <= regra.limiteReduzido) {
    itbi = valorImovel * (regra.aliquotaReduzida / 100);
    faixa = "reduzido";
    aliquota = regra.aliquotaReduzida;
  } else {
    itbi = valorImovel * (regra.aliquota / 100);
    faixa = "cheio";
    aliquota = regra.aliquota;
  }

  const cartorio = calcularCartorio(valorImovel);
  const totalBruto = itbi + cartorio;
  const capAbsoluto = valorImovel * 0.04;
  const total = Math.min(totalBruto, capAbsoluto);
  const percentualTotal = (total / valorImovel) * 100;

  return {
    itbi,
    cartorio,
    total,
    percentualTotal,
    isento,
    faixa,
    aliquota,
    descricaoRegra: regra.descricao,
  };
}
