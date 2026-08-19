"use client";

import { useState } from "react";

export default function CopiarLinkButton({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(texto);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      }}
      className="cursor-pointer rounded-lg bg-accent px-3.5 py-[7px] text-[12.5px] font-bold text-accent-foreground"
    >
      {copiado ? "Copiado ✓" : "Copiar link"}
    </button>
  );
}
