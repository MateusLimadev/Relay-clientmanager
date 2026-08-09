"use client";

import { Card, PageHeader } from "@/components/ui";

export default function PainelError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div>
      <PageHeader title="Não foi possível carregar os dados" />
      <Card className="max-w-xl" style={{ borderColor: "var(--danger-soft)" }}>
        <p className="text-[13.5px] text-text-value">{error.message}</p>
        <p className="mt-3 text-[13px] text-text-muted">
          Confira se <code>DATABASE_URL</code> está correto no <code>.env.local</code> e se o banco
          Supabase está acessível.
        </p>
        <button
          onClick={() => reset()}
          className="mt-5 rounded-[10px] border border-border px-5 py-2.5 text-[13.5px] font-semibold text-text hover:bg-border-soft"
        >
          Tentar novamente
        </button>
      </Card>
    </div>
  );
}
