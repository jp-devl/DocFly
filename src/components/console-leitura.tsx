import { useEffect, useRef, useState } from "react";

type Props = {
  /** Nome do arquivo sendo lido. */
  arquivo: string;
  /** Etapa atual vinda do fluxo de upload. */
  etapa: string;
};

const LINHAS_BASE = [
  "$ vozforma read --input \"{arquivo}\"",
  "→ inicializando leitor de documentos…",
  "→ verificando integridade do arquivo… ok",
  "→ extraindo camada de texto…",
  "→ tokenizando parágrafos [■■■■■■■■■■] 100%",
  "→ detectando lacunas e rótulos…",
  "→ agrupando campos por seção…",
  "→ inferindo tipos (texto · número · data · opção)…",
  "→ compilando formulário de voz…",
  "✓ pronto para falar",
];

export function ConsoleLeitura({ arquivo, etapa }: Props) {
  const [linhas, setLinhas] = useState<string[]>([]);
  const [parcial, setParcial] = useState("");
  const [segundos, setSegundos] = useState(0);
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let indice = 0;
    let letra = 0;
    let ativo = true;

    const tick = () => {
      if (!ativo) return;
      const bruta = LINHAS_BASE[indice % LINHAS_BASE.length]!.replace("{arquivo}", arquivo);
      letra += 1;
      if (letra <= bruta.length) {
        setParcial(bruta.slice(0, letra));
        window.setTimeout(tick, 16 + Math.random() * 22);
      } else {
        setLinhas((l) => [...l.slice(-14), bruta]);
        setParcial("");
        letra = 0;
        indice += 1;
        window.setTimeout(tick, 320);
      }
    };
    const inicio = window.setTimeout(tick, 200);
    const relogio = window.setInterval(() => setSegundos((s) => s + 1), 1000);

    return () => {
      ativo = false;
      window.clearTimeout(inicio);
      window.clearInterval(relogio);
    };
  }, [arquivo]);

  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end" });
  }, [linhas, parcial]);

  return (
    <div className="animate-fade-in overflow-hidden rounded-2xl border border-terminal-border bg-terminal shadow-[0_20px_60px_-25px_var(--terminal-glow)]">
      <div className="flex items-center gap-2 border-b border-terminal-border px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-destructive/70" />
        <span className="size-2.5 rounded-full bg-terminal-warn/70" />
        <span className="size-2.5 rounded-full bg-terminal-accent/70" />
        <span className="ml-2 truncate font-mono text-[11px] text-terminal-muted">
          vozforma · leitor — {arquivo}
        </span>
        <span className="ml-auto font-mono text-[11px] tabular-nums text-terminal-muted">
          {String(Math.floor(segundos / 60)).padStart(2, "0")}:
          {String(segundos % 60).padStart(2, "0")}
        </span>
      </div>

      <div className="relative">
        <div className="terminal-scan pointer-events-none absolute inset-0" />
        <div className="h-56 space-y-1 overflow-hidden px-4 py-4 font-mono text-[12px] leading-relaxed">
          {linhas.map((l, i) => (
            <p
              key={`${l}-${i}`}
              className={
                l.startsWith("✓")
                  ? "text-terminal-accent"
                  : l.startsWith("$")
                    ? "text-terminal-foreground"
                    : "text-terminal-muted"
              }
            >
              {l}
            </p>
          ))}
          {parcial && (
            <p className="text-terminal-foreground">
              {parcial}
              <span className="terminal-cursor ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 bg-terminal-accent" />
            </p>
          )}
          <div ref={fim} />
        </div>
      </div>

      <div className="border-t border-terminal-border px-4 py-3">
        <div className="flex items-center justify-between font-mono text-[11px] text-terminal-muted">
          <span className="text-terminal-accent">{etapa || "processando…"}</span>
          <span>não feche esta página</span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-terminal-border">
          <div className="terminal-progress h-full w-1/3 rounded-full bg-terminal-accent" />
        </div>
      </div>
    </div>
  );
}
