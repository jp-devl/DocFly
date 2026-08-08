export type TipoCampo = "texto" | "numero" | "data" | "opcao" | "simnao";

export type Campo = {
  chave: string;
  rotulo: string;
  tipo: TipoCampo;
  opcoes?: string[];
  longo?: boolean;
};

export type Secao = {
  id: string;
  titulo: string;
  dica: string;
  campos: Campo[];
};

export type Estrutura = Secao[];

export type Valores = Record<string, string>;

const TIPOS: TipoCampo[] = ["texto", "numero", "data", "opcao", "simnao"];

function slug(input: string, fallback: string) {
  const base = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return base || fallback;
}

/** Normaliza a estrutura vinda da IA ou do banco para um formato seguro. */
export function normalizarEstrutura(input: unknown): Estrutura {
  if (!Array.isArray(input)) return [];
  const usadas = new Set<string>();
  const secoes: Estrutura = [];

  input.forEach((raw, i) => {
    if (!raw || typeof raw !== "object") return;
    const s = raw as Record<string, unknown>;
    const camposRaw = Array.isArray(s.campos) ? s.campos : [];
    const campos: Campo[] = [];

    camposRaw.forEach((c, j) => {
      if (!c || typeof c !== "object") return;
      const f = c as Record<string, unknown>;
      const rotulo = String(f.rotulo ?? "").trim();
      if (!rotulo) return;
      let chave = slug(String(f.chave ?? rotulo), `campo_${i}_${j}`);
      while (usadas.has(chave)) chave = `${chave}_${j}`;
      usadas.add(chave);
      const tipo = TIPOS.includes(f.tipo as TipoCampo) ? (f.tipo as TipoCampo) : "texto";
      const opcoes = Array.isArray(f.opcoes)
        ? f.opcoes.map((o) => String(o)).filter(Boolean).slice(0, 8)
        : undefined;
      campos.push({
        chave,
        rotulo: rotulo.slice(0, 120),
        tipo: tipo === "opcao" && (!opcoes || opcoes.length < 2) ? "texto" : tipo,
        ...(opcoes && opcoes.length >= 2 ? { opcoes } : {}),
        ...(f.longo === true ? { longo: true } : {}),
      });
    });

    if (campos.length === 0) return;
    secoes.push({
      id: slug(String(s.id ?? s.titulo ?? ""), `secao_${i}`),
      titulo: String(s.titulo ?? `Seção ${i + 1}`).slice(0, 100),
      dica: String(s.dica ?? "Fale os dados desta parte do documento.").slice(0, 240),
      campos,
    });
  });

  return secoes;
}

export function todosOsCampos(estrutura: Estrutura): Campo[] {
  return estrutura.flatMap((s) => s.campos);
}

export function fichaEmTexto(nome: string, estrutura: Estrutura, valores: Valores) {
  const corpo = estrutura
    .map((s) => {
      const linhas = s.campos
        .map((c) => `${c.rotulo}: ${valores[c.chave] ?? "____________"}`)
        .join("\n");
      return `${s.titulo.toUpperCase()}\n${linhas}`;
    })
    .join("\n\n");
  return `${nome}\n\n${corpo}\n`;
}
