import { requireSession } from "@/lib/dal";
import { getVencimentos } from "@/lib/data";
import { formatDate } from "@/lib/format";
import Nav from "@/components/Nav";
import { NotifProvider, type NotifItem } from "@/components/NotifContext";
import type { Assinatura } from "@/lib/types";

function toNotifItems(
  vencidas: Assinatura[],
  hoje: Assinatura[],
  prox7: Assinatura[]
): NotifItem[] {
  const grupos: [Assinatura[], string, NotifItem["tone"]][] = [
    [vencidas, "Vencida", "danger"],
    [hoje, "Vence hoje", "warning"],
    [prox7, "Próx. 7 dias", "accent"],
  ];
  const items: NotifItem[] = [];
  for (const [lista, badgeLabel, tone] of grupos) {
    for (const a of lista) {
      items.push({
        client: a.clienteNome,
        server: a.servidorNome,
        dueLabel: formatDate(a.vencimento),
        badgeLabel,
        tone,
      });
      if (items.length >= 6) return items;
    }
  }
  return items;
}

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  const venc = await getVencimentos();
  const urgentCount = venc.vencidas.length + venc.hoje.length;
  const notifItems = toNotifItems(venc.vencidas, venc.hoje, venc.proximos7dias);

  return (
    <NotifProvider items={notifItems} urgentCount={urgentCount}>
      <div className="flex flex-1 flex-col md:flex-row bg-bg">
        <Nav urgentCount={urgentCount} />
        <main className="flex-1 min-w-0 pt-[74px] pb-[84px] px-4 md:pt-8 md:pb-8 md:px-8">
          <div className="mx-auto w-full max-w-[1160px]">{children}</div>
        </main>
      </div>
    </NotifProvider>
  );
}
