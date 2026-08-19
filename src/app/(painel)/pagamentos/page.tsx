import { getClientes, getCobrancasPendentes, getHistoricoPagamentos } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/format";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import PedidoPersonalizadoModal from "@/components/PedidoPersonalizadoModal";
import CopiarLinkButton from "@/components/CopiarLinkButton";

export default async function PagamentosPage() {
  const [historico, pendentes, clientes] = await Promise.all([
    getHistoricoPagamentos(),
    getCobrancasPendentes(),
    getClientes(),
  ]);

  return (
    <div>
      <PageHeader
        title="Histórico de pagamentos"
        subtitle={`${historico.length} pagamento(s) registrado(s)`}
        action={<PedidoPersonalizadoModal clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))} />}
      />

      {pendentes.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-2.5 text-[14.5px] font-bold text-warning">Cobranças pendentes ({pendentes.length})</h2>
          <div className="flex flex-col gap-2">
            {pendentes.map((c) => (
              <Card
                key={c.id}
                style={{ borderLeft: "3px solid var(--warning)" }}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-[13px]"
              >
                <div className="min-w-[160px]">
                  <div className="text-[14px] font-bold text-text">{c.clienteNome}</div>
                  <div className="text-xs text-text-secondary">
                    {c.tipo === "personalizado" ? "Pedido personalizado" : "Cobrança de assinatura"} ·{" "}
                    {c.descricao} · {formatDate(c.criadoEm.slice(0, 10))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-[14px] font-semibold text-text">{formatMoney(c.valor)}</div>
                  <CopiarLinkButton texto={c.ticketUrl ?? c.copiaECola} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <h2 className="mb-2.5 text-[14.5px] font-bold text-text">Pagamentos confirmados</h2>
      {historico.length === 0 ? (
        <EmptyState message="Nenhum pagamento registrado ainda." />
      ) : (
        <>
          {/* Tabela — desktop */}
          <Card className="hidden md:block p-0 overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-[13.5px]">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted">Detalhe</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted">Valor</th>
                </tr>
              </thead>
              <tbody>
                {historico.map((h) => (
                  <tr key={`${h.origem}-${h.id}`} className="border-t border-border-soft">
                    <td className="px-4 py-3 text-text-value">{formatDate(h.data)}</td>
                    <td className="px-4 py-3 font-semibold text-text">{h.clienteNome}</td>
                    <td className="px-4 py-3 text-text-secondary">{h.detalhe}</td>
                    <td className="px-4 py-3 text-right font-semibold text-success">{formatMoney(h.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Cards — mobile */}
          <div className="flex flex-col gap-2.5 md:hidden">
            {historico.map((h) => (
              <Card key={`${h.origem}-${h.id}`} className="flex items-center justify-between gap-2.5">
                <div>
                  <div className="text-[14.5px] font-bold text-text">{h.clienteNome}</div>
                  <div className="text-[12.5px] text-text-secondary">
                    {h.detalhe} · {formatDate(h.data)}
                  </div>
                </div>
                <div className="text-[15px] font-bold text-success">{formatMoney(h.valor)}</div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
