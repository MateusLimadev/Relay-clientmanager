import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { assinaturas, clientes, pagamentos, servidores, settings } from "@/lib/db/schema";

/** Linha única de configurações do painel — sempre esse id fixo. */
export const SETTINGS_ID = "default";
import { calcularDashboard, calcularVencimentos, enrichAssinatura, todayStr } from "@/lib/domain";
import type {
  Assinatura,
  Cliente,
  Dashboard,
  Pagamento,
  PagamentoCliente,
  Servidor,
  Vencimentos,
} from "@/lib/types";

export async function getServidores(): Promise<Servidor[]> {
  return db.select().from(servidores);
}

export async function getClientes(): Promise<Cliente[]> {
  const [rows, subs] = await Promise.all([
    db.select().from(clientes),
    db.select({ clienteId: assinaturas.clienteId }).from(assinaturas),
  ]);
  const contagem = new Map<string, number>();
  for (const s of subs) contagem.set(s.clienteId, (contagem.get(s.clienteId) ?? 0) + 1);
  return rows.map((c) => ({ ...c, totalAssinaturas: contagem.get(c.id) ?? 0 }));
}

async function fetchAssinaturasEnriquecidas(): Promise<Assinatura[]> {
  const rows = await db
    .select({
      id: assinaturas.id,
      clienteId: assinaturas.clienteId,
      servidorId: assinaturas.servidorId,
      login: assinaturas.login,
      valorCliente: assinaturas.valorCliente,
      custo: assinaturas.custo,
      diaPago: assinaturas.diaPago,
      prazoDias: assinaturas.prazoDias,
      vencimento: assinaturas.vencimento,
      statusManual: assinaturas.statusManual,
      observacao: assinaturas.observacao,
      criadoEm: assinaturas.criadoEm,
      atualizadoEm: assinaturas.atualizadoEm,
      clienteNome: clientes.nome,
      servidorNome: servidores.nome,
    })
    .from(assinaturas)
    .leftJoin(clientes, eq(assinaturas.clienteId, clientes.id))
    .leftJoin(servidores, eq(assinaturas.servidorId, servidores.id));

  const hoje = todayStr();
  return rows.map((r) =>
    enrichAssinatura(r, r.clienteNome ?? "", r.servidorNome ?? "", hoje)
  );
}

export async function getAssinaturas(
  filtro: Record<string, string> = {}
): Promise<Assinatura[]> {
  let rows = await fetchAssinaturasEnriquecidas();

  if (filtro.status) rows = rows.filter((a) => a.status === filtro.status);
  if (filtro.servidorId) rows = rows.filter((a) => a.servidorId === filtro.servidorId);
  if (filtro.clienteId) rows = rows.filter((a) => a.clienteId === filtro.clienteId);
  if (filtro.busca) {
    const termo = filtro.busca.toLowerCase();
    const termoDigits = termo.replace(/\D/g, "");
    const clientesList = await db.select({ id: clientes.id, telefone: clientes.telefone }).from(clientes);
    const telefonePorCliente = new Map(clientesList.map((c) => [c.id, c.telefone]));
    rows = rows.filter(
      (a) =>
        a.clienteNome.toLowerCase().includes(termo) ||
        a.login.toLowerCase().includes(termo) ||
        a.servidorNome.toLowerCase().includes(termo) ||
        (termoDigits.length > 0 &&
          (telefonePorCliente.get(a.clienteId) ?? "").replace(/\D/g, "").includes(termoDigits))
    );
  }

  return rows.sort((a, b) => (a.vencimento || "").localeCompare(b.vencimento || ""));
}

export class NotFoundError extends Error {}

export async function getAssinatura(id: string): Promise<Assinatura> {
  const rows = await fetchAssinaturasEnriquecidas();
  const a = rows.find((r) => r.id === id);
  if (!a) throw new NotFoundError(`Assinatura não encontrada: ${id}`);
  return a;
}

export async function getDashboard(): Promise<Dashboard> {
  return calcularDashboard(await fetchAssinaturasEnriquecidas());
}

export async function getVencimentos(): Promise<Vencimentos> {
  return calcularVencimentos(await fetchAssinaturasEnriquecidas());
}

export async function getPagamentos(assinaturaId?: string): Promise<Pagamento[]> {
  const query = db.select().from(pagamentos);
  const rows = assinaturaId
    ? await query.where(eq(pagamentos.assinaturaId, assinaturaId))
    : await query;
  return rows.sort((a, b) => (b.data || "").localeCompare(a.data || ""));
}

export async function getSettings(): Promise<{ cobrancaAutomaticaAtiva: boolean }> {
  const [row] = await db.select().from(settings).where(eq(settings.id, SETTINGS_ID));
  return { cobrancaAutomaticaAtiva: row?.cobrancaAutomaticaAtiva ?? false };
}

export async function getPagamentosCliente(clienteId: string): Promise<PagamentoCliente[]> {
  const rows = await db
    .select({
      id: pagamentos.id,
      data: pagamentos.data,
      valor: pagamentos.valor,
      login: assinaturas.login,
      servidorNome: servidores.nome,
    })
    .from(pagamentos)
    .innerJoin(assinaturas, eq(pagamentos.assinaturaId, assinaturas.id))
    .leftJoin(servidores, eq(assinaturas.servidorId, servidores.id))
    .where(eq(assinaturas.clienteId, clienteId));

  return rows
    .map((r) => ({ ...r, servidorNome: r.servidorNome ?? "" }))
    .sort((a, b) => (b.data || "").localeCompare(a.data || ""));
}

// Endpoints "consolidados": mantidos pelo mesmo nome/formato de antes (quando
// os dados vinham do Apps Script e cada chamada de rede era cara) para não
// precisar tocar nas páginas que já os importam. Com Postgres cada consulta é
// rápida, então aqui são só Promise.all das funções acima.

export async function getAssinaturasPageData(filtro: Record<string, string> = {}) {
  const [assinaturasList, servidoresList, clientesList] = await Promise.all([
    getAssinaturas(filtro),
    getServidores(),
    getClientes(),
  ]);
  return { assinaturas: assinaturasList, servidores: servidoresList, clientes: clientesList };
}

export async function getServidoresPageData() {
  const [servidoresList, assinaturasList] = await Promise.all([getServidores(), getAssinaturas()]);
  return { servidores: servidoresList, assinaturas: assinaturasList };
}

export async function getFormOptions() {
  const [servidoresList, clientesList] = await Promise.all([getServidores(), getClientes()]);
  return { servidores: servidoresList, clientes: clientesList };
}

export async function getVencimentosPageData() {
  const [vencimentosData, clientesList] = await Promise.all([getVencimentos(), getClientes()]);
  return { vencimentos: vencimentosData, clientes: clientesList };
}
