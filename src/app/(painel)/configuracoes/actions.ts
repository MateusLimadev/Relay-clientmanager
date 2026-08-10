"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { atualizarSettings } from "@/lib/mutations";

export async function salvarConfiguracoes(formData: FormData) {
  await atualizarSettings({
    cobrancaAutomaticaAtiva: formData.get("cobrancaAutomaticaAtiva") === "on",
  });
  revalidatePath("/configuracoes");
  redirect("/configuracoes");
}
