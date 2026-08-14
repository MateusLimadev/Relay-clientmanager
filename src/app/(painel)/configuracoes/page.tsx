import { getSettings } from "@/lib/data";
import { Card, PageHeader, SubmitButton } from "@/components/ui";
import { salvarConfiguracoes } from "./actions";

export default async function ConfiguracoesPage() {
  const settings = await getSettings();

  return (
    <div>
      <PageHeader title="Configurações" subtitle="Automação de cobrança" />

      <Card className="max-w-xl">
        <form action={salvarConfiguracoes} className="space-y-4">
          <div className="flex items-start gap-3">
            <input
              id="cobrancaAutomaticaAtiva"
              name="cobrancaAutomaticaAtiva"
              type="checkbox"
              defaultChecked={settings.cobrancaAutomaticaAtiva}
              className="mt-1 h-5 w-5 accent-accent"
            />
            <label htmlFor="cobrancaAutomaticaAtiva" className="text-[14px] text-text">
              <span className="font-semibold">Cobrança automática por WhatsApp</span>
              <p className="mt-1 text-[13px] text-text-secondary">
                Todo dia, no vencimento de cada assinatura ativa, o sistema gera uma cobrança Pix na sua
                conta do Mercado Pago e manda a mensagem pelo WhatsApp automaticamente. Quando o cliente
                pagar, o pagamento é registrado sozinho no painel — sem precisar clicar em nada.
              </p>
            </label>
          </div>

          {!settings.cobrancaAutomaticaAtiva && (
            <p className="rounded-[10px] bg-[var(--warning-soft)] px-4 py-3 text-[13px] text-warning">
              Está desligada. Só ative depois de conferir que os vencimentos na base estão corretos —
              senão a primeira rodada pode cobrar assinaturas que já deveriam ter vencido há tempo.
            </p>
          )}

          <SubmitButton>Salvar</SubmitButton>
        </form>
      </Card>
    </div>
  );
}
