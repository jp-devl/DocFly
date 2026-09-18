import { useEffect, useState } from "react";
import { Check, Mic } from "lucide-react";

const CAMPOS = [
  { rotulo: "Nome", valor: "Ana Carolina Ribeiro", fala: "Fale seu nome completo…" },
  { rotulo: "CPF", valor: "123.456.789-00", fala: "Fale o CPF…" },
  { rotulo: "Empresa", valor: "Studio Aurora Ltda.", fala: "Fale o nome da empresa…" },
];

/** Demonstração animada: um mini contrato sendo preenchido por voz. */
export function DemoVoz() {
  const [etapa, setEtapa] = useState(0);
  const [digitado, setDigitado] = useState("");

  useEffect(() => {
    const atual = CAMPOS[etapa % CAMPOS.length];
    if (!atual) return;
    let i = 0;
    setDigitado("");
    const escrever = window.setInterval(() => {
      i += 1;
      setDigitado(atual.valor.slice(0, i));
      if (i >= atual.valor.length) window.clearInterval(escrever);
    }, 55);
    const proximo = window.setTimeout(() => setEtapa((e) => e + 1), 4200);
    return () => {
      window.clearInterval(escrever);
      window.clearTimeout(proximo);
    };
  }, [etapa]);

  const indiceAtivo = etapa % CAMPOS.length;
  const ciclo = Math.floor(etapa / CAMPOS.length);

  return (
    <div className="animate-fade-in relative rounded-3xl border border-border/70 bg-card p-5 shadow-[0_24px_60px_-32px_rgba(0,0,0,0.35)] sm:p-7">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Contrato de prestação
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
          <span className="relative flex size-1.5">
            <span className="voza-mic-onda !inset-[-3px]" aria-hidden />
            <span className="size-1.5 rounded-full bg-primary" />
          </span>
          Ouvindo
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {CAMPOS.map((campo, i) => {
          const ativo = i === indiceAtivo;
          const pronto = ciclo > 0 || i < indiceAtivo;
          return (
            <div key={campo.rotulo}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {campo.rotulo}
                </span>
                {pronto && !ativo && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                    <Check className="size-3" /> preenchido
                  </span>
                )}
              </div>
              <div
                className={`mt-1.5 min-h-9 rounded-xl border px-3 py-2 text-sm transition-all duration-300 ${
                  ativo
                    ? "border-primary/45 bg-primary/5 text-foreground shadow-sm"
                    : pronto
                      ? "border-border/70 bg-background text-foreground"
                      : "border-dashed border-border bg-muted/40 text-muted-foreground"
                }`}
              >
                {ativo ? (
                  <>
                    {digitado}
                    <span className="terminal-cursor ml-0.5 inline-block h-4 w-px translate-y-0.5 bg-primary" />
                  </>
                ) : pronto ? (
                  campo.valor
                ) : (
                  <span className="opacity-60">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-2xl bg-muted/60 px-4 py-3">
        <span className="relative grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
          <span className="voza-mic-onda" aria-hidden />
          <Mic className="relative size-4" />
        </span>
        <p className="min-w-0 truncate text-sm text-muted-foreground">
          {CAMPOS[indiceAtivo]?.fala}
        </p>
      </div>
    </div>
  );
}
