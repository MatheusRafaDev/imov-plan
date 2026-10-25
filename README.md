<div align="center">

# 🏡 Imov.Plan

### Planejamento Inteligente e Simulação Completa para Aquisição Imobiliária

[![Next.js 16](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![.NET 9](https://img.shields.io/badge/.NET-9.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

<p align="center">
  <a href="#-sobre-o-projeto">Sobre</a> •
  <a href="#-principais-funcionalidades">Funcionalidades</a> •
  <a href="#-arquitetura-e-estrutura">Arquitetura</a> •
  <a href="#-stack-tecnológica">Stack</a> •
  <a href="docs/DOCUMENTACAO_SISTEMA.md">📖 Documentação Técnica</a> •
  <a href="#-licença">Licença</a>
</p>

</div>

---

## 📌 Sobre o Projeto

A aquisição da casa própria é uma das decisões financeiras mais relevantes na vida de uma família. No entanto, a maioria dos simuladores bancários tradicionais atua de forma isolada: calculam apenas parcelas teóricas sem considerar o tempo real de preparação, as despesas cartorárias (ITBI, registro), a capacidade de poupança mensal e a dinâmica familiar.

O **Imov.Plan** foi concebido para preencher essa lacuna. Trata-se de uma plataforma financeira completa e moderna que orienta o comprador desde a fase de acumulação de capital (pré-compra) até a contratação e quitação do financiamento imobiliário.

Com projeção precisa de rendimento sobre os aportes (CDI com IR regressivo), planejamento de custos cartorários (ITBI e registro) e integração de múltiplos participantes, o Imov.Plan transforma uma meta complexa em um plano de ação claro, viável e transparente.

---

## 🚀 Principais Funcionalidades

### 1. 📊 Planejamento de Entrada e Metas
- **Cálculo da Meta de Entrada**: definição do valor necessário para viabilizar a compra do imóvel dos sonhos.
- **Custos Acessórios Embutidos**: cálculo automático de despesas documentais, ITBI e emolumentos de cartório.
- **Rendimento Real com CDI**: projeção do crescimento patrimonial considerando rentabilidade da reserva financeira e alíquota de imposto de renda regressivo.

### 2. 👥 Composição Familiar de Renda
- Suporte a múltiplos participantes (cônjuge, familiares, sócios).
- Gestão individualizada de receitas líquidas, benefícios (VR/VA) e despesas essenciais.
- Verificação automática da margem de comprometimento de renda (limite prudencial de 30% da renda bruta familiar).

### 3. 🏗️ Imóvel Pronto vs. Imóvel na Planta
- **Imóvel Pronto**: foco na poupança acelerada para a entrada mínima, planejamento de reserva de emergência e simulação bancária imediata.
- **Imóvel na Planta**: cronograma de parcelas durante a construção, parcelas intermediárias/balões, fluxo de chaves e projeção de correção monetária pelo **INCC** (Índice Nacional de Custo da Construção).

### 4. ⏳ Linha do Tempo e Aportes Extraordinários
- Projeção de evolução patrimonial mês a mês com juros compostos da reserva financeira.
- Mapeamento de injeções extras: FGTS, 13º salário, bonificações, restituição de Imposto de Renda e venda de bens.
- Recálculo dinâmico do tempo necessário para atingir o valor de entrada ideal.

### 5. 🗺️ Análise de Localização e Arredores
- Avaliação de infraestrutura no entorno do imóvel (escolas, hospitais, transporte e comércio) para apoiar a decisão de compra.

### 6. 💾 Persistência em Tempo Real & Autosave
- Gestão contínua em formato de **Drafts**: o progresso é salvo automaticamente a cada alteração, permitindo alternar de dispositivo sem perda de contexto.
- Gerenciamento de múltiplos planos comparativos na conta do usuário.

### 7. 🔐 Segurança e Autenticação
- Autenticação via **JWT** e **Refresh Tokens** persistidos em cookies `HttpOnly` com proteção contra ataques XSS e CSRF.
- Suporte a login social via **Google OAuth 2.0**.
- Confirmação de e-mail e recuperação de senha seguras.

---

## 🏛 Arquitetura e Estrutura

O ecossistema é dividido em duas aplicações principais desacopladas:

```
imov-plan/
├── backend/                        # API REST em .NET 9 (C#)
│   ├── Core/
│   │   ├── ImovPlan.Domain/        # Entidades, Enums e Regras de Negócio Puras
│   │   └── ImovPlan.Application/   # Casos de Uso, DTOs, Serviços e Validadores
│   ├── Infrastructure/
│   │   └── ImovPlan.Infrastructure/# Persistência MongoDB e Notificações
│   ├── Presentation/
│   │   └── ImovPlan.API/           # Controllers, Middlewares, Filtros e Swagger
│   ├── Tests/
│   │   └── ImovPlan.Application.Tests/ # Testes Unitários de Regras e Cálculos
│   ├── Dockerfile
│   └── Dockerfile.vercel
│
├── frontend/                       # Aplicação Web em Next.js 16 (App Router)
│   ├── src/
│   │   ├── app/                    # Rotas (onboarding, pessoas, planejamento, resultado, etc.)
│   │   ├── components/             # Componentes de UI modulares e acessíveis
│   │   ├── contexts/               # Providers e Context API para estado de simulação
│   │   ├── hooks/                  # Custom hooks para cálculos e consumo de API
│   │   ├── lib/                    # Configurações de API, Axios e utilitários
│   │   └── types/                  # Definições de tipagem TypeScript
│   ├── tests/                      # Testes automatizados com Vitest
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml              # Orquestração local dos containers
└── README.md
```

---

## 🛠 Stack Tecnológica

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server & Client Components)
- **Biblioteca Principal**: [React 19](https://react.dev/)
- **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Gerenciamento de Estado**: [Zustand](https://zustand-demo.pmnd.rs/) & React Context API
- **Data Fetching / Cache**: [TanStack React Query v5](https://tanstack.com/query/latest)
- **Visualização de Dados**: [Recharts](https://recharts.org/)
- **Componentes & Ícones**: [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/), [Sonner](https://sonner.emilkowal.ski/)
- **Formulários & Validação**: React Hook Form & Zod

### Backend
- **Runtime / Framework**: [.NET 9](https://dotnet.microsoft.com/) / ASP.NET Core Web API
- **Arquitetura**: Clean Architecture / Domain-Driven Design (DDD)
- **Persistência**: [MongoDB](https://www.mongodb.com/) (Driver Oficial C#)
- **Segurança**: ASP.NET Core Authentication com JWT & Google OAuth
- **Comunicação por E-mail**: Brevo / Resend
- **Documentação de API**: Swagger / OpenAPI

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE). Consulte o arquivo de licença para mais detalhes.

<div align="center">
  <sub>Desenvolvido com foco em capacitar e descomplicar a jornada de aquisição imobiliária.</sub>
</div>