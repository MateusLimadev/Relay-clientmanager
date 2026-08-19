export type StatusServidor = "ativo" | "manutencao" | "offline";

export type Servidor = {
  id: string;
  nome: string;
  status: StatusServidor;
  criadoEm: string;
};

export type Cliente = {
  id: string;
  nome: string;
  telefone: string;
  criadoEm: string;
  totalAssinaturas?: number;
};

export type StatusAssinatura = "ativa" | "vencida" | "cancelada" | "teste" | "gratuita";

export type Assinatura = {
  id: string;
  clienteId: string;
  servidorId: string;
  login: string;
  valorCliente: number;
  custo: number;
  diaPago: string;
  prazoDias: number;
  vencimento: string;
  statusManual: string;
  observacao: string;
  criadoEm: string;
  atualizadoEm: string;
  clienteNome: string;
  servidorNome: string;
  lucro: number;
  status: StatusAssinatura;
};

export type Pagamento = {
  id: string;
  assinaturaId: string;
  data: string;
  valor: number;
  criadoEm: string;
};

export type PagamentoCliente = {
  id: string;
  data: string;
  valor: number;
  servidorNome: string;
  login: string;
};

/** Linha unificada do Histórico de pagamentos — vem de `pagamentos` (por assinatura) ou de um pedido personalizado pago. */
export type HistoricoPagamento = {
  id: string;
  data: string;
  valor: number;
  clienteNome: string;
  origem: "assinatura" | "personalizado";
  detalhe: string;
};

export type CobrancaPendente = {
  id: string;
  tipo: "assinatura" | "personalizado";
  clienteNome: string;
  descricao: string;
  valor: number;
  copiaECola: string;
  ticketUrl: string | null;
  criadoEm: string;
};

export type Vencimentos = {
  vencidas: Assinatura[];
  hoje: Assinatura[];
  proximos7dias: Assinatura[];
};

export type PorServidor = {
  servidor: string;
  assinaturas: number;
  receita: number;
  custo: number;
  lucro: number;
  margem: number;
};

export type Dashboard = {
  totais: {
    receita: number;
    custo: number;
    lucro: number;
    margem: number;
    assinaturasAtivas: number;
    clientesUnicos: number;
    inadimplencia: number;
    inadimplentesCount: number;
  };
  gratuitos: {
    quantidade: number;
    custo: number;
  };
  porServidor: PorServidor[];
  vencimentos: {
    vencidas: number;
    hoje: number;
    proximos7dias: number;
  };
};
