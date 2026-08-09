# Painel de clientes

Sistema de gestão de assinaturas IPTV: backend em Google Apps Script (usando
uma planilha Google Sheets como banco de dados) e painel de administração em
Next.js/React.

- **Backend** (`appscript/`): Web App do Apps Script que expõe uma API JSON
  sobre uma planilha com abas `Servidores`, `Clientes`, `Assinaturas` e
  `Pagamentos`.
- **Frontend** (`src/`): painel Next.js (App Router) que fala com essa API do
  lado do servidor — o token da API nunca chega ao navegador.

## 1. Criar a planilha e publicar o backend

1. Crie uma planilha nova no Google Sheets (pode ficar em branco; as abas são
   criadas automaticamente na primeira chamada).
2. Nela, abra **Extensões > Apps Script**.
3. Apague o `Code.gs` padrão e recrie os arquivos deste repositório dentro do
   projeto do Apps Script, copiando o conteúdo de cada um:
   - `appscript/appsscript.json` (abra via **Editor > Configurações do
     projeto > Mostrar arquivo "appsscript.json" no editor** para poder
     colar o manifesto)
   - `appscript/Code.gs`
   - `appscript/Sheets.gs`
   - `appscript/Entities.gs`
   - `appscript/Migration.gs`

   (Se preferir, use o [clasp](https://github.com/google/clasp) para subir a
   pasta `appscript/` inteira de uma vez: `clasp push`.)
4. Em **Configurações do projeto > Propriedades do script**, adicione uma
   propriedade `API_TOKEN` com um valor aleatório e secreto (ex.: gere um com
   `openssl rand -hex 32`). É esse valor que autentica as chamadas do painel.
5. Clique em **Implantar > Nova implantação**:
   - Tipo: **App da Web**
   - Executar como: **Eu** (sua conta)
   - Quem pode acessar: **Qualquer pessoa**
6. Copie a URL gerada (termina em `/exec`) — é o `SHEETS_API_URL`.

## 2. Migrar os dados da planilha antiga (opcional)

Se você já tem uma planilha antiga no formato de controle manual (aba
`servidor` com colunas Nome servidor / Login / Nome / Contato / dia pago /
Prazo / Vencimento / Valor cliente / lucro), dá para importar tudo de uma vez:

1. Compartilhe a planilha antiga com a mesma conta Google que publicou o Web
   App (ou use a mesma conta dona das duas planilhas).
2. Com a planilha nova vazia (sem nenhuma assinatura cadastrada ainda), rode
   uma chamada `migrarPlanilhaAntiga` — mais fácil direto pelo editor do Apps
   Script, executando esta função pelo menu **Executar**:

   ```js
   function rodarMigracao() {
     var resultado = migrarPlanilhaAntiga('ID_DA_PLANILHA_ANTIGA', 'servidor');
     Logger.log(JSON.stringify(resultado, null, 2));
   }
   ```

   O `ID_DA_PLANILHA_ANTIGA` é o trecho entre `/d/` e `/edit` na URL dela.
3. Confira o `Logger.log` (**Ver > Registros**): ele lista quantos
   servidores/clientes/assinaturas foram criados e avisa quais linhas tinham
   datas inválidas na planilha antiga (essas ficam com a data de hoje e
   precisam ser corrigidas manualmente no painel).

A migração recusa rodar se a planilha nova já tiver dados, para não duplicar.

## 3. Configurar e rodar o painel

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env.local` e preencha:

   ```bash
   cp .env.example .env.local
   ```

   | Variável            | De onde vem                                                  |
   | ------------------- | ------------------------------------------------------------- |
   | `SHEETS_API_URL`    | URL do deploy do Web App (passo 1.6)                          |
   | `SHEETS_API_TOKEN`  | Mesmo valor da Script Property `API_TOKEN` (passo 1.4)        |
   | `ADMIN_PASSWORD`    | Senha para entrar no painel                                   |
   | `SESSION_SECRET`    | Chave aleatória para assinar o cookie de sessão (`openssl rand -base64 32`) |

3. Rode o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

4. Acesse [http://localhost:3000](http://localhost:3000) e entre com a
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
(exceto `teste`, `gratuita` e `cancelada`, que são manuais) — não existe mais
o problema de marcação de "vencido" ficar desatualizada.

## Deploy do painel

Qualquer host de Next.js serve (Vercel, etc.) — configure as mesmas 4
variáveis de ambiente do `.env.local` no provedor de deploy. O backend
(Apps Script) já está publicado e não precisa de mais nada.
