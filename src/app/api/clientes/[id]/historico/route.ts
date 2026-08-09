import { NextResponse } from "next/server";
import { getPagamentosCliente } from "@/lib/data";
import { GasError } from "@/lib/gas-client";

export async function GET(_req: Request, ctx: RouteContext<"/api/clientes/[id]/historico">) {
  const { id } = await ctx.params;
  try {
    const pagamentos = await getPagamentosCliente(id);
    return NextResponse.json({ ok: true, pagamentos });
  } catch (err) {
    const mensagem = err instanceof GasError ? err.message : "Falha ao buscar histórico.";
    return NextResponse.json({ ok: false, error: mensagem }, { status: 502 });
  }
}
