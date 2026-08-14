import "server-only";

const BASE_URL = "https://api.mercadopago.com";

function getAccessToken() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");
  return token;
}

export type CobrancaPix = { id: string; copiaECola: string };

/**
 * Cria um pagamento Pix (API de Pagamentos, não Orders — só precisamos de
 * "uma transação por solicitação"). O dinheiro cai na conta Mercado Pago
 * associada ao access token.
 */
export async function criarCobrancaPix(params: {
  valor: number;
  descricao: string;
  referenciaExterna: string;
}): Promise<CobrancaPix> {
  const res = await fetch(`${BASE_URL}/v1/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
      // evita cobrança duplicada se o cron reprocessar a mesma assinatura
      "X-Idempotency-Key": params.referenciaExterna,
    },
    body: JSON.stringify({
      transaction_amount: Number(params.valor.toFixed(2)),
      description: params.descricao.slice(0, 140),
      payment_method_id: "pix",
      external_reference: params.referenciaExterna,
      payer: { email: "cliente@relay.app" },
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Mercado Pago (criar cobrança) falhou (${res.status}): ${JSON.stringify(json)}`);
  }

  const copiaECola = json.point_of_interaction?.transaction_data?.qr_code;
  if (!copiaECola) throw new Error("Mercado Pago não retornou o código Pix copia-e-cola.");

  return { id: String(json.id), copiaECola };
}

export async function buscarPagamento(id: string): Promise<{ status: string }> {
  const res = await fetch(`${BASE_URL}/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Mercado Pago (consultar pagamento) falhou (${res.status}): ${JSON.stringify(json)}`);
  }
  return { status: json.status };
}
