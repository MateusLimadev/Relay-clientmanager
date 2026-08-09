/**
 * Migração única: lê os dados do Web App do Apps Script (ainda publicado) e
 * insere no Postgres, preservando ids e timestamps. Rode com:
 *
 *   npx tsx scripts/migrate-from-sheets.ts
 *
 * Recusa rodar se o banco já tiver dados — evita duplicar em uma segunda
 * execução por engano. Passe --force para limpar e reimportar mesmo assim.
 */
// Carrega o .env.local ANTES de importar o client do banco (ele lê
// DATABASE_URL assim que o módulo é avaliado), por isso os imports abaixo
// são dinâmicos em vez de estáticos no topo do arquivo.
try {
  process.loadEnvFile(".env.local");
} catch {
  // segue sem .env.local (ex.: variáveis já exportadas no ambiente)
}

type ServidorRaw = { id: string; nome: string; status: string; criadoEm: string };
type ClienteRaw = { id: string; nome: string; telefone: string; criadoEm: string };
type AssinaturaRaw = {
  id: string;
  clienteId: string;
  servidorId: string;
  login: string;
  valorCliente: number;
  custo: number;
  diaPago: string;
  prazoDias: number;
  vencimento: string;
  statusManual: string;
  observacao: string;
  criadoEm: string;
  atualizadoEm: string;
};
type PagamentoRaw = { id: string; assinaturaId: string; data: string; valor: number; criadoEm: string };

async function callGas<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const url = process.env.SHEETS_API_URL;
  const token = process.env.SHEETS_API_TOKEN;
  if (!url || !token) {
    throw new Error("SHEETS_API_URL / SHEETS_API_TOKEN não encontrados no .env.local.");
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, action, payload }),
  });
  const json = (await res.json()) as { ok: true; data: T } | { ok: false; error: string };
  if (!json.ok) throw new Error(`${action}: ${json.error}`);
  return json.data;
}

async function main() {
  // Não reaproveita src/lib/db/client.ts aqui: esse módulo importa
  // "server-only", que só resolve dentro do bundler do Next (fora dele,
  // sempre lança erro de propósito). Este script monta sua própria conexão.
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const postgres = (await import("postgres")).default;
  const { assinaturas, clientes, pagamentos, servidores } = await import("../src/lib/db/schema");

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL não encontrado no .env.local.");
  const db = drizzle(postgres(connectionString, { prepare: false }));

  const force = process.argv.includes("--force");

  const existentes = await db.select({ id: servidores.id }).from(servidores).limit(1);
  if (existentes.length > 0 && !force) {
    throw new Error(
      "O banco já tem dados em Servidores. Rode com --force se quiser limpar e reimportar."
    );
  }
  if (force) {
    console.log("--force: limpando tabelas...");
    await db.delete(pagamentos);
    await db.delete(assinaturas);
    await db.delete(clientes);
    await db.delete(servidores);
  }

  console.log("Buscando dados do Apps Script...");
  const [servidoresData, clientesData, assinaturasData, pagamentosData] = await Promise.all([
    callGas<ServidorRaw[]>("listServidores"),
    callGas<ClienteRaw[]>("listClientes"),
    callGas<AssinaturaRaw[]>("listAssinaturas"),
    callGas<PagamentoRaw[]>("listPagamentos", {}),
  ]);

  console.log(
    `Encontrados: ${servidoresData.length} servidores, ${clientesData.length} clientes, ${assinaturasData.length} assinaturas, ${pagamentosData.length} pagamentos.`
  );

  if (servidoresData.length) {
    await db.insert(servidores).values(
      servidoresData.map((s) => ({
        id: s.id,
        nome: s.nome,
        status: s.status as "ativo" | "manutencao" | "offline",
        criadoEm: s.criadoEm,
      }))
    );
  }

  if (clientesData.length) {
    await db.insert(clientes).values(
      clientesData.map((c) => ({
        id: c.id,
        nome: c.nome,
        telefone: c.telefone ?? "",
        criadoEm: c.criadoEm,
      }))
    );
  }

  if (assinaturasData.length) {
    await db.insert(assinaturas).values(
      assinaturasData.map((a) => ({
        id: a.id,
        clienteId: a.clienteId,
        servidorId: a.servidorId,
        login: String(a.login),
        valorCliente: Number(a.valorCliente) || 0,
        custo: Number(a.custo) || 0,
        diaPago: a.diaPago,
        prazoDias: Number(a.prazoDias) || 30,
        vencimento: a.vencimento,
        statusManual: a.statusManual ?? "",
        observacao: a.observacao ?? "",
        criadoEm: a.criadoEm,
        atualizadoEm: a.atualizadoEm,
      }))
    );
  }

  if (pagamentosData.length) {
    await db.insert(pagamentos).values(
      pagamentosData.map((p) => ({
        id: p.id,
        assinaturaId: p.assinaturaId,
        data: p.data,
        valor: Number(p.valor) || 0,
        criadoEm: p.criadoEm,
      }))
    );
  }

  console.log("Migração concluída.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro na migração:", err.message || err);
  process.exit(1);
});
