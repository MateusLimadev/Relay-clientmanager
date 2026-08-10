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

## 5. Cobrança automática por WhatsApp (opcional)

Com isso configurado, todo dia (`vercel.json` roda um cron às 12:00 UTC) o
sistema confere as assinaturas ativas que vencem hoje, gera uma cobrança Pix
na conta do Banco Inter e manda a mensagem pelo WhatsApp sozinho. Quando o
cliente paga, o webhook do Inter avisa o painel e o pagamento é registrado
automaticamente — sem precisar clicar em nada.

**Fica desligado por padrão.** Mesmo com tudo configurado, nada dispara até
você ligar o interruptor em **Configurações** dentro do painel — só ative
depois de conferir que os vencimentos da base estão corretos, senão a
primeira rodada pode cobrar assinaturas que já deveriam ter vencido há
tempo.

### Banco Inter

1. Acesse o [Internet Banking Inter PJ](https://intergov.bancointer.com.br)
   e crie credenciais de API em **Conta Digital > API**, com escopo de Pix
   (`cob.write`, `cob.read`, `webhook.write`, `pix.write`, `pix.read`).
2. Gere o certificado mTLS no mesmo painel e baixe o `.crt` e a `.key`.
   Converta cada um pra base64 numa linha só e cole em `BANCOINTER_CERT`/
   `BANCOINTER_KEY`:
   ```bash
   base64 -w0 Inter_API_Certificado.crt
   base64 -w0 Inter_API_Chave.key
   ```
3. Preencha `BANCOINTER_CLIENT_ID`, `BANCOINTER_CLIENT_SECRET` e
   `BANCOINTER_PIX_KEY` (a chave Pix cadastrada na conta que vai receber).
4. Registre a URL do webhook na API do Inter (`PUT /pix/v2/webhook/{sua-chave-pix}`)
   apontando para `https://SEU-DOMINIO/api/webhooks/bancointer/SEU_BANCOINTER_WEBHOOK_SECRET`
   — o segredo na própria URL é a autenticação, já que o Inter não assina o
   corpo da notificação.

### WhatsApp Cloud API (Meta)

1. Crie/verifique uma conta [Meta Business](https://business.facebook.com) e
   um app do tipo WhatsApp Business em
   [developers.facebook.com](https://developers.facebook.com).
2. Pegue `WHATSAPP_ACCESS_TOKEN` (token permanente de sistema, não o
   temporário de 24h) e `WHATSAPP_PHONE_NUMBER_ID` no painel do app.
3. Submeta um template de categoria **Utility** pra aprovação da Meta com 4
   variáveis, por exemplo:
   > Olá {{1}}, sua assinatura {{2}} venceu hoje. Pix copia-e-cola: {{4}}
   (nome, servidor, valor formatado, código Pix — nessa ordem). Aprovação
   pode levar de minutos a alguns dias. Preencha `WHATSAPP_TEMPLATE_NAME`
   com o nome exato do template (padrão: `cobranca_vencimento`).

### Cron e webhook na Vercel

Gere `CRON_SECRET` e `BANCOINTER_WEBHOOK_SECRET` com `openssl rand -base64 32`
e adicione, junto com todas as variáveis acima, nas **Environment Variables**
do projeto na Vercel — o `vercel.json` já declara o cron, a Vercel injeta o
`CRON_SECRET` sozinha nas chamadas.

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

Qualquer host de Next.js serve (Vercel, etc.) — configure as mesmas
variáveis de ambiente do `.env.local` no provedor de deploy (as 3
obrigatórias, e as de cobrança automática se for usar essa parte).
