"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  cancelarAssinatura,
  excluirAssinatura,
  registrarPagamento,
  upsertAssinatura,
} from "@/lib/mutations";

export async function salvarAssinatura(formData: FormData) {
  const id = formData.get("id");
  await upsertAssinatura({
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
  const id = String(formData.get("id"));
  await cancelarAssinatura(id);
  revalidatePath("/assinaturas");
  revalidatePath("/");
  revalidatePath("/vencimentos");
  redirect("/assinaturas");
}

export async function excluirAssinaturaAction(formData: FormData) {
  const id = String(formData.get("id"));
  await excluirAssinatura(id);
  revalidatePath("/assinaturas");
  revalidatePath("/");
  revalidatePath("/vencimentos");
  redirect("/assinaturas");
}

export async function registrarPagamentoAction(formData: FormData) {
  const id = formData.get("id");
  const redirectTo = formData.get("redirectTo");
  const vencimento = formData.get("vencimento");
  await registrarPagamento({
    assinaturaId: id,
    vencimento: typeof vencimento === "string" && vencimento ? vencimento : undefined,
  });
  revalidatePath("/assinaturas");
  revalidatePath("/");
  revalidatePath("/vencimentos");
  redirect(typeof redirectTo === "string" && redirectTo ? redirectTo : "/vencimentos");
}
