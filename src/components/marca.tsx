import { cn } from "@/lib/utils";

/**
 * Marca VOZA — letreiro graffiti/street 3D com efeito de "elevação infinita":
 * cópias do próprio letreiro viajam em perspectiva atrás do logo principal,
 * criando um túnel visual em loop contínuo.
 */
const CAMADAS = [
  { atraso: "0s", cor: "text-foreground/70" },
  { atraso: "-0.9s", cor: "text-primary/70" },
  { atraso: "-1.8s", cor: "text-foreground/60" },
  { atraso: "-2.7s", cor: "text-primary/55" },
  { atraso: "-3.6s", cor: "text-foreground/45" },
  { atraso: "-4.5s", cor: "text-primary/40" },
];

export function Marca({
  className,
  tamanho = "md",
}: {
  className?: string;
  tamanho?: "sm" | "md" | "lg";
}) {
  const tamanhos = {
    sm: "text-base sm:text-lg",
    md: "text-xl sm:text-2xl",
    lg: "text-4xl sm:text-6xl",
  } as const;

  return (
    <span
      aria-label="VOZA"
      role="img"
      className={cn(
        "voza-marca select-none font-marca uppercase tracking-[0.04em]",
        tamanhos[tamanho],
        className,
      )}
    >
      <span aria-hidden className="voza-camadas">
        {CAMADAS.map((c) => (
          <span
            key={c.atraso}
            className={cn("voza-camada", c.cor)}
            style={{ animationDelay: c.atraso }}
          >
            voza
          </span>
        ))}
      </span>
      <span aria-hidden className="voza-frente">
        voza
      </span>
    </span>
  );
}
