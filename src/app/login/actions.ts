"use server";

import { redirect } from "next/navigation";
import { createSession } from "@/lib/session";

export type LoginState = { error?: string } | undefined;

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const password = formData.get("password");

  if (typeof password !== "string" || !password) {
    return { error: "Informe a senha." };
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return { error: "ADMIN_PASSWORD não configurado no servidor." };
  }

  if (password !== adminPassword) {
    return { error: "Senha incorreta." };
  }

  await createSession();
  redirect("/");
}
