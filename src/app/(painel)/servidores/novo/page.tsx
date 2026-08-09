import { PageHeader } from "@/components/ui";
import ServidorForm from "../ServidorForm";

export default function NovoServidorPage() {
  return (
    <div>
      <PageHeader title="Novo servidor" />
      <ServidorForm />
    </div>
  );
}
