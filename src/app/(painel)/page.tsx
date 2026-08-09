import { getDashboard } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import { PageHeader, StatCard, Card, EmptyState } from "@/components/ui";
import Link from "next/link";

export default async function DashboardPage() {
  const dash = await getDashboard();

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Visão geral do mês corrente" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatCard label="Receita" value={formatMoney(dash.totais.receita)} />
        <StatCard label="Custo" value={formatMoney(dash.totais.custo)} />
        <StatCard
          label="Lucro"
          value={formatMoney(dash.totais.lucro)}
          hint={`margem ${dash.totais.margem.toFixed(1)}%`}
          valueClassName="text-accent"
        />
        <StatCard
          label="Assinaturas ativas"
          value={String(dash.totais.assinaturasAtivas)}
          hint={`${dash.totais.clientesUnicos} clientes únicos`}
        />
      </div>

      <div className="mt-3.5 grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <Link href="/vencimentos">
          <Card className="h-full transition-colors hover:border-accent/40">
            <p className="text-[13px] text-text-secondary">Vencimentos</p>
            <div className="mt-3 flex gap-[22px]">
              <div>
                <p className="font-heading text-[21px] font-semibold text-danger">{dash.vencimentos.vencidas}</p>
                <p className="mt-0.5 text-[11.5px] text-text-muted">vencidas</p>
              </div>
              <div>
                <p className="font-heading text-[21px] font-semibold text-warning">{dash.vencimentos.hoje}</p>
                <p className="mt-0.5 text-[11.5px] text-text-muted">hoje</p>
              </div>
              <div>
                <p className="font-heading text-[21px] font-semibold text-text">{dash.vencimentos.proximos7dias}</p>
                <p className="mt-0.5 text-[11.5px] text-text-muted">próx. 7 dias</p>
              </div>
            </div>
          </Card>
        </Link>

        <Card>
          <p className="text-[13px] text-text-secondary">Inadimplência</p>
          <div className="flex items-baseline gap-2">
            <p className="font-heading text-[25px] font-semibold text-danger">
              {formatMoney(dash.totais.inadimplencia)}
            </p>
            <p className="text-[12.5px] text-text-muted">em aberto</p>
          </div>
          <p className="mt-[3px] text-xs text-text-muted">
            {dash.totais.inadimplentesCount} assinaturas vencidas sem pagamento
          </p>
        </Card>
      </div>

      <Card className="mt-3.5">
        <p className="text-[13px] text-text-secondary">Gratuitos</p>
        <div className="mt-3 flex gap-[22px]">
          <div>
            <p className="font-heading text-[21px] font-semibold text-text">{dash.gratuitos.quantidade}</p>
            <p className="mt-0.5 text-[11.5px] text-text-muted">assinaturas</p>
          </div>
          <div>
            <p className="font-heading text-[21px] font-semibold text-danger">{formatMoney(dash.gratuitos.custo)}</p>
            <p className="mt-0.5 text-[11.5px] text-text-muted">custo mensal</p>
          </div>
        </div>
      </Card>

      <h2 className="mt-8 mb-3.5 text-[15px] font-bold text-text">Por servidor</h2>
      {dash.porServidor.length === 0 ? (
        <EmptyState message="Nenhuma assinatura cadastrada ainda." />
      ) : (
        <Card className="p-0 overflow-hidden overflow-x-auto">
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr>
                <th className="px-[18px] py-2.5 text-left text-xs font-semibold text-text-muted">Servidor</th>
                <th className="px-[18px] py-2.5 text-right text-xs font-semibold text-text-muted">Assinaturas</th>
                <th className="px-[18px] py-2.5 text-right text-xs font-semibold text-text-muted">Receita</th>
                <th className="px-[18px] py-2.5 text-right text-xs font-semibold text-text-muted">Lucro</th>
                <th className="px-[18px] py-2.5 text-right text-xs font-semibold text-text-muted">Margem</th>
              </tr>
            </thead>
            <tbody>
              {dash.porServidor.map((s) => (
                <tr key={s.servidor} className="border-t border-border-soft">
                  <td className="px-[18px] py-[11px] font-semibold text-text">{s.servidor}</td>
                  <td className="px-[18px] py-[11px] text-right text-text-value">{s.assinaturas}</td>
                  <td className="px-[18px] py-[11px] text-right text-text-value">{formatMoney(s.receita)}</td>
                  <td className="px-[18px] py-[11px] text-right text-text-value">{formatMoney(s.lucro)}</td>
                  <td className="px-[18px] py-[11px] text-right font-semibold text-accent">
                    {s.margem.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
