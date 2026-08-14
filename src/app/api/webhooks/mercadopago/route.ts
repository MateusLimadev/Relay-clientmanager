import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { confirmarCobrancaPix } from "@/lib/mutations";
import { buscarPagamento } from "@/lib/mercadopago";

/**
 * O Mercado Pago assina a notificação no header x-signature (ts + v1). O
 * v1 é um HMAC-SHA256 de "id:{data.id};request-id:{x-request-id};ts:{ts};"
 * usando a "assinatura secreta" gerada no painel de webhooks do MP.
 * https://www.mercadopago.com.br/developers/pt/docs/subscriptions/additional-content/your-integrations/notifications/webhooks
 */
function assinaturaValida(req: Request, dataId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return false;

  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");
  if (!xSignature || !xRequestId) return false;

  const partes = Object.fromEntries(
    xSignature.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k.trim(), v?.trim()];
    })
  );
  const ts = partes.ts;
  const v1 = partes.v1;
  if (!ts || !v1) return false;

  const template = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`;
  const hash = crypto.createHmac("sha256", secret).update(template).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(v1));
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id");

  let body: { type?: string; data?: { id?: string } } = {};
  try {
    body = await req.json();
  } catch {
    // notificações antigas (topic/id) chegam sem corpo relevante; segue com a query string
  }

  const id = body.data?.id ?? dataId;
  if (!id) return NextResponse.json({ ok: false, error: "Sem id de pagamento." }, { status: 400 });

  if (!assinaturaValida(req, id)) {
    return NextResponse.json({ ok: false, error: "Assinatura inválida." }, { status: 401 });
  }

  if (body.type && body.type !== "payment") {
    return NextResponse.json({ ok: true, ignorado: body.type });
  }

  try {
    const pagamento = await buscarPagamento(id);
    if (pagamento.status !== "approved") {
      return NextResponse.json({ ok: true, status: pagamento.status });
    }
    const resultado = await confirmarCobrancaPix(id);
    return NextResponse.json({ ok: true, resultado });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
