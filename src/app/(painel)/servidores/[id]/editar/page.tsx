import { notFound } from "next/navigation";
import { getServidores } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import ServidorForm from "../../ServidorForm";

export default async function EditarServidorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const servidores = await getServidores();
  const servidor = servidores.find((s) => s.id === id);
  if (!servidor) notFound();

  return (
    <div>
      <PageHeader title={`Editar servidor: ${servidor.nome}`} />
      <ServidorForm servidor={servidor} />
    </div>
  );
}
