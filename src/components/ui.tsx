import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import NotifBell from "@/components/NotifBell";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-heading text-[26px] font-semibold tracking-tight text-text">{title}</h1>
        {subtitle && <p className="mt-1 text-[13.5px] text-text-secondary">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {action}
        <NotifBell className="hidden md:block" />
      </div>
    </div>
  );
}

export function Card({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div style={style} className={`rounded-[14px] border border-border bg-card p-[18px] ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, hint, valueClassName = "" }: { label: string; value: string; hint?: string; valueClassName?: string }) {
  return (
    <Card>
      <p className="text-[13px] text-text-secondary">{label}</p>
      <p className={`mt-2 font-heading text-[25px] font-semibold text-text ${valueClassName}`}>{value}</p>
      {hint && <p className="mt-[3px] text-xs text-text-muted">{hint}</p>}
    </Card>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[14px] border border-dashed border-border p-12 text-center text-[13.5px] text-text-secondary">
      {message}
    </div>
  );
}

export function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-[10px] bg-accent px-[18px] py-2.5 text-[13.5px] font-bold text-accent-foreground transition-opacity hover:opacity-90"
    >
      {children}
    </Link>
  );
}

export const inputClass =
  "w-full rounded-[10px] border border-border bg-card px-3.5 py-[11px] text-[13.5px] text-text outline-none transition-colors focus:border-accent";

export const labelClass = "block text-[13px] font-semibold text-text-secondary mb-1.5";

export function SubmitButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="submit"
      className="rounded-[10px] bg-accent px-5 py-2.5 text-[13.5px] font-bold text-accent-foreground transition-opacity hover:opacity-90"
    >
      {children}
    </button>
  );
}
