import { getClientes, getVencimentos } from "@/lib/data";
import { buildCobrancaLink, formatDate, formatMoney } from "@/lib/format";
import { PageHeader, Card, EmptyState } from "@/components/ui";
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
            const cobrarLink = buildCobrancaLink(
              telefonePorCliente.get(a.clienteId) ?? "",
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
                    {a.servidorNome} · vence {formatDate(a.vencimento)}
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

export default async function VencimentosPage() {
  const [venc, clientes] = await Promise.all([getVencimentos(), getClientes()]);
  const telefonePorCliente = new Map(clientes.map((c) => [c.id, c.telefone]));

  return (
    <div>
      <PageHeader title="Vencimentos" subtitle="Quem venceu, vence hoje ou vence nos próximos 7 dias" />
      <Secao
        titulo="Vencidas"
        color="var(--danger)"
        borderColor="var(--danger)"
        itens={venc.vencidas}
        telefonePorCliente={telefonePorCliente}
      />
      <Secao
        titulo="Vencem hoje"
        color="var(--warning)"
        borderColor="var(--warning)"
        itens={venc.hoje}
        telefonePorCliente={telefonePorCliente}
      />
      <Secao
        titulo="Próximos 7 dias"
        color="var(--text-value)"
        itens={venc.proximos7dias}
        telefonePorCliente={telefonePorCliente}
      />
    </div>
  );
}
