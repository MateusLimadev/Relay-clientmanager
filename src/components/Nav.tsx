"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/(painel)/logout-action";
import Logo, { LogoMark } from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import NotifBell from "@/components/NotifBell";
import {
  IconDashboard,
  IconAssinaturas,
  IconVencimentos,
  IconClientes,
  IconServidores,
  IconDots,
} from "@/components/icons";

const LINKS = [
  { href: "/", label: "Dashboard", mobileLabel: "Painel", Icon: IconDashboard },
  { href: "/assinaturas", label: "Assinaturas", mobileLabel: "Assinaturas", Icon: IconAssinaturas },
  { href: "/vencimentos", label: "Vencimentos", mobileLabel: "Prazos", Icon: IconVencimentos, urgent: true },
  { href: "/clientes", label: "Clientes", mobileLabel: "Clientes", Icon: IconClientes },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function Nav({ urgentCount }: { urgentCount: number }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex md:h-screen md:w-[252px] md:flex-shrink-0 md:flex-col md:sticky md:top-0 border-r border-border-soft bg-panel p-4 pt-[22px] pb-[22px]">
        <div className="flex items-center justify-between gap-2.5 px-2 pb-[26px]">
          <Logo />
          <ThemeToggle className="!h-[30px] !w-[30px] rounded-lg border border-border bg-card" />
        </div>

        <nav className="flex flex-1 flex-col gap-0.5">
          {LINKS.map(({ href, label, Icon, urgent }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-[11px] rounded-[9px] px-3 py-2.5 text-[14px] font-semibold"
                style={{
                  background: active ? "var(--accent-soft)" : "transparent",
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                }}
              >
                <Icon size={18} />
                {label}
                {urgent && urgentCount > 0 && (
                  <span
                    style={{ background: "var(--danger)" }}
                    className="ml-auto rounded-full px-[7px] py-px text-[10.5px] font-bold text-white"
                  >
                    {urgentCount}
                  </span>
                )}
              </Link>
            );
          })}
          <Link
            href="/servidores"
            className="flex items-center gap-[11px] rounded-[9px] px-3 py-2.5 text-[14px] font-semibold"
            style={{
              background: isActive(pathname, "/servidores") ? "var(--accent-soft)" : "transparent",
              color: isActive(pathname, "/servidores") ? "var(--accent)" : "var(--text-secondary)",
            }}
          >
            <IconServidores size={18} />
            Servidores
          </Link>
        </nav>

        <div className="mt-2 border-t border-border-soft pt-[14px]">
          <div className="flex items-center gap-[9px] px-2 py-1.5">
            <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full bg-border-soft text-[12px] font-bold text-text-secondary">
              GE
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-text">Gestor</div>
              <div className="text-[11.5px] text-text-muted">Relay</div>
            </div>
          </div>
          <form action={logout}>
            <button type="submit" className="mt-1 w-full rounded-[9px] px-3 py-2 text-left text-[13px] font-medium text-text-muted hover:bg-border-soft">
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* Top bar — mobile */}
      <div className="fixed top-0 left-0 right-0 z-30 flex h-[58px] items-center justify-between border-b border-border-soft bg-panel px-3.5 md:hidden">
        <LogoMark size={30} />
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <NotifBell />
        </div>
      </div>

      {/* Bottom tab bar — mobile */}
      <nav
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-border-soft bg-panel md:hidden"
      >
        {LINKS.map(({ href, mobileLabel, Icon, urgent }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              style={{ color: active ? "var(--accent)" : "var(--text-secondary)" }}
              className="relative flex min-w-[48px] flex-col items-center gap-[3px] p-1 text-[10.5px] font-semibold"
            >
              <Icon size={19} />
              {mobileLabel}
              {urgent && urgentCount > 0 && (
                <span
                  style={{ background: "var(--danger)" }}
                  className="absolute top-0 right-1.5 h-[7px] w-[7px] rounded-full"
                />
              )}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          style={{ color: isActive(pathname, "/servidores") ? "var(--accent)" : "var(--text-secondary)" }}
          className="flex min-w-[48px] flex-col items-center gap-[3px] p-1 text-[10.5px] font-semibold"
        >
          <IconDots size={19} />
          Mais
        </button>
      </nav>

      {/* "Mais" sheet — mobile */}
      {moreOpen && (
        <div
          onClick={() => setMoreOpen(false)}
          className="fixed inset-0 z-40 bg-black/55 md:hidden"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-16 left-0 right-0 rounded-t-[18px] border-t border-border-soft bg-panel px-2.5 pt-2.5 pb-[22px]"
          >
            <div className="mx-auto mb-3.5 mt-1.5 h-1 w-9 rounded-full bg-border" />
            <Link
              href="/servidores"
              onClick={() => setMoreOpen(false)}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-[14.5px] font-semibold text-text"
            >
              <IconServidores size={19} />
              Servidores
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left text-[14.5px] font-semibold text-text-muted"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
