# Painel de clientes

Sistema de gestão de assinaturas IPTV: banco Postgres (Supabase) e painel de
administração em Next.js/React.

- **Banco** (`src/lib/db/`): schema Drizzle com tabelas `servidores`,
  `clientes`, `assinaturas` e `pagamentos`.
- **Frontend** (`src/`): painel Next.js (App Router) que consulta o banco
  direto do servidor (Server Components/Actions) — a connection string nunca
  chega ao navegador.

## 1. Criar o projeto no Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **Project Settings > Database > Connection string**, copie a opção
   **Transaction pooler** (porta 6543) — é a recomendada para ambientes
   serverless como a Vercel, e funciona igual em dev local.
3. Substitua `[YOUR-PASSWORD]` na string pela senha do banco que você definiu
   na criação do projeto.

## 2. Configurar e rodar o painel

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env.local` e preencha:

   ```bash
   cp .env.example .env.local
   ```

   | Variável         | De onde vem                                                                 |
   | ---------------- | ---------------------------------------------------------------------------- |
   | `DATABASE_URL`   | Connection string do passo 1                                                 |
   | `ADMIN_PASSWORD` | Senha para entrar no painel                                                   |
   | `SESSION_SECRET` | Chave aleatória para assinar o cookie de sessão (`openssl rand -base64 32`)   |

3. Crie as tabelas no banco:

   ```bash
   npm run db:push
   ```

## 3. Migrar dados de uma planilha antiga (opcional)

Se você já tinha essa gestão numa planilha Google Sheets com um Web App do
Apps Script publicado (`SHEETS_API_URL`/`SHEETS_API_TOKEN`), adicione essas
duas variáveis no `.env.local` só durante a migração e rode:

```bash
npm run db:migrate-from-sheets
```

O script lê `listServidores`/`listClientes`/`listAssinaturas`/`listPagamentos`
do Web App e insere tudo no Postgres, preservando os ids. Recusa rodar se o
banco já tiver dados (passe `--force` para limpar e reimportar).

## 4. Rodar o painel

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) e entre com a
`ADMIN_PASSWORD`.

## Estrutura do painel

- **Dashboard** (`/`) — receita, custo, lucro e margem totais e por
  servidor; contagem de vencimentos e de assinaturas gratuitas.
- **Assinaturas** (`/assinaturas`) — lista com filtro por status, servidor,
  cliente e busca livre; criar, editar, registrar pagamento, cancelar e
  excluir.
- **Vencimentos** (`/vencimentos`) — separado em vencidas / vencem hoje /
  próximos 7 dias, com botão de registrar pagamento (empurra o vencimento
  pelo prazo da assinatura).
- **Clientes** (`/clientes`) e **Servidores** (`/servidores`) — cadastro
  simples.

Status de cada assinatura é sempre calculado a partir da data de vencimento
(exceto `teste`, `gratuita` e `cancelada`, que são manuais) — não existe
marcação de "vencido" que fica desatualizada.

## Deploy do painel

Qualquer host de Next.js serve (Vercel, etc.) — configure as mesmas 3
variáveis de ambiente do `.env.local` no provedor de deploy.
