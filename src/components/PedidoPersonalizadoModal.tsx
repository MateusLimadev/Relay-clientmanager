"use client";

import { useState } from "react";
import { inputClass, labelClass } from "@/components/ui";
import { criarPedidoPersonalizadoAction } from "@/app/(painel)/pagamentos/actions";
import { formatMoney } from "@/lib/format";

type Cliente = { id: string; nome: string };

export default function PedidoPersonalizadoModal({ clientes }: { clientes: Cliente[] }) {
  const [open, setOpen] = useState(false);
  const [clienteId, setClienteId] = useState("");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ copiaECola: string; ticketUrl: string | null; valor: number } | null>(
    null
  );
  const [copiado, setCopiado] = useState(false);

  function reset() {
    setClienteId("");
    setValor("");
    setDescricao("");
    setErro(null);
    setResultado(null);
    setCopiado(false);
  }

  async function handleGerar() {
    setEnviando(true);
    setErro(null);
    const resposta = await criarPedidoPersonalizadoAction({
      clienteId: clienteId || undefined,
      valor,
      descricao: descricao || undefined,
    });
    setEnviando(false);
    if (!resposta.ok) {
      setErro(resposta.erro);
      return;
    }
    setResultado({ copiaECola: resposta.copiaECola, ticketUrl: resposta.ticketUrl, valor: resposta.valor });
  }

  async function copiar(texto: string) {
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          reset();
          setOpen(true);
        }}
        className="cursor-pointer rounded-[10px] border border-border px-4 py-2.5 text-[13.5px] font-semibold text-text hover:bg-border-soft"
      >
        + Pedido personalizado
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[440px] rounded-2xl border border-border bg-card p-[22px]"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="text-[17px] font-bold text-text">Pedido personalizado</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="cursor-pointer text-xl leading-none text-text-secondary"
              >
                ×
              </button>
            </div>

            {!resultado ? (
              <div className="space-y-3.5">
                <div>
                  <label className={labelClass}>Cliente (opcional)</label>
                  <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className={inputClass}>
                    <option value="">Sem cliente vinculado</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Descrição (opcional)</label>
                  <input
                    type="text"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="ex: instalação, taxa extra…"
                    className={inputClass}
                  />
                </div>
                {erro && <p className="text-[12.5px] text-danger">{erro}</p>}
                <button
                  type="button"
                  onClick={handleGerar}
                  disabled={enviando || !valor}
                  className="w-full cursor-pointer rounded-[10px] bg-accent px-5 py-2.5 text-[13.5px] font-bold text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-50"
                >
                  {enviando ? "Gerando…" : "Gerar cobrança Pix"}
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                <p className="text-[14px] text-text">
                  Cobrança de <span className="font-bold">{formatMoney(resultado.valor)}</span> gerada. Copie o link
                  e mande manualmente pro cliente.
                </p>
                <div className="rounded-[10px] border border-border bg-panel p-3 font-mono text-[12px] break-all text-text-secondary">
                  {resultado.ticketUrl ?? resultado.copiaECola}
                </div>
                <button
                  type="button"
                  onClick={() => copiar(resultado.ticketUrl ?? resultado.copiaECola)}
                  className="w-full cursor-pointer rounded-[10px] bg-accent px-5 py-2.5 text-[13.5px] font-bold text-accent-foreground transition-opacity hover:opacity-90"
                >
                  {copiado ? "Copiado ✓" : "Copiar link"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full cursor-pointer rounded-[10px] border border-border px-4 py-2.5 text-[13.5px] font-semibold text-text hover:bg-border-soft"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
