import { Card, inputClass, labelClass, SubmitButton } from "@/components/ui";
import { salvarServidor } from "./actions";
import type { Servidor } from "@/lib/types";

export default function ServidorForm({ servidor }: { servidor?: Servidor }) {
  return (
    <Card className="max-w-lg">
      <form action={salvarServidor} className="space-y-4">
        {servidor && <input type="hidden" name="id" value={servidor.id} />}

        <div>
          <label htmlFor="nome" className={labelClass}>
            Nome do servidor
          </label>
          <input
            id="nome"
            name="nome"
            defaultValue={servidor?.nome}
            required
            className={inputClass}
            placeholder="ex: nexus"
          />
        </div>

        <div>
          <label htmlFor="status" className={labelClass}>
            Status
          </label>
          <select id="status" name="status" defaultValue={servidor?.status ?? "ativo"} className={inputClass}>
            <option value="ativo">Ativo</option>
            <option value="manutencao">Em manutenção</option>
            <option value="offline">Offline</option>
          </select>
        </div>

        <SubmitButton>{servidor ? "Salvar alterações" : "Criar servidor"}</SubmitButton>
      </form>
    </Card>
  );
}
