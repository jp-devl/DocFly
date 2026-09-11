import { Loader2, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  ouvindo: boolean;
  processando: boolean;
  disabled?: boolean;
  onClick: () => void;
  tamanho?: "sm" | "lg";
  rotulo?: string;
  className?: string;
};

/** Botão de microfone com ondas animadas enquanto o Docfly está ouvindo. */
export function MicBotao({
  ouvindo,
  processando,
  disabled,
  onClick,
  tamanho = "sm",
  rotulo,
  className = "",
}: Props) {
  const grande = tamanho === "lg";
  const icone = grande ? "size-5" : "size-3.5";
  const texto = processando ? "Ouvindo…" : ouvindo ? "Parar" : (rotulo ?? "Falar");

  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      {ouvindo && (
        <>
          <span className="voza-mic-onda" aria-hidden />
          <span className="voza-mic-onda voza-mic-onda-2" aria-hidden />
          <span className="voza-mic-onda voza-mic-onda-3" aria-hidden />
        </>
      )}
      <Button
        type="button"
        size={grande ? "lg" : "sm"}
        variant={ouvindo ? "destructive" : grande ? "default" : "outline"}
        aria-pressed={ouvindo}
        aria-label={ouvindo ? "Parar de ouvir" : (rotulo ?? "Falar")}
        disabled={disabled}
        onClick={onClick}
        className={`relative z-10 gap-2 rounded-full shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-95 ${
          grande ? "px-6" : "h-8 px-3 text-xs"
        } ${ouvindo ? "voza-mic-ouvindo ring-2 ring-destructive/35 ring-offset-2 ring-offset-background" : ""}`}
      >
        {processando ? (
          <Loader2 className={`${icone} animate-spin`} />
        ) : ouvindo ? (
          <Square className={icone} />
        ) : (
          <Mic className={icone} />
        )}
        {texto}
        {ouvindo && (
          <span className="ml-0.5 flex items-end gap-0.5" aria-hidden>
            <i className="voza-mic-ouvindo block h-2 w-0.5 rounded-full bg-current" />
            <i
              className="voza-mic-ouvindo block h-3 w-0.5 rounded-full bg-current"
              style={{ animationDelay: "0.2s" }}
            />
            <i
              className="voza-mic-ouvindo block h-1.5 w-0.5 rounded-full bg-current"
              style={{ animationDelay: "0.4s" }}
            />
          </span>
        )}
      </Button>
    </span>
  );
}
