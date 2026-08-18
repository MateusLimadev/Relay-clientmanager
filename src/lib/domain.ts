import type { Assinatura, Dashboard, PorServidor, StatusAssinatura, Vencimentos } from "@/lib/types";

const TIMEZONE = "America/Sao_Paulo";

/** Data de hoje em yyyy-MM-dd, no fuso do negócio (não o fuso do servidor). */
export function todayStr(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(new Date());
}

/** Soma dias a uma data yyyy-MM-dd sem depender do fuso local do processo. */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + (Number(days) || 0));
  return date.toISOString().slice(0, 10);
}

export function round2(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/**
 * Mesma conta que registrarPagamento() usa por padrão — serve só pra sugerir
 * uma data inicial no modal de "Pagou", que o usuário pode editar antes de
 * confirmar.
 */
export function sugerirProximoVencimento(assinatura: { vencimento: string; prazoDias: number }, hoje: string): string {
  const baseParaVencimento =
    assinatura.vencimento && assinatura.vencimento > hoje ? assinatura.vencimento : hoje;
  return addDays(baseParaVencimento, Number(assinatura.prazoDias) || 30);
}

export function computeStatus(
  assinatura: { statusManual: string; vencimento: string },
  hoje: string
): StatusAssinatura {
  if (assinatura.statusManual === "cancelada") return "cancelada";
  if (assinatura.statusManual === "teste") return "teste";
  if (assinatura.statusManual === "gratuita") return "gratuita";
  if (!assinatura.vencimento) return "ativa";
  return assinatura.vencimento < hoje ? "vencida" : "ativa";
}

type RawAssinatura = Omit<Assinatura, "clienteNome" | "servidorNome" | "lucro" | "status">;

export function enrichAssinatura(
  a: RawAssinatura,
  clienteNome: string,
  servidorNome: string,
  hoje: string
): Assinatura {
  return {
    ...a,
    clienteNome: clienteNome || "(sem cliente)",
    servidorNome: servidorNome || "(sem servidor)",
    lucro: round2((Number(a.valorCliente) || 0) - (Number(a.custo) || 0)),
    status: computeStatus(a, hoje),
  };
}

export function calcularVencimentos(assinaturas: Assinatura[]): Vencimentos {
  const hoje = todayStr();
  const em7dias = addDays(hoje, 7);
  const todas = assinaturas.filter((a) => a.status === "ativa" || a.status === "vencida");
  return {
    vencidas: todas.filter((a) => a.status === "vencida"),
    hoje: todas.filter((a) => a.status === "ativa" && a.vencimento === hoje),
    proximos7dias: todas.filter(
      (a) => a.status === "ativa" && a.vencimento > hoje && a.vencimento <= em7dias
    ),
  };
}

export function calcularDashboard(assinaturas: Assinatura[]): Dashboard {
  const ativasOuVencidas = assinaturas.filter((a) => a.status === "ativa" || a.status === "vencida");

  const porServidorMap = new Map<string, PorServidor>();
  for (const a of ativasOuVencidas) {
    const key = a.servidorNome;
    const acc = porServidorMap.get(key) ?? {
      servidor: key,
      assinaturas: 0,
      receita: 0,
      custo: 0,
      lucro: 0,
      margem: 0,
    };
    acc.assinaturas += 1;
    acc.receita += Number(a.valorCliente) || 0;
    acc.custo += Number(a.custo) || 0;
    acc.lucro += a.lucro;
    porServidorMap.set(key, acc);
  }
  const porServidor = Array.from(porServidorMap.values())
    .map((s) => ({
      ...s,
      receita: round2(s.receita),
      custo: round2(s.custo),
      lucro: round2(s.lucro),
      margem: s.receita > 0 ? round2((s.lucro / s.receita) * 100) : 0,
    }))
    .sort((a, b) => b.receita - a.receita);

  const totais = ativasOuVencidas.reduce(
    (acc, a) => {
      acc.receita += Number(a.valorCliente) || 0;
      acc.custo += Number(a.custo) || 0;
      acc.lucro += a.lucro;
      return acc;
    },
    { receita: 0, custo: 0, lucro: 0 }
  );

  const gratuitos = assinaturas.filter((a) => a.status === "gratuita");
  const gratuitosCusto = gratuitos.reduce((sum, a) => sum + (Number(a.custo) || 0), 0);

  const venc = calcularVencimentos(assinaturas);
  const inadimplencia = venc.vencidas.reduce((sum, a) => sum + (Number(a.valorCliente) || 0), 0);

  return {
    totais: {
      receita: round2(totais.receita),
      custo: round2(totais.custo),
      lucro: round2(totais.lucro),
      margem: totais.receita > 0 ? round2((totais.lucro / totais.receita) * 100) : 0,
      assinaturasAtivas: ativasOuVencidas.length,
      clientesUnicos: new Set(ativasOuVencidas.map((a) => a.clienteId)).size,
      inadimplencia: round2(inadimplencia),
      inadimplentesCount: venc.vencidas.length,
    },
    gratuitos: {
      quantidade: gratuitos.length,
      custo: round2(gratuitosCusto),
    },
    porServidor,
    vencimentos: {
      vencidas: venc.vencidas.length,
      hoje: venc.hoje.length,
      proximos7dias: venc.proximos7dias.length,
    },
  };
}
