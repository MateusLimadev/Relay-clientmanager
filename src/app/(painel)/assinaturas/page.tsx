import Link from "next/link";
import { getAssinaturasPageData } from "@/lib/data";
import { buildCobrancaLink, formatDate, formatMoney } from "@/lib/format";
import { sugerirProximoVencimento, todayStr } from "@/lib/domain";
import { PageHeader, Card, EmptyState, PrimaryLink, inputClass } from "@/components/ui";
import StatusBadge from "@/components/StatusBadge";
import ConfirmButton from "@/components/ConfirmButton";
import RegistrarPagamentoModal from "@/components/RegistrarPagamentoModal";
import { cancelarAssinaturaAction, excluirAssinaturaAction, registrarPagamentoAction } from "./actions";
import type { StatusAssinatura } from "@/lib/types";

type Filtros = {
  status?: StatusAssinatura;
  servidorId?: string;
  clienteId?: string;
  busca?: string;
};

export default async function AssinaturasPage({
  searchParams,
}: {
  searchParams: Promise<Filtros>;
}) {
  const filtros = await searchParams;
  const { assinaturas, servidores, clientes } = await getAssinaturasPageData(
    filtros as Record<string, string>
  );
  const telefonePorCliente = new Map(clientes.map((c) => [c.id, c.telefone]));
  const hoje = todayStr();

  return (
    <div>
      <PageHeader
        title="Assinaturas"
        subtitle={`${assinaturas.length} resultado(s)`}
        action={<PrimaryLink href="/assinaturas/nova">+ Nova assinatura</PrimaryLink>}
      />

      <Card className="mb-4">
        <form className="grid grid-cols-1 md:grid-cols-5 gap-2.5" method="get">
          <input
            type="text"
            name="busca"
            defaultValue={filtros.busca}
            placeholder="Buscar por nome, telefone, login, servidor…"
            className={`${inputClass} md:col-span-2`}
          />
          <select name="status" defaultValue={filtros.status ?? ""} className={inputClass}>
            <option value="">Todos os status</option>
            <option value="ativa">Ativa</option>
            <option value="vencida">Vencida</option>
            <option value="teste">Teste</option>
            <option value="gratuita">Gratuita</option>
            <option value="cancelada">Cancelada</option>
          </select>
          <select name="servidorId" defaultValue={filtros.servidorId ?? ""} className={inputClass}>
            <option value="">Todos os servidores</option>
            {servidores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
          <select name="clienteId" defaultValue={filtros.clienteId ?? ""} className={inputClass}>
            <option value="">Todos os clientes</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="md:col-span-5 md:w-fit rounded-[10px] border border-border px-5 py-2.5 text-[13.5px] font-semibold text-text hover:bg-border-soft"
          >
            Filtrar
          </button>
        </form>
      </Card>

      {assinaturas.length === 0 ? (
        <EmptyState message="Nenhuma assinatura encontrada com esses filtros." />
      ) : (
        <>
          {/* Tabela — desktop */}
          <Card className="hidden md:block p-0 overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-[13.5px]">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted">Servidor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted">Login</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted">Vencimento</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted">Valor</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted">Ações</th>
                </tr>
              </thead>
              <tbody>
                {assinaturas.map((a) => {
                  const cobrarLink = buildCobrancaLink(
                    telefonePorCliente.get(a.clienteId) ?? "",
                    a.clienteNome,
                    a.servidorNome,
                    a.vencimento,
                    a.valorCliente
                  );
                  return (
                    <tr key={a.id} className="group border-t border-border-soft transition-colors hover:bg-border-soft/50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-text">{a.clienteNome}</div>
                        <div className="text-xs text-text-secondary">{telefonePorCliente.get(a.clienteId) || "—"}</div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{a.servidorNome}</td>
                      <td className="px-4 py-3 font-mono text-text-secondary">{a.login}</td>
                      <td className="px-4 py-3 text-text-value">{formatDate(a.vencimento)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-text">{formatMoney(a.valorCliente)}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                        {(a.status === "ativa" || a.status === "vencida") && (
                          <span className="ml-2.5">
                            <RegistrarPagamentoModal
                              assinaturaId={a.id}
                              clienteNome={a.clienteNome}
                              servidorNome={a.servidorNome}
                              login={a.login}
                              valorCliente={formatMoney(a.valorCliente)}
                              vencimentoSugerido={sugerirProximoVencimento(a, hoje)}
                              redirectTo="/assinaturas"
                              action={registrarPagamentoAction}
                            />
                          </span>
                        )}
                        {cobrarLink && (
                          <a
                            href={cobrarLink}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-2.5 cursor-pointer text-[13px] font-semibold text-accent"
                          >
                            Cobrar
                          </a>
                        )}
                        <Link
                          href={`/assinaturas/${a.id}/editar`}
                          className="ml-2.5 cursor-pointer text-[13px] font-semibold text-text-secondary"
                        >
                          Editar
                        </Link>
                        {a.status !== "cancelada" && (
                          <form action={cancelarAssinaturaAction} className="inline">
                            <input type="hidden" name="id" value={a.id} />
                            <ConfirmButton
                              confirmMessage={`Cancelar a assinatura de ${a.clienteNome}?`}
                              className="ml-2.5 cursor-pointer text-[13px] font-semibold text-warning"
                            >
                              Cancelar
                            </ConfirmButton>
                          </form>
                        )}
                        <form action={excluirAssinaturaAction} className="inline">
                          <input type="hidden" name="id" value={a.id} />
                          <ConfirmButton
                            confirmMessage={`Excluir definitivamente a assinatura de ${a.clienteNome}? Isso também apaga o histórico de pagamentos dela.`}
                            className="ml-2.5 cursor-pointer text-[13px] font-semibold text-danger"
                          >
                            Excluir
                          </ConfirmButton>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {/* Cards — mobile */}
          <div className="flex flex-col gap-2.5 md:hidden">
            {assinaturas.map((a) => {
              const cobrarLink = buildCobrancaLink(
                telefonePorCliente.get(a.clienteId) ?? "",
                a.clienteNome,
                a.servidorNome,
                a.vencimento,
                a.valorCliente
              );
              return (
                <Card key={a.id}>
                  <div className="flex items-start justify-between gap-2.5">
                    <div>
                      <div className="text-[14.5px] font-bold text-text">{a.clienteNome}</div>
                      <div className="text-xs text-text-secondary">{telefonePorCliente.get(a.clienteId) || "—"}</div>
                      <div className="mt-0.5 text-[12.5px] text-text-secondary">
                        {a.servidorNome} · login <span className="font-mono">{a.login}</span> · vence{" "}
                        {formatDate(a.vencimento)}
                      </div>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="mt-2.5 border-t border-border-soft pt-2.5">
                    <div className="mb-2 text-[15px] font-bold text-text">{formatMoney(a.valorCliente)}</div>
                    <div className="flex flex-wrap items-center gap-3.5">
                      {(a.status === "ativa" || a.status === "vencida") && (
                        <RegistrarPagamentoModal
                          assinaturaId={a.id}
                          clienteNome={a.clienteNome}
                          servidorNome={a.servidorNome}
                          login={a.login}
                          valorCliente={formatMoney(a.valorCliente)}
                          vencimentoSugerido={sugerirProximoVencimento(a, hoje)}
                          redirectTo="/assinaturas"
                          action={registrarPagamentoAction}
                        />
                      )}
                      {cobrarLink && (
                        <a href={cobrarLink} target="_blank" rel="noreferrer" className="text-[13px] font-semibold text-accent">
                          Cobrar
                        </a>
                      )}
                      <Link href={`/assinaturas/${a.id}/editar`} className="text-[13px] font-semibold text-text-secondary">
                        Editar
                      </Link>
                      {a.status !== "cancelada" && (
                        <form action={cancelarAssinaturaAction} className="inline">
                          <input type="hidden" name="id" value={a.id} />
                          <ConfirmButton
                            confirmMessage={`Cancelar a assinatura de ${a.clienteNome}?`}
                            className="text-[13px] font-semibold text-warning"
                          >
                            Cancelar
                          </ConfirmButton>
                        </form>
                      )}
                      <form action={excluirAssinaturaAction} className="inline">
                        <input type="hidden" name="id" value={a.id} />
                        <ConfirmButton
                          confirmMessage={`Excluir definitivamente a assinatura de ${a.clienteNome}? Isso também apaga o histórico de pagamentos dela.`}
                          className="text-[13px] font-semibold text-danger"
                        >
                          Excluir
                        </ConfirmButton>
                      </form>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
