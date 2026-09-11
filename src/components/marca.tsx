import { cn } from "@/lib/utils";

/**
 * Marca Docfly — wordmark limpo: peso tipográfico, acento em cor e um
 * brilho discreto que passa devagar. Nada de efeitos exagerados.
 */
export function Marca({
  className,
  tamanho = "md",
}: {
  className?: string;
  tamanho?: "sm" | "md" | "lg";
}) {
  const tamanhos = {
    sm: "text-lg sm:text-xl",
    md: "text-2xl sm:text-3xl",
    lg: "text-4xl sm:text-6xl",
  } as const;

  return (
    <span
      aria-label="Docfly"
      role="img"
      className={cn(
        "docfly-marca select-none font-semibold tracking-tight text-foreground",
        tamanhos[tamanho],
        className,
      )}
    >
      <span aria-hidden>Doc</span>
      <span aria-hidden className="text-primary">
        fly
      </span>
      <span aria-hidden className="docfly-ponto" />
    </span>
  );
}
