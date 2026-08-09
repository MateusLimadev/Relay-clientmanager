import Link from "next/link";
import { getClientes } from "@/lib/data";
import { PageHeader, Card, EmptyState, PrimaryLink } from "@/components/ui";
import ConfirmButton from "@/components/ConfirmButton";
import HistoricoModal from "@/components/HistoricoModal";
import { excluirCliente } from "./actions";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const [clientes, { erro }] = await Promise.all([getClientes(), searchParams]);

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle={`${clientes.length} clientes cadastrados`}
        action={<PrimaryLink href="/clientes/novo">+ Novo cliente</PrimaryLink>}
      />

      {erro && (
        <p className="mb-4 rounded-[10px] bg-[var(--danger-soft)] px-4 py-3 text-[13.5px] text-danger">{erro}</p>
      )}

      {clientes.length === 0 ? (
        <EmptyState message="Nenhum cliente cadastrado ainda." />
      ) : (
        <>
          {/* Tabela — desktop */}
          <Card className="hidden md:block p-0 overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-[13.5px]">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted">Telefone</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted">Assinaturas</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted">Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id} className="border-t border-border-soft">
                    <td className="px-4 py-3 font-semibold text-text">{c.nome}</td>
                    <td className="px-4 py-3 text-text-secondary">{c.telefone || "—"}</td>
                    <td className="px-4 py-3 text-right text-text-value">
                      <Link href={`/assinaturas?clienteId=${c.id}`} className="font-semibold text-accent">
                        {c.totalAssinaturas ?? 0}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className="ml-2.5">
                        <HistoricoModal clienteId={c.id} clienteNome={c.nome} />
                      </span>
                      <Link href={`/clientes/${c.id}/editar`} className="ml-2.5 text-[13px] font-semibold text-text-secondary">
                        Editar
                      </Link>
                      <form action={excluirCliente} className="inline">
                        <input type="hidden" name="id" value={c.id} />
                        <ConfirmButton
                          confirmMessage={`Excluir o cliente "${c.nome}"?`}
                          className="ml-2.5 text-[13px] font-semibold text-danger"
                        >
                          Excluir
                        </ConfirmButton>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Cards — mobile */}
          <div className="flex flex-col gap-2.5 md:hidden">
            {clientes.map((c) => (
              <Card key={c.id} className="flex items-center justify-between gap-2.5">
                <div>
                  <div className="text-[14.5px] font-bold text-text">{c.nome}</div>
                  <div className="text-[12.5px] text-text-secondary">
                    {c.telefone || "—"} · {c.totalAssinaturas ?? 0} assinatura(s)
                  </div>
                </div>
                <div className="flex-shrink-0 rounded-[9px] bg-border-soft px-3 py-2">
                  <HistoricoModal clienteId={c.id} clienteNome={c.nome} />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
