import { pgTable, text, uuid, numeric, date, integer, timestamp } from "drizzle-orm/pg-core";

export const servidores = pgTable("servidores", {
  id: uuid("id").primaryKey(),
  nome: text("nome").notNull(),
  status: text("status", { enum: ["ativo", "manutencao", "offline"] })
    .notNull()
    .default("ativo"),
  criadoEm: timestamp("criado_em", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

export const clientes = pgTable("clientes", {
  id: uuid("id").primaryKey(),
  nome: text("nome").notNull(),
  telefone: text("telefone").notNull().default(""),
  criadoEm: timestamp("criado_em", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

export const assinaturas = pgTable("assinaturas", {
  id: uuid("id").primaryKey(),
  clienteId: uuid("cliente_id")
    .notNull()
    .references(() => clientes.id),
  servidorId: uuid("servidor_id")
    .notNull()
    .references(() => servidores.id),
  login: text("login").notNull(),
  valorCliente: numeric("valor_cliente", { precision: 10, scale: 2, mode: "number" }).notNull(),
  custo: numeric("custo", { precision: 10, scale: 2, mode: "number" }).notNull().default(0),
  diaPago: date("dia_pago", { mode: "string" }).notNull(),
  prazoDias: integer("prazo_dias").notNull().default(30),
  vencimento: date("vencimento", { mode: "string" }).notNull(),
  statusManual: text("status_manual").notNull().default(""),
  observacao: text("observacao").notNull().default(""),
  criadoEm: timestamp("criado_em", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});

export const pagamentos = pgTable("pagamentos", {
  id: uuid("id").primaryKey(),
  assinaturaId: uuid("assinatura_id")
    .notNull()
    .references(() => assinaturas.id, { onDelete: "cascade" }),
  data: date("data", { mode: "string" }).notNull(),
  valor: numeric("valor", { precision: 10, scale: 2, mode: "number" }).notNull(),
  criadoEm: timestamp("criado_em", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});
