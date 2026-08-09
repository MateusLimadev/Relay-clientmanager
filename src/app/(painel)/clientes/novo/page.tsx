import { PageHeader } from "@/components/ui";
import ClienteForm from "../ClienteForm";

export default function NovoClientePage() {
  return (
    <div>
      <PageHeader title="Novo cliente" />
      <ClienteForm />
    </div>
  );
}
