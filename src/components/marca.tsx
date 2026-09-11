import { cn } from "@/lib/utils";

/**
 * Marca DocFly — símbolo de documento em movimento + wordmark.
 * "Doc" em grafite, "Fly" na cor de destaque. Animação discreta:
 * as linhas de velocidade deslizam devagar e o documento flutua de leve.
 */
export function Marca({
  className,
  tamanho = "md",
  tagline = false,
}: {
  className?: string;
  tamanho?: "sm" | "md" | "lg";
  tagline?: boolean;
}) {
  const tamanhos = {
    sm: { texto: "text-lg sm:text-xl", icone: "size-6 sm:size-7", gap: "gap-2" },
    md: { texto: "text-2xl sm:text-3xl", icone: "size-8 sm:size-9", gap: "gap-2.5" },
    lg: { texto: "text-4xl sm:text-5xl", icone: "size-12 sm:size-14", gap: "gap-3" },
  } as const;
  const t = tamanhos[tamanho];

  return (
    <span
      role="img"
      aria-label="DocFly"
      className={cn("docfly-marca inline-flex flex-col", className)}
    >
      <span className={cn("inline-flex items-center", t.gap)}>
        <SimboloDocFly className={cn("docfly-simbolo shrink-0", t.icone)} />
        <span
          className={cn(
            "font-heading font-extrabold leading-none tracking-tight text-foreground",
            t.texto,
          )}
        >
          <span aria-hidden>Doc</span>
          <span aria-hidden className="text-primary">
            Fly
          </span>
        </span>
      </span>
      {tagline && (
        <span className="mt-1.5 pl-1 text-[0.62em] font-medium leading-none text-muted-foreground">
          Documentos. Sua voz. Pronto.
        </span>
      )}
    </span>
  );
}

/** Documento inclinado com rastro de velocidade — o arquivo "voando" pelo processo. */
export function SimboloDocFly({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 40" fill="none" aria-hidden className={className}>
      <g className="docfly-linhas" stroke="var(--primary)" strokeWidth="3.4" strokeLinecap="round">
        <line x1="2" y1="13" x2="12" y2="13" opacity="0.95" />
        <line x1="4" y1="21" x2="10" y2="21" opacity="0.6" />
        <line x1="2" y1="29" x2="12" y2="29" opacity="0.85" />
      </g>
      <g className="docfly-doc">
        <path
          d="M22.5 6.5h13.2c1.6 0 2.9 1.3 2.9 2.9v16.4c0 1.6-1.3 2.9-2.9 2.9H22.5c-1.6 0-2.9-1.3-2.9-2.9V9.4c0-1.6 1.3-2.9 2.9-2.9Z"
          transform="rotate(-9 29 18)"
          fill="currentColor"
        />
        <path
          d="M33 6.5h2.7c1.6 0 2.9 1.3 2.9 2.9v2.7L33 6.5Z"
          transform="rotate(-9 29 18)"
          fill="var(--primary)"
        />
      </g>
      <path
        d="M14 34c8.5-1.4 17.5-5 27-11.6-3.4 8.6-10.6 13.7-21.4 15.1L14 34Z"
        fill="var(--primary)"
      />
    </svg>
  );
}
