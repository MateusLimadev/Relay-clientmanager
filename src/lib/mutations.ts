import "server-only";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { assinaturas, clientes, cobrancasPix, pagamentos, servidores, settings } from "@/lib/db/schema";
import { addDays, todayStr } from "@/lib/domain";
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

/** Registra um pagamento: empurra o vencimento pelo prazo da assinatura. */
export async function registrarPagamento(input: { assinaturaId: unknown; data?: unknown; valor?: unknown }) {
  requireFields(input, ["assinaturaId"]);
  const assinaturaId = String(input.assinaturaId);
  const [assinatura] = await db.select().from(assinaturas).where(eq(assinaturas.id, assinaturaId));
  if (!assinatura) throw new Error(`Assinatura não encontrada: ${assinaturaId}`);

  const dataPagamento = input.data ? String(input.data) : todayStr();
  const baseParaVencimento =
    assinatura.vencimento && assinatura.vencimento > dataPagamento
      ? assinatura.vencimento
      : dataPagamento;
  const novoVencimento = addDays(baseParaVencimento, Number(assinatura.prazoDias) || 30);
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
 * Chamado pelo webhook do Mercado Pago quando um Pix é confirmado. Marca a
 * cobrança como paga e reaproveita registrarPagamento() — a mesma lógica que
 * o botão manual "Registrar pagamento" já usa.
 */
export async function confirmarCobrancaPix(txid: string) {
  const [cobranca] = await db.select().from(cobrancasPix).where(eq(cobrancasPix.txid, txid));
  if (!cobranca) return { ok: false as const, motivo: "Cobrança não encontrada." };
  if (cobranca.status === "paid") return { ok: true as const, jaProcessada: true };

  await db
    .update(cobrancasPix)
    .set({ status: "paid", pagoEm: new Date().toISOString() })
    .where(eq(cobrancasPix.id, cobranca.id));

  await registrarPagamento({ assinaturaId: cobranca.assinaturaId, valor: cobranca.valor });
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
