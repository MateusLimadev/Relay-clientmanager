import { notFound } from "next/navigation";
import { getClientes } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import ClienteForm from "../../ClienteForm";

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clientes = await getClientes();
  const cliente = clientes.find((c) => c.id === id);
  if (!cliente) notFound();

  return (
    <div>
      <PageHeader title={`Editar cliente: ${cliente.nome}`} />
      <ClienteForm cliente={cliente} />
    </div>
  );
}
