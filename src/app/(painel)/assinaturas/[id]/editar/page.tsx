import { notFound } from "next/navigation";
import { getAssinatura } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import AssinaturaForm from "../../AssinaturaForm";
import { GasError } from "@/lib/gas-client";
import type { Assinatura } from "@/lib/types";

async function carregarAssinatura(id: string): Promise<Assinatura> {
  try {
    return await getAssinatura(id);
  } catch (err) {
    if (err instanceof GasError) notFound();
    throw err;
  }
}

export default async function EditarAssinaturaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const assinatura = await carregarAssinatura(id);

  return (
    <div>
      <PageHeader title={`Editar assinatura: ${assinatura.clienteNome} · ${assinatura.servidorNome}`} />
      <AssinaturaForm assinatura={assinatura} />
    </div>
  );
}
