import "server-only";
import { phoneDigits } from "@/lib/format";

/**
 * Envia a mensagem de cobrança via WhatsApp Cloud API (Meta), como "template
 * message" — fora da janela de 24h de conversa, só templates pré-aprovados
 * podem ser enviados. O nome/ordem das variáveis do template precisa bater
 * com o que foi submetido pra aprovação (ver README).
 */
export async function enviarTemplateCobranca(
  telefone: string | number | null | undefined,
  params: { nome: string; servidor: string; valorFormatado: string; copiaECola: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || "cobranca_vencimento";

  if (!phoneNumberId || !accessToken) {
    return { ok: false, error: "WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN não configurados." };
  }

  const to = phoneDigits(telefone);
  if (!to) {
    return { ok: false, error: "Cliente sem telefone válido." };
  }

  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: "pt_BR" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: params.nome },
              { type: "text", text: params.servidor },
              { type: "text", text: params.valorFormatado },
              { type: "text", text: params.copiaECola },
            ],
          },
        ],
      },
    }),
  });

  if (!res.ok) {
    return { ok: false, error: `WhatsApp Cloud API falhou (${res.status}): ${await res.text()}` };
  }
  return { ok: true };
}
