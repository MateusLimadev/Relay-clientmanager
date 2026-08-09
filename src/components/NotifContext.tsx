"use client";

import { createContext, useContext, type ReactNode } from "react";

export type NotifItem = {
  client: string;
  server: string;
  dueLabel: string;
  badgeLabel: string;
  tone: "danger" | "warning" | "accent";
};

type NotifData = { items: NotifItem[]; urgentCount: number };

const NotifContext = createContext<NotifData>({ items: [], urgentCount: 0 });

export function NotifProvider({ items, urgentCount, children }: NotifData & { children: ReactNode }) {
  return <NotifContext.Provider value={{ items, urgentCount }}>{children}</NotifContext.Provider>;
}

export function useNotif() {
  return useContext(NotifContext);
}
