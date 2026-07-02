# Imov.Plan

Imov.Plan é uma aplicação completa de planejamento imobiliário que ajuda usuários a simular financiamentos, organizar metas de aquisição de imóveis e entender melhor sua capacidade financeira. 

## 🛠 Tecnologias

O projeto é dividido em duas partes principais:

### Frontend
- **Framework:** Next.js (React)
- **Estilização:** CSS / TailwindCSS (Visual Premium)
- **Gerenciamento de Estado:** Context API
- **Validação de Formulários:** Zod / React Hook Form
- **Feedback Visual:** Componentes responsivos e com micro-interações para melhor UX.

### Backend
- **Plataforma:** .NET (C#)
- **Banco de Dados:** MongoDB
- **Arquitetura:** Clean Architecture (Domain, Application, Infrastructure, Presentation)
- **Autenticação:** JWT

## 🚀 Funcionalidades

- **Autenticação de Usuários:** Registro e Login seguros com validação em tempo real e feedback visual amigável.
- **Perfil Financeiro (Onboarding):** Coleta de dados como Renda Mensal, Regime de Trabalho, Estado Civil e Saldo FGTS, salvos diretamente no banco de dados.
- **Simulador de Financiamento:**
  - Inclusão de participantes na composição de renda (sincronizado automaticamente com os dados do usuário logado).
  - Análise detalhada de capacidade de compra.
  - Resultados interativos e informativos.
- **Gestão de Sessões/Drafts:** Suporte para continuar simulações anteriores (via `PlanContext` e DTOs de Draft no backend).

## 📂 Estrutura do Projeto

```bash
imov-plan/
├── backend/            # API em .NET
│   ├── Core/           # Domain & Application (Regras de negócio e DTOs)
│   ├── Infrastructure/ # Repositórios e conexão com MongoDB
│   └── Presentation/   # Controladores da API (ex: UsuarioController)
└── frontend/           # Interface em Next.js
    └── src/
        ├── app/        # Páginas da aplicação (auth, onboarding, dashboard, etc.)
        ├── components/ # Componentes reutilizáveis
        ├── context/    # Contextos globais (AuthContext, PlanContext)
        └── services/   # Integrações com a API (ex: UsuarioService)
```

## ⚙️ Como Executar

### Pré-requisitos
- Node.js (para o frontend)
- .NET SDK (para o backend)
- Instância do MongoDB rodando (local ou na nuvem)

### Rodando o Backend
1. Navegue até a pasta da API: `cd backend/Presentation/ImovPlan.API`
2. Restaure as dependências: `dotnet restore`
3. Inicie o servidor: `dotnet run`
> *Nota: O backend roda por padrão na porta `5179`.*

### Rodando o Frontend
1. Navegue até a pasta do frontend: `cd frontend`
2. Instale as dependências: `npm install`
3. Inicie o servidor de desenvolvimento: `npm run dev`
> *Nota: O frontend roda por padrão na porta `3000`.*

## 🧪 Testes e Paridade

O projeto contém testes automatizados para garantir a estabilidade e a paridade de cálculos financeiros entre o Frontend (TypeScript) e o Backend (C#).

Para garantir que a fórmula de simulação seja a mesma em ambos os lados:
1. Ao alterar qualquer regra em `frontend/src/lib/finance.ts`, gere novamente os cenários de paridade executando: `npx tsx scripts/gerar-casos-paridade.ts` dentro da pasta `frontend/`.
2. Em seguida, rode os testes do backend para garantir que as mudanças em C# refletem os mesmos resultados: `dotnet test` na pasta do backend.

## 📌 Melhorias Recentes

- **Experiência de Erro Aprimorada:** Substituição de toasts intrusivos por banners amigáveis e bordas vermelhas (`border-destructive`) para melhor orientação do usuário.
- **Onboarding Financeiro:** Novo fluxo persistente pós-registro para captura de dados complementares (FGTS, salário) integrando diretamente com o MongoDB.
- **Sincronização:** Participantes do plano imobiliário são inicializados de forma automática com o perfil do usuário recém cadastrado.

---
Desenvolvido com foco na melhor experiência de planejamento financeiro para aquisição de imóveis.