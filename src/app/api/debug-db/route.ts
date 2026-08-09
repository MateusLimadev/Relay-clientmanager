import { NextResponse } from "next/server";

/**
 * Endpoint temporário de diagnóstico — remover depois de descobrir o
 * problema de conexão em produção. Não expõe a connection string, só o
 * resultado da tentativa de conexão.
 */
export async function GET() {
  const startedAt = Date.now();
  try {
    const postgres = (await import("postgres")).default;
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      return NextResponse.json({ ok: false, error: "DATABASE_URL não definido no ambiente." });
    }

    const sql = postgres(connectionString, {
      prepare: false,
      ssl: "require",
      connect_timeout: 8,
    });

    const result = await sql`select 1 as ok, now() as server_time`;
    await sql.end({ timeout: 1 });

    return NextResponse.json({
      ok: true,
      ms: Date.now() - startedAt,
      result,
      host: new URL(connectionString).host,
    });
  } catch (err) {
    const e = err as Error & { code?: string; errno?: string };
    return NextResponse.json({
      ok: false,
      ms: Date.now() - startedAt,
      name: e?.name,
      message: e?.message,
      code: e?.code,
      errno: e?.errno,
    });
  }
}
