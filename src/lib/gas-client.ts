import "server-only";

type GasResponse<T> = { ok: true; data: T } | { ok: false; error: string };

export class GasError extends Error {}

export async function callGas<T = unknown>(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<T> {
  const url = process.env.SHEETS_API_URL;
  const token = process.env.SHEETS_API_TOKEN;
  if (!url || !token) {
    throw new GasError(
      "SHEETS_API_URL / SHEETS_API_TOKEN não configurados. Preencha o .env.local."
    );
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, action, payload }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new GasError(`Falha ao chamar a API (${res.status}): ${await res.text()}`);
  }

  const json = (await res.json()) as GasResponse<T>;
  if (!json.ok) {
    throw new GasError(json.error);
  }
  return json.data;
}
