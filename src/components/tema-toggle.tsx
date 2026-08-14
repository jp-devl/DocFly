import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const CHAVE = "voza-tema";

export function TemaToggle({ className = "" }: { className?: string }) {
  const [escuro, setEscuro] = useState(false);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    const salvo = localStorage.getItem(CHAVE);
    const inicial =
      salvo === "escuro" ||
      (salvo === null && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setEscuro(inicial);
    document.documentElement.classList.toggle("dark", inicial);
    setPronto(true);
  }, []);

  function alternar() {
    const proximo = !escuro;
    setEscuro(proximo);
    document.documentElement.classList.toggle("dark", proximo);
    localStorage.setItem(CHAVE, proximo ? "escuro" : "claro");
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={escuro ? "Ativar modo claro" : "Ativar modo escuro"}
      onClick={alternar}
      className={`relative size-9 overflow-hidden rounded-xl border-border/80 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-95 ${className}`}
    >
      <Sun
        className={`absolute size-4 transition-all duration-500 ${
          pronto && escuro ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
        }`}
      />
      <Moon
        className={`absolute size-4 transition-all duration-500 ${
          pronto && escuro ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
        }`}
      />
    </Button>
  );
}
