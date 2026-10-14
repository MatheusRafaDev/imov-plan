# Deploy do backend na Vercel

O backend e publicado como um container OCI. O arquivo `Dockerfile.vercel` ja e
detectado pela Vercel e inicia o ASP.NET Core na porta definida pela plataforma
(`PORT`, com padrao `80`).

## Configuracao do projeto

Ao importar o repositorio inteiro para o projeto da API, a Vercel detecta o
`Dockerfile.vercel` da raiz e usa o backend automaticamente. Nao defina o
Framework Preset como Next.js: selecione **Container** ou deixe a deteccao
automatica ativa.

Como alternativa, e possivel definir **Root Directory** como `backend`; nesse
caso, a Vercel usara `backend/Dockerfile.vercel`. Nao e necessario expor uma
porta manualmente.

Cadastre as variaveis abaixo nos ambientes necessarios (Preview e Production):

| Variavel | Necessaria | Observacao |
| --- | --- | --- |
| `JWT_SECRET` | Sim | Pelo menos 32 bytes; use um valor aleatorio e secreto. |
| `MONGO_CONNECTION_STRING` | Sim | String de conexao do MongoDB Atlas. |
| `MONGO_DATABASE_NAME` | Sim | Nome do banco da aplicacao. |
| `CORS_ALLOWED_ORIGINS` | Sim | URL do frontend, sem barra final. Multiplas URLs sao separadas por virgula. |
| `FRONTEND_URL` | Sim | URL publica do frontend usada nos links de autenticacao. |
| `GOOGLE_CLIENT_ID` | Se houver login Google | Client ID OAuth aprovado para a URL do frontend. |
| `GROQ_API_KEY`, `BREVO_API_KEY`, `BREVO_FROM_EMAIL` | Conforme o recurso | Chaves dos servicos opcionais. |

Nao cadastre `PORT`: ela e fornecida pela Vercel. Deixe `KEEP_ALIVE_URL` vazio;
containers da Vercel escalam automaticamente e nao precisam de auto-ping.

## Validacao e deploy

```powershell
cd backend
dotnet build Presentation/ImovPlan.API/ImovPlan.API.csproj -c Release
vercel deploy
vercel deploy --prod
```

Depois do deploy, confirme `https://<sua-api>/health`. O endpoint
`/api/health` tambem esta disponivel para consumidores que usam o prefixo da API.
