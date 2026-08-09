import { getServidoresPageData } from "@/lib/data";
import { PageHeader, Card, EmptyState, PrimaryLink } from "@/components/ui";
import ConfirmButton from "@/components/ConfirmButton";
import ServidorStatusBadge from "@/components/ServidorStatusBadge";
import { excluirServidor } from "./actions";
import Link from "next/link";

export default async function ServidoresPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const [{ servidores, assinaturas }, { erro }] = await Promise.all([
    getServidoresPageData(),
    searchParams,
  ]);

  const ativasPorServidor = new Map<string, number>();
  for (const a of assinaturas) {
    if (a.status === "ativa" || a.status === "vencida") {
      ativasPorServidor.set(a.servidorId, (ativasPorServidor.get(a.servidorId) ?? 0) + 1);
    }
  }

  return (
    <div>
      <PageHeader
        title="Servidores"
        subtitle="Painéis IPTV que você revende"
        action={<PrimaryLink href="/servidores/novo">+ Novo servidor</PrimaryLink>}
      />

      {erro && (
        <p className="mb-4 rounded-[10px] bg-[var(--danger-soft)] px-4 py-3 text-[13.5px] text-danger">{erro}</p>
      )}

      {servidores.length === 0 ? (
        <EmptyState message="Nenhum servidor cadastrado ainda." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {servidores.map((s) => (
            <Card key={s.id}>
              <div className="mb-3 flex items-start justify-between">
                <div className="text-[15px] font-bold text-text">{s.nome}</div>
                <ServidorStatusBadge status={s.status} />
              </div>
              <div className="mb-3.5 text-[12.5px] text-text-secondary">
                {ativasPorServidor.get(s.id) ?? 0} assinaturas ativas
              </div>
              <div className="flex gap-3.5 border-t border-border-soft pt-2.5">
                <Link href={`/servidores/${s.id}/editar`} className="text-[13px] font-semibold text-text-secondary">
                  Editar
                </Link>
                <form action={excluirServidor} className="inline">
                  <input type="hidden" name="id" value={s.id} />
                  <ConfirmButton
                    confirmMessage={`Excluir o servidor "${s.nome}"?`}
                    className="text-[13px] font-semibold text-danger"
                  >
                    Excluir
                  </ConfirmButton>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
