import { Card, inputClass, labelClass, SubmitButton } from "@/components/ui";
import { salvarAssinatura } from "./actions";
import { getClientes, getServidores } from "@/lib/data";
import type { Assinatura } from "@/lib/types";

export default async function AssinaturaForm({ assinatura }: { assinatura?: Assinatura }) {
  const [clientes, servidores] = await Promise.all([getClientes(), getServidores()]);

  return (
    <Card className="max-w-2xl">
      <form action={salvarAssinatura} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assinatura && <input type="hidden" name="id" value={assinatura.id} />}

        <div>
          <label htmlFor="clienteId" className={labelClass}>
            Cliente
          </label>
          <select
            id="clienteId"
            name="clienteId"
            required
            defaultValue={assinatura?.clienteId ?? ""}
            className={inputClass}
          >
            <option value="" disabled>
              Selecione…
            </option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="servidorId" className={labelClass}>
            Servidor
          </label>
          <select
            id="servidorId"
            name="servidorId"
            required
            defaultValue={assinatura?.servidorId ?? ""}
            className={inputClass}
          >
            <option value="" disabled>
              Selecione…
            </option>
            {servidores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
                {s.status === "manutencao" && " (em manutenção)"}
                {s.status === "offline" && " (offline)"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="login" className={labelClass}>
            Login
          </label>
          <input id="login" name="login" defaultValue={assinatura?.login} required className={inputClass} />
        </div>

        <div>
          <label htmlFor="statusManual" className={labelClass}>
            Status manual
          </label>
          <select
            id="statusManual"
            name="statusManual"
            defaultValue={assinatura?.statusManual ?? ""}
            className={inputClass}
          >
            <option value="">Automático (por vencimento)</option>
            <option value="teste">Teste</option>
            <option value="gratuita">Gratuita</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>

        <div>
          <label htmlFor="valorCliente" className={labelClass}>
            Valor cobrado do cliente (R$)
          </label>
          <input
            id="valorCliente"
            name="valorCliente"
            type="number"
            step="0.01"
            min="0"
            defaultValue={assinatura?.valorCliente}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="custo" className={labelClass}>
            Custo do painel (R$)
          </label>
          <input
            id="custo"
            name="custo"
            type="number"
            step="0.01"
            min="0"
            defaultValue={assinatura?.custo}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="diaPago" className={labelClass}>
            Último pagamento
          </label>
          <input
            id="diaPago"
            name="diaPago"
            type="date"
            defaultValue={assinatura?.diaPago}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="prazoDias" className={labelClass}>
            Prazo (dias)
          </label>
          <input
            id="prazoDias"
            name="prazoDias"
            type="number"
            min="1"
            list="prazos-comuns"
            defaultValue={assinatura?.prazoDias ?? 30}
            required
            className={inputClass}
          />
          <datalist id="prazos-comuns">
            <option value="30" />
            <option value="61" />
            <option value="92" />
            <option value="275" />
            <option value="306" />
            <option value="334" />
          </datalist>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="observacao" className={labelClass}>
            Observação
          </label>
          <textarea
            id="observacao"
            name="observacao"
            defaultValue={assinatura?.observacao}
            rows={2}
            className={inputClass}
          />
        </div>

        <div className="md:col-span-2">
          <SubmitButton>{assinatura ? "Salvar alterações" : "Criar assinatura"}</SubmitButton>
        </div>
      </form>
    </Card>
  );
}
