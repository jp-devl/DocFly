import { cn } from "@/lib/utils";

/**
 * Marca VOZA — letreiro em estilo "worm": letras tubulares, arredondadas,
 * sem contra-formas duras, muito espaçadas e em caixa alta.
 */
export function Marca({
  className,
  tamanho = "md",
}: {
  className?: string;
  tamanho?: "sm" | "md" | "lg";
}) {
  const tamanhos = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-5xl sm:text-6xl",
  } as const;

  return (
    <span
      aria-label="VOZA"
      className={cn(
        "select-none font-marca font-medium uppercase leading-none tracking-[0.06em] text-primary",
        tamanhos[tamanho],
        className,
      )}
    >
      voza
    </span>
  );
}
