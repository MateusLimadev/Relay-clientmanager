import { Card, inputClass, labelClass, SubmitButton } from "@/components/ui";
import { salvarCliente } from "./actions";
import type { Cliente } from "@/lib/types";

export default function ClienteForm({ cliente }: { cliente?: Cliente }) {
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

        <SubmitButton>{cliente ? "Salvar alterações" : "Criar cliente"}</SubmitButton>
      </form>
    </Card>
  );
}
