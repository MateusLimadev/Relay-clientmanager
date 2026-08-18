import { Card, inputClass, labelClass, SubmitButton } from "@/components/ui";
import { getServidores } from "@/lib/data";
import { salvarCliente } from "./actions";
import type { Cliente } from "@/lib/types";

export default async function ClienteForm({ cliente }: { cliente?: Cliente }) {
  const servidores = cliente ? [] : await getServidores();

  return (
    <Card className="max-w-lg">
      <form action={salvarCliente} className="space-y-4">
        {cliente && <input type="hidden" name="id" value={cliente.id} />}

        <div>
          <label htmlFor="nome" className={labelClass}>
            Nome
          </label>
          <input id="nome" name="nome" defaultValue={cliente?.nome} required className={inputClass} />
        </div>

        <div>
          <label htmlFor="telefone" className={labelClass}>
            Telefone
          </label>
          <input
            id="telefone"
            name="telefone"
            defaultValue={cliente?.telefone}
            className={inputClass}
            placeholder="ex: 95705-2223"
          />
        </div>

        {!cliente && (
          <div className="border-t border-border-soft pt-4">
            <p className="mb-3 text-[13px] font-semibold text-text-secondary">
              Assinatura inicial (opcional)
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="servidorId" className={labelClass}>
                  Servidor
                </label>
                <select id="servidorId" name="servidorId" defaultValue="" className={inputClass}>
                  <option value="">Não criar assinatura agora</option>
                  {servidores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="login" className={labelClass}>
                  Login
                </label>
                <input id="login" name="login" className={inputClass} />
              </div>

              <div>
                <label htmlFor="valorCliente" className={labelClass}>
                  Valor cobrado (R$)
                </label>
                <input
                  id="valorCliente"
                  name="valorCliente"
                  type="number"
                  step="0.01"
                  min="0"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        )}

        <SubmitButton>{cliente ? "Salvar alterações" : "Criar cliente"}</SubmitButton>
      </form>
    </Card>
  );
}
