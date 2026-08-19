"use server";

import { revalidatePath } from "next/cache";
import { criarCobrancaParaAssinaturas, criarPedidoPersonalizado } from "@/lib/mutations";

export type ResultadoCobranca =
  | { ok: true; copiaECola: string; ticketUrl: string | null; valor: number }
  | { ok: false; erro: string };

export async function gerarCobrancaAssinaturasAction(assinaturaIds: string[]): Promise<ResultadoCobranca> {
  try {
    const cobranca = await criarCobrancaParaAssinaturas(assinaturaIds);
    revalidatePath("/pagamentos");
    return { ok: true, copiaECola: cobranca.copiaECola, ticketUrl: cobranca.ticketUrl, valor: Number(cobranca.valor) };
  } catch (err) {
    return { ok: false, erro: err instanceof Error ? err.message : String(err) };
  }
}

export async function criarPedidoPersonalizadoAction(input: {
  clienteId?: string;
  valor: string;
  descricao?: string;
}): Promise<ResultadoCobranca> {
  try {
    const cobranca = await criarPedidoPersonalizado(input);
    revalidatePath("/pagamentos");
    return { ok: true, copiaECola: cobranca.copiaECola, ticketUrl: cobranca.ticketUrl, valor: Number(cobranca.valor) };
  } catch (err) {
    return { ok: false, erro: err instanceof Error ? err.message : String(err) };
  }
}
