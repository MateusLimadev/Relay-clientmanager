"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteCliente, upsertCliente } from "@/lib/mutations";

export async function salvarCliente(formData: FormData) {
  const id = formData.get("id");
  await upsertCliente({
    id: typeof id === "string" && id ? id : undefined,
    nome: formData.get("nome"),
    telefone: formData.get("telefone"),
  });
  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function excluirCliente(formData: FormData) {
  const id = String(formData.get("id"));
  try {
    await deleteCliente(id);
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "Não foi possível excluir.";
    redirect(`/clientes?erro=${encodeURIComponent(mensagem)}`);
  }
  revalidatePath("/clientes");
  redirect("/clientes");
}
