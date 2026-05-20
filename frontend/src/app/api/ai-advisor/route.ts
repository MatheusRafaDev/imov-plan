import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === "mock-key") {
      // Simulate network delay
      await new Promise(r => setTimeout(r, 2000));
      return NextResponse.json({
        text: `### Análise do seu Perfil (Modo Simulação)

⚠️ *Aviso: Você ainda não configurou sua chave \`GROQ_API_KEY\` no arquivo \`.env\`. Esta é uma resposta padrão.*

Com base na renda total familiar informada, eis a sua projeção simulada:

**1. Enquadramento Minha Casa Minha Vida**
Se sua renda for menor que R$ 9.600,00, você se enquadra no programa. As taxas de juros serão muito menores que a média do mercado, e você poderá usar seu FGTS para abater o saldo devedor.

**2. Recomendação de Banco**
Sugerimos priorizar o financiamento pela **Caixa Econômica Federal**, que detém o monopólio operacional dos recursos do FGTS para o MCMV e oferece os maiores subsídios.

**3. Próximo Passo**
Sua meta principal agora deve ser manter as despesas controladas para atingir o valor exato da entrada no prazo que você definiu.

*Dica: Adicione sua chave \`GROQ_API_KEY\` no arquivo \`.env\` e reinicie o servidor para que nossa IA leia seus dados de renda e imóvel reais e escreva um laudo inteligente focado em você, usando os modelos ultrarrápidos da Groq!*`
      });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `
Você é um consultor financeiro especialista em financiamento imobiliário no Brasil (especialmente Minha Casa Minha Vida e Sistema SBPE).
Analise os dados financeiros do usuário abaixo e responda em Markdown (use títulos, listas e formatação elegante, NÃO USE HTML).

Regras do Minha Casa Minha Vida (MCMV) 2024 (Renda Bruta Familiar):
- Faixa 1: até R$ 3.200 (melhores subsídios e taxas).
- Faixa 2: de R$ 3.200,01 a R$ 5.000.
- Faixa 3: de R$ 5.000,01 a R$ 9.600.
- Acima de R$ 9.600: Não se enquadra no MCMV, deve usar o financiamento SBPE (qualquer banco), onde as taxas estão em torno de 10% a 12% ao ano.

Dados do usuário (JSON):
${JSON.stringify(data, null, 2)}

No seu laudo:
1. Dê uma saudação amigável.
2. Informe claramente em qual Faixa eles se enquadram (ou se vão para SBPE).
3. Resuma os benefícios esperados.
4. Dê um parecer profissional se o valor do imóvel desejado está coerente com a renda e a sobra mensal informada.

Seja direto, empático e extremamente profissional. Máximo de 4 ou 5 blocos curtos de texto/listas.
`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Você é um consultor inteligente financeiro." },
        { role: "user", content: prompt }
      ],
      model: "llama3-70b-8192",
      temperature: 0.5,
    });
    
    const text = completion.choices[0]?.message?.content || "";

    return NextResponse.json({ text });

  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json(
      { error: "Falha ao gerar consultoria da IA. Tente novamente." },
      { status: 500 }
    );
  }
}
