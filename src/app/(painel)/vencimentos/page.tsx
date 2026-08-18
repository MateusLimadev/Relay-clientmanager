import { getVencimentosPageData } from "@/lib/data";
import { buildCobrancaLink, formatDate, formatMoney } from "@/lib/format";
import { PageHeader, Card, EmptyState, inputClass } from "@/components/ui";
import { registrarPagamentoAction } from "../assinaturas/actions";
import type { Assinatura } from "@/lib/types";

function Secao({
  titulo,
  color,
  borderColor,
  itens,
  telefonePorCliente,
}: {
  titulo: string;
  color: string;
  borderColor?: string;
  itens: Assinatura[];
  telefonePorCliente: Map<string, string>;
}) {
  return (
    <div className="mb-8">
      <h2 style={{ color }} className="mb-2.5 text-[14.5px] font-bold">
        {titulo} ({itens.length})
      </h2>
      {itens.length === 0 ? (
        <EmptyState message="Nada por aqui." />
      ) : (
        <div className="flex flex-col gap-2">
          {itens.map((a) => {
            const telefone = telefonePorCliente.get(a.clienteId) ?? "";
            const cobrarLink = buildCobrancaLink(
              telefone,
              a.clienteNome,
              a.servidorNome,
              a.vencimento,
              a.valorCliente
            );
            return (
              <Card
                key={a.id}
                style={borderColor ? { borderLeft: `3px solid ${borderColor}` } : undefined}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-[13px]"
              >
                <div className="min-w-[160px]">
                  <div className="text-[14px] font-bold text-text">{a.clienteNome}</div>
                  <div className="text-xs text-text-secondary">
                    {telefone || "sem telefone"} · {a.servidorNome} · vence {formatDate(a.vencimento)}
                  </div>
                </div>
                <div className="text-[14px] font-semibold text-text">{formatMoney(a.valorCliente)}</div>
                <div className="flex gap-2.5">
                  {cobrarLink && (
                    <a
                      href={cobrarLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[13px] font-semibold text-accent"
                    >
                      Cobrar
                    </a>
                  )}
                  <form action={registrarPagamentoAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="redirectTo" value="/vencimentos" />
                    <button
                      type="submit"
                      className="rounded-lg bg-success px-3.5 py-[7px] text-[12.5px] font-bold text-accent-foreground"
                    >
                      Registrar pagamento
                    </button>
                  </form>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default async function VencimentosPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string }>;
}) {
  const [{ vencimentos: venc, clientes }, { busca }] = await Promise.all([
    getVencimentosPageData(),
    searchParams,
  ]);
  const telefonePorCliente = new Map(clientes.map((c) => [c.id, c.telefone]));

  const termo = (busca ?? "").trim().toLowerCase();
  const termoDigits = termo.replace(/\D/g, "");
  const filtra = (itens: Assinatura[]) =>
    termo
      ? itens.filter(
          (a) =>
            a.clienteNome.toLowerCase().includes(termo) ||
            (termoDigits.length > 0 &&
              (telefonePorCliente.get(a.clienteId) ?? "").replace(/\D/g, "").includes(termoDigits))
        )
      : itens;

  return (
    <div>
      <PageHeader title="Vencimentos" subtitle="Quem venceu, vence hoje ou vence nos próximos 7 dias" />

      <Card className="mb-4">
        <form method="get" className="flex gap-2.5">
          <input
            type="text"
            name="busca"
            defaultValue={busca}
            placeholder="Buscar por nome ou telefone…"
            className={`${inputClass} flex-1`}
          />
          <button
            type="submit"
            className="rounded-[10px] border border-border px-5 py-2.5 text-[13.5px] font-semibold text-text hover:bg-border-soft"
          >
            Buscar
          </button>
        </form>
      </Card>

      <Secao
        titulo="Vencidas"
        color="var(--danger)"
        borderColor="var(--danger)"
        itens={filtra(venc.vencidas)}
        telefonePorCliente={telefonePorCliente}
      />
      <Secao
        titulo="Vencem hoje"
        color="var(--warning)"
        borderColor="var(--warning)"
        itens={filtra(venc.hoje)}
        telefonePorCliente={telefonePorCliente}
      />
      <Secao
        titulo="Próximos 7 dias"
        color="var(--text-value)"
        itens={filtra(venc.proximos7dias)}
        telefonePorCliente={telefonePorCliente}
      />
    </div>
  );
}
