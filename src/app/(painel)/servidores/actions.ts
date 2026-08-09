"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { callGas } from "@/lib/gas-client";

export async function salvarServidor(formData: FormData) {
  const id = formData.get("id");
  await callGas("upsertServidor", {
    id: typeof id === "string" && id ? id : undefined,
    nome: formData.get("nome"),
    status: formData.get("status"),
  });
  revalidatePath("/servidores");
  redirect("/servidores");
}

export async function excluirServidor(formData: FormData) {
  const id = formData.get("id");
  try {
    await callGas("deleteServidor", { id });
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "Não foi possível excluir.";
    redirect(`/servidores?erro=${encodeURIComponent(mensagem)}`);
  }
  revalidatePath("/servidores");
  redirect("/servidores");
}
