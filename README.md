<div align="center">
  <h1>🏡 Imov.Plan</h1>
  <p><strong>A aplicação definitiva para o seu planejamento de aquisição imobiliária.</strong></p>
  
  ![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
  ![.NET](https://img.shields.io/badge/.NET_9-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
  ![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
  ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
</div>

<br />

O **Imov.Plan** é uma plataforma inovadora que ajuda você a simular financiamentos (SAC e PRICE), organizar metas de aquisição de imóveis e obter uma avaliação inteligente (IA) baseada nas regras de mercado e no programa Minha Casa Minha Vida (MCMV) para entender sua capacidade real de compra.

---

## ✨ Destaques e Funcionalidades

- 🧠 **Consultoria Inteligente com IA:** Integração nativa com o **Llama 3.3 70B** via API da Groq para análise automática e customizada do seu perfil financeiro em tempo real (Streaming SSE).
- 🔄 **Paridade de Cálculos (Front & Back):** Motor de cálculo financeiro robusto construído em TypeScript e C#, garantindo total precisão (Amortizações SAC, PRICE, correções e juros).
- 💾 **Sessões e Drafts:** Pare de simular quando quiser e continue depois. Tudo fica salvo automaticamente.
- 👥 **Composição de Renda:** Adicione cônjuges e parentes, inclua variáveis como FGTS e Décimo Terceiro, e o simulador ajustará automaticamente sua capacidade de crédito.
- 🎨 **Design Premium:** Interface moderna, limpa e altamente responsiva construída com Tailwind CSS. Micro-interações e *glassmorphism* oferecem uma experiência única.

---

## 🛠 Tecnologias e Arquitetura

O Imov.Plan adota uma estrutura de microserviços/monorepo dividida em duas camadas principais:

### 🌐 Frontend (Next.js)
- **Framework:** Next.js (React) com App Router
- **Estilização:** TailwindCSS (Focado em UI Premium)
- **Estado Global:** Context API (`PlanContext`, `AuthContext`)
- **Comunicação:** Axios e Fetch API nativo para *Server-Sent Events (SSE)* da IA.
- **Formulários:** React Hook Form integrado com Zod.

### ⚙️ Backend (.NET 9)
- **Linguagem/Framework:** C# / ASP.NET Core 9
- **Arquitetura:** Clean Architecture (Core, Domain, Infrastructure, Presentation)
- **Banco de Dados:** MongoDB via driver oficial C#
- **Integração de IA:** `GroqAiService` atuando como wrapper para LLMs (Llama 3.3) fornecendo aconselhamento de crédito imobiliário.
- **Autenticação:** JWT (Json Web Tokens) com *cookies HttpOnly*.

---

## 🚀 Como Rodar Localmente

Siga o passo a passo abaixo para rodar toda a stack no seu ambiente local.

### 📌 Pré-requisitos
- [Node.js](https://nodejs.org/en/) (v18+)
- [.NET 9 SDK](https://dotnet.microsoft.com/)
- [MongoDB](https://www.mongodb.com/) (Instância local ou Atlas)

### 1️⃣ Configurando o Backend
1. Navegue até o diretório do backend:
   ```bash
   cd backend/Presentation/ImovPlan.API
   ```
2. Crie ou edite o arquivo `.env` na raiz da pasta `backend/` e adicione suas credenciais:
   ```env
   # Exemplo de .env
   Jwt:Key=SuaChaveSuperSecretaDe32CaracteresAqui
   MongoDbSettings:ConnectionString=mongodb://localhost:27017
   MongoDbSettings:DatabaseName=ImovPlanDB
   Groq:ApiKey=gsk_sua_chave_groq_aqui
   ```
3. Restaure as dependências e inicie:
   ```bash
   dotnet restore
   dotnet run
   ```
   *A API estará disponível por padrão em `http://localhost:5179`.*

### 2️⃣ Configurando o Frontend
1. Navegue até o diretório do frontend:
   ```bash
   cd frontend
   ```
2. Edite o arquivo `.env.local` na pasta `frontend/`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5179/api
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
3. Instale as dependências e inicie o ambiente de desenvolvimento:
   ```bash
   npm install
   npm run dev
   ```
   *A interface estará acessível em `http://localhost:3000`.*

---

## 🧪 Testes de Paridade (Garantia de Qualidade)

Para ter certeza de que simulações feitas instantaneamente no lado do cliente (React) baterão centavo por centavo com a persistência no backend (C#), criamos uma rotina de teste de paridade.

1. Se você alterar a regra de juros em `frontend/src/lib/finance.ts`, rode o gerador de casos:
   ```bash
   cd frontend
   npx tsx scripts/gerar-casos-paridade.ts
   ```
2. Após o gerador atualizar os casos, vá para a pasta de testes no backend e verifique:
   ```bash
   cd backend
   dotnet test
   ```

---

<div align="center">
  <sub>Construído com ❤️ e focado na jornada do comprador de imóveis.</sub>
</div>