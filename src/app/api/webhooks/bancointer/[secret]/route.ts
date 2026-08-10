import { NextResponse } from "next/server";
import { confirmarCobrancaPix } from "@/lib/mutations";

type NotificacaoPix = {
  pix?: { txid?: string }[];
};

/**
 * O Inter não assina o corpo da notificação como o Mercado Pago faz — a
 * autenticação aqui é o segredo embutido na própria URL cadastrada como
 * webhookUrl (PUT /pix/v2/webhook/{chave}), então só quem sabe essa URL
 * completa consegue chamar essa rota.
 */
export async function POST(req: Request, ctx: RouteContext<"/api/webhooks/bancointer/[secret]">) {
  const { secret } = await ctx.params;
  const esperado = process.env.BANCOINTER_WEBHOOK_SECRET;
  if (!esperado || secret !== esperado) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  let body: NotificacaoPix;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Corpo inválido." }, { status: 400 });
  }

  const eventos = body.pix ?? [];
  const resultados = [];
  for (const evento of eventos) {
    if (!evento.txid) continue;
    try {
      resultados.push(await confirmarCobrancaPix(evento.txid));
    } catch (err) {
      resultados.push({ ok: false, erro: err instanceof Error ? err.message : String(err) });
    }
  }

  return NextResponse.json({ ok: true, processados: resultados.length, resultados });
}
