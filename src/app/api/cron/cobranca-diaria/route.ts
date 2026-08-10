import { NextRequest, NextResponse } from "next/server";
import { executarCobrancaDiaria } from "@/lib/cobranca-automatica";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  try {
    const resultado = await executarCobrancaDiaria();
    return NextResponse.json({ ok: true, ...resultado });
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "Falha ao rodar a cobrança diária.";
    return NextResponse.json({ ok: false, error: mensagem }, { status: 500 });
  }
}
