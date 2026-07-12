<div align="center">
  <h1>🏡 Imov.Plan</h1>
  <p><strong>A aplicação definitiva para o seu planejamento de aquisição imobiliária.</strong></p>
  
  ![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
  ![.NET](https://img.shields.io/badge/.NET_9-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
  ![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
  ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
</div>

<br />

O **Imov.Plan** é uma plataforma inovadora projetada para auxiliar futuros compradores na simulação, organização e execução de metas para a aquisição da casa própria. A ferramenta permite não apenas o cálculo preciso de financiamentos, mas o verdadeiro planejamento financeiro, combinando simulações reais (tabelas SAC e PRICE) e composições de renda, garantindo que o usuário compreenda exatamente sua capacidade de compra no longo prazo.

---

## ✨ Destaques e Funcionalidades

- 🔄 **Paridade de Cálculos Financeiros:** Motor de cálculo unificado entre o Frontend e o Backend. Garante que os números que o usuário vê (como amortizações e projeções de juros) sejam matematicamente exatos.
- 💾 **Gestão Contínua (Drafts e Sessões):** Ferramenta voltada para um planejamento em longo prazo. Pare a simulação onde quiser, e seus dados e evolução do plano estarão salvos em seu perfil.
- 👥 **Composição Avançada de Renda:** Capacidade de adicionar múltiplos participantes (cônjuges, familiares), customizando variáveis detalhadas de cada um (como bônus, saldos FGTS e 13º salário) para analisar como isso acelera a meta principal.
- 🎨 **Experiência de Usuário Elevada:** Design premium inspirado nos melhores produtos do mercado, focado em micro-interações, tipografia clara e fluidez.

---

## 🛠 Entendendo as Tecnologias

A stack escolhida para o **Imov.Plan** combina as linguagens e frameworks mais modernos do mercado visando confiabilidade, flexibilidade e performance extrema.

### 🌐 Frontend (O que o usuário vê)
Nossa interface de usuário foi concebida para ser interativa, resiliente e visualmente engajadora.
- **Next.js (App Router):** Utilizado pela sua robustez em roteamento, SSR (Renderização no Lado do Servidor) e capacidade extrema de indexação (SEO). A base do framework React mais forte atualmente.
- **Tailwind CSS:** Para a criação de uma UI elegante sem sair do HTML. Garante consistência de componentes, suportando temas avançados e classes utilitárias para um design *glassmorphism* contemporâneo.
- **Context API & React Hooks:** Faz a gestão de todo o estado dinâmico do simulador financeiro sem a necessidade de bibliotecas pesadas de terceiros (como Redux).
- **Zod & React Hook Form:** Juntos, oferecem validação síncrona nos formulários complexos da aplicação, provendo um "Type-Safety" ponta a ponta com TypeScript.

### ⚙️ Backend (A inteligência por trás)
Nosso servidor opera sob uma arquitetura de alta escala e com separação rigorosa de responsabilidades.
- **.NET 9 (C#):** Framework super escalável e performático escolhido pelo seu compilador otimizado (JIT/AOT), ideal para lidar com a alta carga de cálculos financeiros mensais.
- **Clean Architecture:** O projeto é segmentado em camadas independentes (Core, Domain, Infrastructure e Presentation). Essa arquitetura garante que regras de negócio vitais não se contaminem pelas tecnologias de persistência.
- **MongoDB:** Banco de dados NoSQL escolhido pela alta flexibilidade na manipulação das diferentes simulações. Documentos JSON facilitam o armazenamento de rascunhos inacabados (*drafts*) que são extremamente mutáveis pelas decisões do usuário.
- **Autenticação JWT:** Autenticação baseada em *Json Web Tokens*, encapsulados em *cookies HttpOnly*, oferecendo total segurança de sessão contra-ataques XSS na web.

---

<div align="center">
  <sub>Construído com ❤️ e focado em descomplicar a jornada do comprador de imóveis.</sub>
</div>