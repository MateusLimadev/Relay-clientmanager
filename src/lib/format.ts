export function formatMoney(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value) || 0
  );
}

export function formatDate(value: string | number): string {
  const str = String(value ?? "");
  if (!str) return "—";
  const [y, m, d] = str.split("-");
  if (!y || !m || !d) return str;
  return `${d}/${m}/${y}`;
}

export function formatDateInput(value: string): string {
  return value || new Date().toISOString().slice(0, 10);
}

/**
 * Extrai só os dígitos de um campo de contato livre e garante o DDI 55.
 * A planilha às vezes guarda telefone como número (Sheets interpretou o
 * valor como numérico), por isso o coerce para string antes de tudo.
 * Números sem DDD (comuns na base migrada) geram um link que abre o
 * WhatsApp mas pode não encontrar o contato — limitação dos dados de origem.
 */
export function phoneDigits(telefone: string | number | null | undefined): string {
  const digits = String(telefone ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55") && digits.length > 11) return digits;
  return `55${digits}`;
}

export function buildWhatsAppLink(
  telefone: string | number | null | undefined,
  mensagem: string
): string | null {
  const digits = phoneDigits(telefone);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(mensagem)}`;
}

export function buildCobrancaLink(
  telefone: string | number | null | undefined,
  nomeCliente: string,
  servidor: string,
  vencimento: string,
  valor: number
): string | null {
  const nome = String(nomeCliente ?? "").trim();
  const primeiroNome = nome.split(/\s+/)[0] || nome;
  const mensagem = `Olá ${primeiroNome}, sua assinatura ${servidor} vence em ${formatDate(
    vencimento
  )} no valor de ${formatMoney(valor)}. Podemos renovar?`;
  return buildWhatsAppLink(telefone, mensagem);
}
