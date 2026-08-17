import { NextRequest, NextResponse } from "next/server";

/**
 * Diagnóstico temporário: confirma que MERCADOPAGO_ACCESS_TOKEN está
 * configurado na Vercel e é válido, sem criar nenhuma cobrança (só chama
 * GET /users/me, uma consulta de leitura). Remover depois de confirmar.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: false, error: "MERCADOPAGO_ACCESS_TOKEN não configurado." });
  }

  try {
    const res = await fetch("https://api.mercadopago.com/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) {
      return NextResponse.json({ ok: false, status: res.status, erro: json });
    }
    return NextResponse.json({
      ok: true,
      contaId: json.id,
      email: json.email,
      nickname: json.nickname,
      siteId: json.site_id,
      webhookSecretConfigurado: Boolean(process.env.MERCADOPAGO_WEBHOOK_SECRET),
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
}
