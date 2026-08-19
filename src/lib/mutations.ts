import "server-only";
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { assinaturas, clientes, cobrancasPix, pagamentos, servidores, settings } from "@/lib/db/schema";
import type { ItemCobrancaPix } from "@/lib/db/schema";
import { addDays, round2, todayStr } from "@/lib/domain";
import { criarCobrancaPix } from "@/lib/mercadopago";
import { SETTINGS_ID } from "@/lib/data";
import type { StatusServidor } from "@/lib/types";

function requireFields(obj: Record<string, unknown>, fields: string[]) {
  const faltando = fields.filter((f) => obj[f] === undefined || obj[f] === null || obj[f] === "");
  if (faltando.length) {
    throw new Error(`Campos obrigatórios ausentes: ${faltando.join(", ")}`);
  }
}

const STATUS_SERVIDOR_VALIDOS: StatusServidor[] = ["ativo", "manutencao", "offline"];
function normalizarStatusServidor(value: unknown): StatusServidor {
  return STATUS_SERVIDOR_VALIDOS.includes(value as StatusServidor)
    ? (value as StatusServidor)
    : "ativo";
}

// ---------- Servidores ----------

export async function upsertServidor(input: {
  id?: string;
  nome: unknown;
  status?: unknown;
}) {
  requireFields(input, ["nome"]);
  const data = { nome: String(input.nome).trim(), status: normalizarStatusServidor(input.status) };
  if (input.id) {
    const [row] = await db
      .update(servidores)
      .set(data)
      .where(eq(servidores.id, input.id))
      .returning();
    return row;
  }
  const [row] = await db
    .insert(servidores)
    .values({ id: randomUUID(), ...data })
    .returning();
  return row;
}

export async function deleteServidor(id: string) {
  const [emUso] = await db
    .select({ id: assinaturas.id })
    .from(assinaturas)
    .where(eq(assinaturas.servidorId, id))
    .limit(1);
  if (emUso) {
    throw new Error("Servidor possui assinaturas vinculadas; desative-o em vez de excluir.");
  }
  await db.delete(servidores).where(eq(servidores.id, id));
}

// ---------- Clientes ----------

export async function upsertCliente(input: { id?: string; nome: unknown; telefone?: unknown }) {
  requireFields(input, ["nome"]);
  const data = {
    nome: String(input.nome).trim(),
    telefone: input.telefone ? String(input.telefone).trim() : "",
  };
  if (input.id) {
    const [row] = await db.update(clientes).set(data).where(eq(clientes.id, input.id)).returning();
    return row;
  }
  const [row] = await db
    .insert(clientes)
    .values({ id: randomUUID(), ...data })
    .returning();
  return row;
}

export async function deleteCliente(id: string) {
  const [emUso] = await db
    .select({ id: assinaturas.id })
    .from(assinaturas)
    .where(eq(assinaturas.clienteId, id))
    .limit(1);
  if (emUso) {
    throw new Error("Cliente possui assinaturas vinculadas; remova-as primeiro.");
  }
  await db.delete(clientes).where(eq(clientes.id, id));
}

// ---------- Assinaturas ----------

export async function upsertAssinatura(input: {
  id?: string;
  clienteId: unknown;
  servidorId: unknown;
  login: unknown;
  valorCliente: unknown;
  custo?: unknown;
  diaPago?: unknown;
  prazoDias: unknown;
  vencimento?: unknown;
  statusManual?: unknown;
  observacao?: unknown;
}) {
  requireFields(input, ["clienteId", "servidorId", "login", "valorCliente", "prazoDias"]);
  const diaPago = input.diaPago ? String(input.diaPago) : todayStr();
  const prazoDias = Number(input.prazoDias);
  const data = {
    clienteId: String(input.clienteId),
    servidorId: String(input.servidorId),
    login: String(input.login).trim(),
    valorCliente: Number(input.valorCliente) || 0,
    custo: Number(input.custo) || 0,
    diaPago,
    prazoDias,
    vencimento: input.vencimento ? String(input.vencimento) : addDays(diaPago, prazoDias),
    statusManual: input.statusManual ? String(input.statusManual) : "",
    observacao: input.observacao ? String(input.observacao) : "",
  };
  if (input.id) {
    const [row] = await db
      .update(assinaturas)
      .set({ ...data, atualizadoEm: new Date().toISOString() })
      .where(eq(assinaturas.id, input.id))
      .returning();
    return row;
  }
  const [row] = await db
    .insert(assinaturas)
    .values({ id: randomUUID(), ...data })
    .returning();
  return row;
}

