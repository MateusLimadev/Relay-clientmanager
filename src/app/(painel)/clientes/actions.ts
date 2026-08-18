"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteCliente, upsertAssinatura, upsertCliente } from "@/lib/mutations";

export async function salvarCliente(formData: FormData) {
  const id = formData.get("id");
  const ehNovoCliente = !(typeof id === "string" && id);

  const cliente = await upsertCliente({
    id: ehNovoCliente ? undefined : (id as string),
    nome: formData.get("nome"),
    telefone: formData.get("telefone"),
  });

  const servidorId = formData.get("servidorId");
  if (ehNovoCliente && typeof servidorId === "string" && servidorId) {
    const login = formData.get("login");
    const valorCliente = formData.get("valorCliente");
    if (!login || !valorCliente) {
      redirect(
        `/clientes?erro=${encodeURIComponent(
          `Cliente "${cliente.nome}" criado, mas a assinatura não — preencha login e valor, ou deixe o servidor em branco pra criar só o cliente.`
        )}`
      );
    }
    await upsertAssinatura({
      clienteId: cliente.id,
      servidorId,
      login,
      valorCliente,
      prazoDias: 30,
    });
    revalidatePath("/assinaturas");
    revalidatePath("/");
    revalidatePath("/vencimentos");
  }

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
