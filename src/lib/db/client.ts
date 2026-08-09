import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL não configurado. Preencha o .env.local.");
}

const queryClient = postgres(connectionString, {
  prepare: false,
  ssl: "require",
  connect_timeout: 10,
});
export const db = drizzle(queryClient, { schema });