export async function cancelarAssinatura(id: string) {
  const [row] = await db
    .update(assinaturas)
    .set({ statusManual: "cancelada", atualizadoEm: new Date().toISOString() })
    .where(eq(assinaturas.id, id))
    .returning();
  return row;
}

/** onDelete: 'cascade' na FK de pagamentos cuida de apagar o histórico junto. */
export async function excluirAssinatura(id: string) {
  await db.delete(assinaturas).where(eq(assinaturas.id, id));
}

/**
 * Registra um pagamento: por padrão empurra o vencimento pelo prazo da
 * assinatura, mas aceita um `vencimento` explícito (ex.: cliente pagou um
 * período diferente do prazo padrão) que substitui esse cálculo.
 */
export async function registrarPagamento(input: {
  assinaturaId: unknown;
  data?: unknown;
  valor?: unknown;
  vencimento?: unknown;
}) {
  requireFields(input, ["assinaturaId"]);
  const assinaturaId = String(input.assinaturaId);
  const [assinatura] = await db.select().from(assinaturas).where(eq(assinaturas.id, assinaturaId));
  if (!assinatura) throw new Error(`Assinatura não encontrada: ${assinaturaId}`);

  const dataPagamento = input.data ? String(input.data) : todayStr();
  let novoVencimento: string;
  if (input.vencimento) {
    novoVencimento = String(input.vencimento);
  } else {
    const baseParaVencimento =
      assinatura.vencimento && assinatura.vencimento > dataPagamento
        ? assinatura.vencimento
        : dataPagamento;
    novoVencimento = addDays(baseParaVencimento, Number(assinatura.prazoDias) || 30);
  }
  const valor = input.valor !== undefined ? Number(input.valor) : Number(assinatura.valorCliente) || 0;

  await db.insert(pagamentos).values({
    id: randomUUID(),
    assinaturaId: assinatura.id,
    data: dataPagamento,
    valor,
  });

  const [row] = await db
    .update(assinaturas)
    .set({
      diaPago: dataPagamento,
      vencimento: novoVencimento,
      atualizadoEm: new Date().toISOString(),
    })
    .where(eq(assinaturas.id, assinatura.id))
    .returning();
  return row;
}

/**
 * Cria uma cobrança Pix cobrindo uma ou várias assinaturas de um mesmo
 * cliente (ex.: cliente com vários logins vencidos, cobrados numa tacada só
 * pelo botão "Cobrar"). Usada tanto pro cliente inteiro quanto por login.
 */
