import "server-only";
import { callGas } from "@/lib/gas-client";
import type {
  Assinatura,
  Cliente,
  Dashboard,
  Pagamento,
  PagamentoCliente,
  Servidor,
  Vencimentos,
} from "@/lib/types";

export const getServidores = () => callGas<Servidor[]>("listServidores");
export const getClientes = () => callGas<Cliente[]>("listClientes");

export const getAssinaturas = (filtro: Record<string, string> = {}) =>
  callGas<Assinatura[]>("listAssinaturas", filtro);

export const getAssinatura = (id: string) => callGas<Assinatura>("getAssinatura", { id });

export const getDashboard = () => callGas<Dashboard>("getDashboard");

export const getVencimentos = () => callGas<Vencimentos>("getVencimentos");

export const getPagamentos = (assinaturaId?: string) =>
  callGas<Pagamento[]>("listPagamentos", { assinaturaId });

export const getPagamentosCliente = (clienteId: string) =>
  callGas<PagamentoCliente[]>("listPagamentosCliente", { clienteId });
