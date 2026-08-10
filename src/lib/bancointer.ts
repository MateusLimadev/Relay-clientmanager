import "server-only";
import https from "node:https";

const BASE_HOST = "cdpj.partners.bancointer.com.br";

/**
 * A API do Banco Inter exige mTLS: além do client_id/secret, todo request
 * precisa apresentar o certificado da aplicação (gerado no portal deles em
 * Conta Digital PJ > API > Certificado). Guardamos o .crt/.key como base64
 * em variáveis de ambiente pra não depender de arquivos no deploy.
 */
function getCertKey() {
  const certB64 = process.env.BANCOINTER_CERT;
  const keyB64 = process.env.BANCOINTER_KEY;
  if (!certB64 || !keyB64) {
    throw new Error("BANCOINTER_CERT / BANCOINTER_KEY não configurados.");
  }
  return { cert: Buffer.from(certB64, "base64"), key: Buffer.from(keyB64, "base64") };
}

function interRequest<T>(options: {
  method: string;
  path: string;
  token?: string;
  body?: string;
  contentType?: string;
}): Promise<T> {
  const { cert, key } = getCertKey();
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        host: BASE_HOST,
        path: options.path,
        method: options.method,
        cert,
        key,
        headers: {
          "Content-Type": options.contentType ?? "application/json",
          ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
          ...(options.body ? { "Content-Length": Buffer.byteLength(options.body) } : {}),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if ((res.statusCode ?? 500) >= 400) {
            reject(new Error(`Banco Inter (${options.path}) falhou (${res.statusCode}): ${data}`));
            return;
          }
          try {
            resolve(data ? (JSON.parse(data) as T) : ({} as T));
          } catch {
            reject(new Error(`Resposta inválida do Banco Inter em ${options.path}: ${data}`));
          }
        });
      }
    );
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function obterToken(): Promise<string> {
  const clientId = process.env.BANCOINTER_CLIENT_ID;
  const clientSecret = process.env.BANCOINTER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("BANCOINTER_CLIENT_ID / BANCOINTER_CLIENT_SECRET não configurados.");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
    scope: "cob.write cob.read webhook.write webhook.read",
  }).toString();

  const json = await interRequest<{ access_token: string }>({
    method: "POST",
    path: "/oauth/v2/token",
    body,
    contentType: "application/x-www-form-urlencoded",
  });
  return json.access_token;
}

/** txid Pix precisa ter entre 26 e 35 caracteres alfanuméricos (regra do BACEN). */
function gerarTxid(referenciaExterna: string): string {
  const limpo = referenciaExterna.replace(/[^a-zA-Z0-9]/g, "");
  const sufixo = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return (limpo + sufixo).slice(0, 35).padEnd(26, "0");
}

export type CobrancaPix = { txid: string; copiaECola: string };

/**
 * Cria uma cobrança Pix imediata na própria conta do Inter cadastrada em
 * BANCOINTER_PIX_KEY. O dinheiro cai direto lá, sem intermediário.
 */
export async function criarCobrancaPix(params: {
  valor: number;
  descricao: string;
  referenciaExterna: string;
}): Promise<CobrancaPix> {
  const chave = process.env.BANCOINTER_PIX_KEY;
  if (!chave) throw new Error("BANCOINTER_PIX_KEY não configurado.");

  const token = await obterToken();
  const txid = gerarTxid(params.referenciaExterna);

  await interRequest({
    method: "PUT",
    path: `/pix/v2/cob/${txid}`,
    token,
    body: JSON.stringify({
      calendario: { expiracao: 86400 },
      valor: { original: params.valor.toFixed(2) },
      chave,
      solicitacaoPagador: params.descricao.slice(0, 140),
    }),
  });

  const cobranca = await interRequest<{ pixCopiaECola: string }>({
    method: "GET",
    path: `/pix/v2/cob/${txid}`,
    token,
  });

  return { txid, copiaECola: cobranca.pixCopiaECola };
}

export async function buscarCobranca(txid: string): Promise<{ status: string }> {
  const token = await obterToken();
  const json = await interRequest<{ status: string }>({
    method: "GET",
    path: `/pix/v2/cob/${txid}`,
    token,
  });
  return { status: json.status };
}