export async function criarCobrancaParaAssinaturas(assinaturaIds: string[]) {
  if (!assinaturaIds.length) throw new Error("Nenhuma assinatura selecionada.");

  const linhas = await db
    .select({
      id: assinaturas.id,
      clienteId: assinaturas.clienteId,
      login: assinaturas.login,
      valorCliente: assinaturas.valorCliente,
      servidorNome: servidores.nome,
      clienteNome: clientes.nome,
    })
    .from(assinaturas)
    .innerJoin(servidores, eq(assinaturas.servidorId, servidores.id))
    .innerJoin(clientes, eq(assinaturas.clienteId, clientes.id))
    .where(inArray(assinaturas.id, assinaturaIds));

  if (!linhas.length) throw new Error("Assinaturas não encontradas.");
  const clienteId = linhas[0].clienteId;
  const clienteNome = linhas[0].clienteNome;

  const itens: ItemCobrancaPix[] = linhas.map((l) => ({
    assinaturaId: l.id,
    servidorNome: l.servidorNome,
    login: l.login,
    valor: Number(l.valorCliente) || 0,
  }));
  const valorTotal = round2(itens.reduce((soma, i) => soma + i.valor, 0));
  const descricao =
    itens.length === 1
      ? `Assinatura ${itens[0].servidorNome} — ${clienteNome}`
      : `${itens.length} assinaturas — ${clienteNome}`;

  const cobranca = await criarCobrancaPix({
    valor: valorTotal,
    descricao,
    referenciaExterna: `${clienteId}-${randomUUID().slice(0, 8)}`,
  });

  const [row] = await db
    .insert(cobrancasPix)
    .values({
      id: randomUUID(),
      tipo: "assinatura",
      clienteId,
      itens,
      descricao,
      txid: cobranca.id,
      valor: valorTotal,
      status: "pending",
      copiaECola: cobranca.copiaECola,
      ticketUrl: cobranca.ticketUrl,
    })
    .returning();
  return row;
}

/**
 * Cobrança avulsa: valor livre digitado pelo gestor, sem estar ligada a
 * nenhuma assinatura — pra quando ele quer só copiar o link e mandar manual.
 */
export async function criarPedidoPersonalizado(input: {
  clienteId?: unknown;
  valor: unknown;
  descricao?: unknown;
}) {
  requireFields(input, ["valor"]);
  const valor = round2(Number(input.valor));
  if (!(valor > 0)) throw new Error("Valor precisa ser maior que zero.");
  const descricao = input.descricao ? String(input.descricao).trim() : "Pedido personalizado";
  const clienteId = input.clienteId ? String(input.clienteId) : null;

  const cobranca = await criarCobrancaPix({
    valor,
    descricao,
    referenciaExterna: `avulso-${randomUUID().slice(0, 12)}`,
  });

  const [row] = await db
    .insert(cobrancasPix)
    .values({
      id: randomUUID(),
      tipo: "personalizado",
      clienteId,
      itens: [],
      descricao,
      txid: cobranca.id,
      valor,
      status: "pending",
      copiaECola: cobranca.copiaECola,
      ticketUrl: cobranca.ticketUrl,
    })
    .returning();
  return row;
}

/**
 * Chamado pelo webhook do Mercado Pago quando um Pix é confirmado. Marca a
 * cobrança como paga e empurra o vencimento de cada assinatura coberta
 * (reaproveitando registrarPagamento() — mesma lógica do botão manual). Pra
 * pedidos personalizados (itens vazio) só marca como pago; o próprio
 * registro em cobrancasPix já entra no Histórico de pagamentos.
 */
export async function confirmarCobrancaPix(txid: string) {
  const [cobranca] = await db.select().from(cobrancasPix).where(eq(cobrancasPix.txid, txid));
  if (!cobranca) return { ok: false as const, motivo: "Cobrança não encontrada." };
  if (cobranca.status === "paid") return { ok: true as const, jaProcessada: true };

  await db
    .update(cobrancasPix)
    .set({ status: "paid", pagoEm: new Date().toISOString() })
    .where(eq(cobrancasPix.id, cobranca.id));

  for (const item of cobranca.itens) {
    await registrarPagamento({ assinaturaId: item.assinaturaId, valor: item.valor });
  }
  return { ok: true as const, jaProcessada: false };
}

// ---------- Configurações ----------

export async function atualizarSettings(input: { cobrancaAutomaticaAtiva: boolean }) {
  await db
    .insert(settings)
    .values({ id: SETTINGS_ID, cobrancaAutomaticaAtiva: input.cobrancaAutomaticaAtiva })
    .onConflictDoUpdate({
      target: settings.id,
      set: { cobrancaAutomaticaAtiva: input.cobrancaAutomaticaAtiva },
    });
}
