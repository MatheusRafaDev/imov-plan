# 📖 Documentação do Sistema Imov.Plan

A documentação técnica detalhada e completa da plataforma está localizada em:

👉 **[docs/DOCUMENTACAO_SISTEMA.md](docs/DOCUMENTACAO_SISTEMA.md)**

---

### Conteúdo Abordado:
1. **Visão Geral e Propósito** (Contexto e diferenciais frente a simuladores bancários tradicionais)
2. **Arquitetura Geral da Solução** (Diagrama Mermaid, fluxo de dados e integrações)
3. **Modelagem de Dados** (Diagrama ER, coleções MongoDB, BSON conventions e índices TTL)
4. **Backend (.NET 9 — Clean Architecture)** (Domain, Application, Infrastructure, API, Hosted Services)
5. **Frontend (Next.js 16 + React 19)** (App Router, Zustand, Virtualização `react-virtuoso`, Autosave)
6. **Motor de Cálculos e Regras Financeiras** (CDI líquido, IR regressivo, pro-rata mensal, SAC vs PRICE, CET, busca binária)
7. **Recursos Inteligentes** (Consultoria via Groq LLM com streaming SSE e Radar de Arredores via OpenStreetMap)
8. **Referência da API REST** (Tabela completa de endpoints, métodos e autorizações)
9. **Guia de Execução e Desenvolvimento** (Docker Compose, execução local, variáveis de ambiente e testes)
10. **Segurança e Resiliência** (Cookies HttpOnly, Rate Limiting, BCrypt, HSTS, fallbacks)
