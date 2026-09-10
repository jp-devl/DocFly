import { useEffect, useState } from "react";

/** Feedback discreto de conclusão: aparece, marca o check e some sozinho. */
export function SucessoFlash({
  mensagem,
  aoFim,
}: {
  mensagem: string | null;
  aoFim?: () => void;
}) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (!mensagem) return;
    setVisivel(true);
    const t = setTimeout(() => {
      setVisivel(false);
      aoFim?.();
    }, 1800);
    return () => clearTimeout(t);
  }, [mensagem, aoFim]);

  if (!mensagem || !visivel) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4"
    >
      <div className="voza-sucesso flex items-center gap-2.5 rounded-full border border-primary/25 bg-card/95 px-4 py-2 shadow-xl backdrop-blur">
        <span className="grid size-6 place-items-center rounded-full bg-primary/15 text-primary">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden>
            <path
              className="voza-check-traco"
              d="M5 12.5l4.5 4.5L19 7"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <p className="text-sm font-semibold text-foreground">{mensagem}</p>
      </div>
    </div>
  );
}
