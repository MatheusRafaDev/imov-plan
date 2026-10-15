/**
 * Configurações e utilitários de SEO para o Imov.Plan.
 */

export function getBaseUrl(): string {
  // 1. Variável de ambiente configurada explicitamente
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  // 2. Produção Vercel
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // 3. Fallback seguro ou dev
  return process.env.NEXT_PUBLIC_APP_URL || "https://imovplan.com.br";
}

export const siteConfig = {
  name: "Imov.Plan",
  legalName: "Imov.Plan Tecnologia Financeira",
  title: "Imov.Plan - Planejador Financeiro para Entrada do Imóvel dos Sonhos",
  shortTitle: "Imov.Plan - Simulador de Entrada e Financiamento",
  description:
    "Simulador inteligente para planejar a compra do seu imóvel. Calcule quanto guardar por mês com rendimento no CDI, imposto regressivo, custos de ITBI, escritura e comparação SAC vs PRICE.",
  url: getBaseUrl(),
  ogImage: "/opengraph-image",
  keywords: [
    "planejamento imobiliário",
    "simulador de financiamento",
    "entrada de imóvel",
    "simulador entrada imóvel",
    "quanto guardar por mês para comprar imóvel",
    "comprar casa própria",
    "simulador CDI entrada imóvel",
    "tabela SAC ou PRICE",
    "custos extras ITBI e cartório",
    "composição de renda financiamento",
    "financiamento caixa",
    "simulador de amortização",
    "Imov.Plan",
  ],
  authors: [
    {
      name: "Imov.Plan",
      url: getBaseUrl(),
    },
  ],
  creator: "Imov.Plan",
  publisher: "Imov.Plan",
  themeColor: "#E8590C",
};

/**
 * Perguntas Frequentes estruturadas para o Schema.org (Google FAQ Rich Snippet).
 */
export const faqItems = [
  {
    question: "Quanto preciso guardar de entrada para comprar um imóvel?",
    answer:
      "A maioria dos bancos exige no mínimo 20% do valor do imóvel como entrada no Sistema Financeiro de Habitação (SFH). Além disso, é essencial prever entre 3% a 5% adicionais para custos de documentação como ITBI, registro em cartório e escritura pública.",
  },
  {
    question: "Como os juros do CDI aceleram a meta da entrada?",
    answer:
      "Ao investir o valor guardado mês a mês em ativos pós-fixados que rendem 100% do CDI com liquidez diária, os juros compostos e o imposto regressivo trabalham a seu favor, reduzindo o tempo de poupança em vários meses em relação a guardar dinheiro na poupança ou parado na conta.",
  },
  {
    question: "Qual a diferença entre financiamento pela tabela SAC e tabela PRICE?",
    answer:
      "Na tabela SAC (Sistema de Amortização Constante), as parcelas começam maiores e caem mês a mês, resultando em menor custo total de juros no final. Na tabela PRICE, as parcelas são fixas ao longo do contrato, exigindo menor renda inicial, porém com montante de juros total mais elevado.",
  },
  {
    question: "Posso incluir FGTS e 13º salário no planejamento do Imov.Plan?",
    answer:
      "Sim. No Imov.Plan você pode cadastrar aportes anuais programados, como saque-aniversário ou rescisão de FGTS, 13º salário, férias ou restituição do Imposto de Renda. O simulador recalcula instantaneamente o tempo restante até a meta.",
  },
  {
    question: "Como funciona a composição de renda familiar na simulação?",
    answer:
      "O Imov.Plan permite cadastrar múltiplos participantes no mesmo plano (cônjuge, parceiro ou familiares). O sistema une a renda mensal líquida, desconta os gastos individuais e calcula o aporte conjunto ideal para atingir a meta sem comprometer a estabilidade familiar.",
  },
];

/**
 * Gera o JSON-LD unificado (WebApplication + Organization + FAQPage).
 */
export function generateStructuredData() {
  const baseUrl = getBaseUrl();

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: siteConfig.name,
    alternateName: siteConfig.title,
    url: baseUrl,
    applicationCategory: "FinanceApplication",
    operatingSystem: "All",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    description: siteConfig.description,
    inLanguage: "pt-BR",
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "BRL",
    },
    creator: {
      "@type": "Organization",
      name: siteConfig.name,
      url: baseUrl,
      logo: `${baseUrl}/icon.svg`,
    },
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    url: baseUrl,
    logo: `${baseUrl}/icon.svg`,
    description: siteConfig.description,
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return [webAppSchema, organizationSchema, faqSchema];
}
