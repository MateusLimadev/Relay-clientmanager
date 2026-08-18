import { getVencimentosPageData } from "@/lib/data";
import { buildMensagemCobrancaGrupo, formatDate, formatMoney } from "@/lib/format";
import { sugerirProximoVencimento, todayStr } from "@/lib/domain";
import { PageHeader, Card, EmptyState, inputClass } from "@/components/ui";
import CobrarModal from "@/components/CobrarModal";
import RegistrarPagamentoModal from "@/components/RegistrarPagamentoModal";
import { registrarPagamentoAction } from "../assinaturas/actions";
import type { Assinatura } from "@/lib/types";

type GrupoCliente = {
  clienteId: string;
  clienteNome: string;
  telefone: string;
  itens: Assinatura[];
  total: number;
};

function agruparPorCliente(itens: Assinatura[], telefonePorCliente: Map<string, string>): GrupoCliente[] {
  const porCliente = new Map<string, GrupoCliente>();
  for (const a of itens) {
    let grupo = porCliente.get(a.clienteId);
    if (!grupo) {
      grupo = {
        clienteId: a.clienteId,
        clienteNome: a.clienteNome,
        telefone: telefonePorCliente.get(a.clienteId) ?? "",
        itens: [],
        total: 0,
      };
      porCliente.set(a.clienteId, grupo);
    }
    grupo.itens.push(a);
    grupo.total += Number(a.valorCliente) || 0;
  }
  return Array.from(porCliente.values()).sort((x, y) =>
    (x.itens[0]?.vencimento || "").localeCompare(y.itens[0]?.vencimento || "")
  );
}

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
  const grupos = agruparPorCliente(itens, telefonePorCliente);
  const hoje = todayStr();

  return (
    <div className="mb-8">
      <h2 style={{ color }} className="mb-2.5 text-[14.5px] font-bold">
        {titulo} ({itens.length})
      </h2>
      {grupos.length === 0 ? (
        <EmptyState message="Nada por aqui." />
      ) : (
        <div className="flex flex-col gap-2">
          {grupos.map((g) => {
            const mensagem = buildMensagemCobrancaGrupo(
              g.clienteNome,
              g.itens.map((a) => ({
                servidor: a.servidorNome,
                login: a.login,
                vencimento: a.vencimento,
                valor: a.valorCliente,
              }))
            );
            return (
              <Card
                key={g.clienteId}
                style={borderColor ? { borderLeft: `3px solid ${borderColor}` } : undefined}
                className="rounded-xl px-4 py-[13px]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-[160px]">
                    <div className="text-[14px] font-bold text-text">{g.clienteNome}</div>
                    <div className="text-xs text-text-secondary">{g.telefone || "sem telefone"}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    {g.itens.length > 1 && (
                      <div className="text-[14px] font-semibold text-text">Total {formatMoney(g.total)}</div>
                    )}
                    <CobrarModal clienteNome={g.clienteNome} telefone={g.telefone} mensagemPadrao={mensagem} />
                  </div>
                </div>

                <div className="mt-2.5 flex flex-col gap-1.5 border-t border-border-soft pt-2.5">
                  {g.itens.map((a) => (
                    <div
                      key={a.id}
                      className="group/item -mx-2 flex flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-1 text-[13px] transition-colors hover:bg-border-soft/50"
                    >
                      <div className="text-text-secondary">
                        {a.servidorNome} · login <span className="font-mono text-text">{a.login}</span> · vence{" "}
                        {formatDate(a.vencimento)}
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-text">{formatMoney(a.valorCliente)}</span>
                        <div className="flex items-center gap-2.5 md:opacity-0 md:transition-opacity md:group-hover/item:opacity-100 md:group-focus-within/item:opacity-100">
                          <CobrarModal
                            clienteNome={g.clienteNome}
                            telefone={g.telefone}
                            mensagemPadrao={buildMensagemCobrancaGrupo(g.clienteNome, [
                              { servidor: a.servidorNome, login: a.login, vencimento: a.vencimento, valor: a.valorCliente },
                            ])}
                            compact
                          />
                          <RegistrarPagamentoModal
                            assinaturaId={a.id}
                            clienteNome={g.clienteNome}
                            servidorNome={a.servidorNome}
                            login={a.login}
                            valorCliente={formatMoney(a.valorCliente)}
                            vencimentoSugerido={sugerirProximoVencimento(a, hoje)}
                            redirectTo="/vencimentos"
                            action={registrarPagamentoAction}
                            compact
                          />
                        </div>
                      </div>
                    </div>
                  ))}
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
