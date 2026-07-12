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

## 📖 Entendendo o Projeto em Detalhes

Comprar um imóvel é o maior passo financeiro na vida de muitas pessoas, e simuladores bancários tradicionais muitas vezes escondem taxas ou não mostram um plano de ação claro para os meses *antes* da compra. 

O **Imov.Plan** resolve isso quebrando toda a complexidade do planejamento financeiro imobiliário em um fluxo simples, seguro e transparente. Abaixo detalhamos como o ecossistema do produto funciona de ponta a ponta:

### 1. O Problema que Resolvemos
A maioria dos usuários não sabe quanto precisa guardar mensalmente para dar a entrada em um imóvel, nem como juros compostos ou aportes extras (FGTS, 13º salário) podem diminuir o tempo de espera. Nossa aplicação não só diz "se você tem saldo para financiar", mas atua como um **roteiro mensal** mostrando exatamente quanto guardar e onde seu dinheiro vai parar, tudo isso *cross-platform* e salvo na nuvem.

### 2. O Fluxo Principal (Core Business)
A plataforma é baseada no que chamamos de **Jornada de Planejamento**, separada nas seguintes etapas lógicas:

- **Etapa 1: O Imóvel e a Meta** 
  O usuário define o valor do imóvel dos sonhos, o prazo máximo que quer atingir a meta, a porcentagem que precisa dar de entrada (e se há custos extras de documentação). O sistema já define aqui um teto financeiro a ser alcançado.
  
- **Etapa 2: O Perfil e Composição Familiar** 
  O usuário detalha sua própria renda (salário líquido, vale refeição, despesas essenciais). **O grande diferencial** é que a plataforma permite adicionar múltiplos "Participantes" na simulação. Por exemplo: O cônjuge ou um familiar. Cada participante possui seus próprios gastos, salários e reserva inicial (dinheiro já guardado), criando uma "Renda Familiar" unificada que fortalece a capacidade de crédito.

- **Etapa 3: Planejamento (Aportes Extras)**
  Nesta fase entra o superpoder da ferramenta. O usuário mapeia eventos anuais — como saque do FGTS, recebimento de 13º, férias, restituição de IR ou venda de um carro. O Imov.Plan espalha esses eventos numa linha do tempo para mostrar de forma exata como essas injeções financeiras anteciparão a meta, recalculando dinamicamente o tempo estimado.

- **Etapa 4: O Resultado e o Raio-X do Plano**
  Aqui, o sistema entrega um sumário visual detalhado utilizando nosso motor de cálculo de alta precisão. O usuário ganha acesso a:
  - Comparativos entre Tabela **SAC** (Amortização Constante) e **PRICE** (Prestações Fixas).
  - Tabela completa de **Evolução Mês a Mês** mostrando seu capital acumulando e rendendo juros.
  - Alertas automáticos informando se a meta é irreal com base no tempo e renda configurada.

---

## ✨ Destaques Técnicos do Produto

- 🔄 **Paridade de Cálculos Financeiros (Front & Back):** Motor de cálculo construído duplamente (TypeScript para responsividade instantânea na tela, e C# no backend para segurança e persistência). Garante que não ocorram arredondamentos desleais e que a projeção obedeça normas bancárias reais.
- 💾 **Gestão Contínua (Drafts e Sessões Automáticas):** Ninguém planeja uma casa em 5 minutos. Por isso, a ferramenta funciona em sessões contínuas ("Drafts"). Conforme o usuário edita gastos ou altera o valor do imóvel, o *estado* viaja de maneira silenciosa para o servidor e é persistido via MongoDB, permitindo continuar no celular a simulação que começou no PC.
- 🎨 **Experiência de Usuário (UX) Elevada:** Design premium inspirado nos melhores produtos financeiros (Fintechs). Foco absoluto em *glassmorphism*, micro-interações, tipografia agradável e feedback visual transparente.

---

## 🛠 Entendendo as Tecnologias (Stack)

A arquitetura do **Imov.Plan** foi construída visando confiabilidade extrema em cálculos e uma interface ultrarrápida.

### 🌐 Frontend (A Interface)
- **Next.js (React com App Router):** Base da aplicação, fornecendo rotas seguras e extrema performance via carregamento inteligente e renderização assíncrona.
- **Tailwind CSS:** Utilizado para a estilização unificada e elegante. É ele que possibilita criar a interface de "fintech premium" de maneira rápida, utilizando padrões estéticos contemporâneos e totalmente responsivos.
- **Context API & Hooks Persistentes:** O estado complexo (com dezenas de variáveis como taxas, saldos e históricos) é mantido em memória via Providers otimizados (`PlanContext`), limitando o uso de bibliotecas de terceiros excessivas.
- **Zod + React Hook Form:** Juntos, oferecem uma malha fina de segurança no lado do cliente. Se o usuário esquecer um zero num rendimento ou inserir um CPF incorreto, essas libs interceptam o dado antes mesmo que a rede seja ativada (Type-Safety robusto).

### ⚙️ Backend (O Motor e a Lógica Central)
- **.NET 9 (C#):** Coração da aplicação. A escolha pela nova geração do ASP.NET Core se justifica pela velocidade absurda da sua runtime em lidar com processamento paralelo e equações matemáticas severas exigidas pelas simulações de financiamento iterativas.
- **Clean Architecture (Domain-Driven Design):** Todo o projeto segue a separação estrita em camadas (Domain, Application, Infrastructure, Presentation). Assim, a fórmula matemática sagrada do financiamento (Domain) nunca é afetada por uma mudança de banco de dados ou formato de API.
- **MongoDB:** Banco de dados NoSQL ideal para essa aplicação. Como cada "simulação imobiliária" do usuário (com participantes dinâmicos, aportes irregulares e históricos mutáveis) gera um objeto muito vasto e flexível, documentos JSON nativos escalam com muito mais elegância do que tabelas SQL engessadas.
- **Autenticação JWT & HttpOnly Cookies:** Acesso protegido por criptografia de ponta a ponta. Os tokens de acesso não ficam visíveis no navegador do usuário, protegendo a aplicação contra vetores de ataque comuns como o XSS.

---

<div align="center">
  <sub>Construído com ❤️ e focado em descomplicar a jornada do comprador de imóveis.</sub>
</div>