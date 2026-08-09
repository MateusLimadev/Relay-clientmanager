"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { callGas } from "@/lib/gas-client";

export async function salvarAssinatura(formData: FormData) {
  const id = formData.get("id");
  await callGas("upsertAssinatura", {
    id: typeof id === "string" && id ? id : undefined,
    clienteId: formData.get("clienteId"),
    servidorId: formData.get("servidorId"),
    login: formData.get("login"),
    valorCliente: formData.get("valorCliente"),
    custo: formData.get("custo"),
    diaPago: formData.get("diaPago"),
    prazoDias: formData.get("prazoDias"),
    statusManual: formData.get("statusManual") || "",
    observacao: formData.get("observacao") || "",
  });
  revalidatePath("/assinaturas");
  revalidatePath("/");
  revalidatePath("/vencimentos");
  redirect("/assinaturas");
}

export async function cancelarAssinaturaAction(formData: FormData) {
  const id = formData.get("id");
  await callGas("cancelarAssinatura", { id });
  revalidatePath("/assinaturas");
  revalidatePath("/");
  revalidatePath("/vencimentos");
  redirect("/assinaturas");
}

export async function excluirAssinaturaAction(formData: FormData) {
  const id = formData.get("id");
  await callGas("excluirAssinatura", { id });
  revalidatePath("/assinaturas");
  revalidatePath("/");
  revalidatePath("/vencimentos");
  redirect("/assinaturas");
}

export async function registrarPagamentoAction(formData: FormData) {
  const id = formData.get("id");
  const redirectTo = formData.get("redirectTo");
  await callGas("registrarPagamento", { assinaturaId: id });
  revalidatePath("/assinaturas");
  revalidatePath("/");
  revalidatePath("/vencimentos");
  redirect(typeof redirectTo === "string" && redirectTo ? redirectTo : "/vencimentos");
}
