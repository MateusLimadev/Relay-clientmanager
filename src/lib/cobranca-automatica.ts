import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { cobrancasPix } from "@/lib/db/schema";
import { getAssinaturas, getClientes, getSettings } from "@/lib/data";
import { todayStr } from "@/lib/domain";
import { criarCobrancaPix } from "@/lib/mercadopago";
import { enviarTemplateCobranca } from "@/lib/whatsapp";
import { formatMoney } from "@/lib/format";

export type ResultadoCobrancaDiaria = {
  ativado: boolean;
  processadas: number;
  enviadas: number;
  erros: { assinaturaId: string; erro: string }[];
};

/**
 * Roda uma vez por dia (cron). Só faz alguma coisa se a automação estiver
 * ligada em Configurações — esse é o "interruptor mestre" que garante que
 * nada dispara sozinho até o usuário decidir ativar.
 */
export async function executarCobrancaDiaria(): Promise<ResultadoCobrancaDiaria> {
  const settings = await getSettings();
  if (!settings.cobrancaAutomaticaAtiva) {
    return { ativado: false, processadas: 0, enviadas: 0, erros: [] };
  }

  const hoje = todayStr();
  const [assinaturas, clientes] = await Promise.all([getAssinaturas({ status: "ativa" }), getClientes()]);
  const vencemHoje = assinaturas.filter((a) => a.vencimento === hoje);
  const telefonePorCliente = new Map(clientes.map((c) => [c.id, c.telefone]));

  const erros: ResultadoCobrancaDiaria["erros"] = [];
  let enviadas = 0;

  for (const assinatura of vencemHoje) {
    try {
      const [existente] = await db
        .select({ id: cobrancasPix.id })
        .from(cobrancasPix)
        .where(
          and(
            eq(cobrancasPix.status, "pending"),
            sql`EXISTS (SELECT 1 FROM jsonb_array_elements(${cobrancasPix.itens}) it WHERE it->>'assinaturaId' = ${assinatura.id})`
          )
        )
        .limit(1);
      if (existente) continue; // já tem cobrança pendente pra essa assinatura

      const cobranca = await criarCobrancaPix({
        valor: assinatura.valorCliente,
        descricao: `Assinatura ${assinatura.servidorNome} — ${assinatura.clienteNome}`,
        referenciaExterna: assinatura.id,
      });

      await db.insert(cobrancasPix).values({
        id: randomUUID(),
        tipo: "assinatura",
        clienteId: assinatura.clienteId,
        itens: [
          {
            assinaturaId: assinatura.id,
            servidorNome: assinatura.servidorNome,
            login: assinatura.login,
            valor: assinatura.valorCliente,
          },
        ],
        txid: cobranca.id,
        valor: assinatura.valorCliente,
        status: "pending",
        copiaECola: cobranca.copiaECola,
        ticketUrl: cobranca.ticketUrl,
      });

      const envio = await enviarTemplateCobranca(telefonePorCliente.get(assinatura.clienteId), {
        nome: assinatura.clienteNome,
        servidor: assinatura.servidorNome,
        valorFormatado: formatMoney(assinatura.valorCliente),
        copiaECola: cobranca.copiaECola,
      });
      if (!envio.ok) throw new Error(envio.error);

      enviadas += 1;
    } catch (err) {
      erros.push({ assinaturaId: assinatura.id, erro: err instanceof Error ? err.message : String(err) });
    }
  }

  return { ativado: true, processadas: vencemHoje.length, enviadas, erros };
}
