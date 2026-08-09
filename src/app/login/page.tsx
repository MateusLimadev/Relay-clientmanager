"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { login } from "./actions";
import { LogoMark } from "@/components/Logo";
import { IconEye, IconEyeOff } from "@/components/icons";

function RadarRings() {
  const delays = [0, 0.85, 1.7];
  return (
    <div className="absolute top-1/2 left-1/2 h-px w-px">
      {delays.map((delay) => (
        <div
          key={delay}
          style={{
            width: 220,
            height: 220,
            margin: -110,
            border: "1px solid var(--accent-glow)",
            animation: "relayRing 2.6s ease-out infinite",
            animationDelay: `${delay}s`,
          }}
          className="absolute top-0 left-0 rounded-full"
        />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state?.error || !cardRef.current) return;
    const el = cardRef.current;
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "shakeX 0.4s ease";
  }, [state]);

  return (
    <div
      style={{ background: "#0b0e14" }}
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-6"
    >
      <RadarRings />

      <div
        style={{ animation: "fadeIn 0.6s ease" }}
        className="relative z-[1] flex w-full max-w-[380px] flex-col items-center"
      >
        <div style={{ animation: "relayPulse 3s ease-in-out infinite", marginBottom: 18 }}>
          <LogoMark size={64} glow />
        </div>

        <div className="font-heading text-[26px] font-semibold tracking-tight text-[#f2f4f7] mb-1.5">Relay</div>
        <div className="mb-8 text-center text-[13.5px] text-[#8993a8]">Acesso restrito ao proprietário</div>

        <div
          ref={cardRef}
          style={{ animation: "cardIn 0.55s ease 0.1s both", background: "#131824", border: "1px solid #1f2530" }}
          className="w-full rounded-2xl px-[26px] py-7"
        >
          <form action={action}>
            <div className="mb-3.5 text-[12.5px] font-bold uppercase tracking-wider text-[#5b6478]">
              Senha de acesso
            </div>

            <div className={`relative ${state?.error ? "mb-2.5" : "mb-[18px]"}`}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                autoFocus
                style={{
                  background: "#0f131b",
                  border: `1px solid ${state?.error ? "var(--danger)" : "#1f2530"}`,
                  color: "#f2f4f7",
                }}
                className="w-full rounded-[10px] py-[13px] pl-3.5 pr-11 text-[15px] tracking-wide outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                style={{ color: "#5b6478" }}
                className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center justify-center p-1"
              >
                {showPassword ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>

            {state?.error && (
              <div style={{ color: "var(--danger-text)" }} className="mb-3.5 text-[12.5px]">
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              style={{ background: "var(--accent)", color: "#0b0e14" }}
              className="w-full rounded-[10px] py-[13px] text-[14.5px] font-bold disabled:opacity-70"
            >
              {pending ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>

        <div className="mt-[26px] text-xs text-[#3d4454]">Relay · painel de gestão IPTV</div>
      </div>
    </div>
  );
}
