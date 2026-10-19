export type TipoCampo = "texto" | "numero" | "data" | "opcao" | "simnao";

export type AreaCampo = { x: number; y: number; w: number; h: number };

export type Campo = {
  chave: string;
  rotulo: string;
  tipo: TipoCampo;
  opcoes?: string[];
  longo?: boolean;
  /** Posição da lacuna na imagem original, em fração da página (0 a 1). */
  area?: AreaCampo;
};

export type Secao = {
  id: string;
  titulo: string;
  dica: string;
  nota?: string;
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
    const camposRaw = Array.isArray(s["campos"]) ? (s["campos"] as unknown[]) : [];
    const campos: Campo[] = [];

    camposRaw.forEach((c, j) => {
      if (!c || typeof c !== "object") return;
      const f = c as Record<string, unknown>;
      const rotulo = String(f["rotulo"] ?? "").trim();
      if (!rotulo) return;
      let chave = slug(String(f["chave"] ?? rotulo), `campo_${i}_${j}`);
      while (usadas.has(chave)) chave = `${chave}_${j}`;
      usadas.add(chave);
      const tipo = TIPOS.includes(f["tipo"] as TipoCampo) ? (f["tipo"] as TipoCampo) : "texto";
      const opcoes = Array.isArray(f["opcoes"])
        ? (f["opcoes"] as unknown[]).map((o) => String(o)).filter(Boolean).slice(0, 8)
        : undefined;
      const areaBruta = f["area"] as Record<string, unknown> | undefined;
      const nums = ["x", "y", "w", "h"].map((k) => Number(areaBruta?.[k]));
      const escala = (v: number) => (v > 1.01 ? v / 100 : v);
      const area =
        nums.length === 4 && nums.every((n) => Number.isFinite(n) && n >= 0)
          ? { x: escala(nums[0]!), y: escala(nums[1]!), w: escala(nums[2]!), h: escala(nums[3]!) }
          : undefined;
      campos.push({
        chave,
        rotulo: rotulo.slice(0, 120),
        tipo: tipo === "opcao" && (!opcoes || opcoes.length < 2) ? "texto" : tipo,
        ...(opcoes && opcoes.length >= 2 ? { opcoes } : {}),
        ...(f["longo"] === true ? { longo: true } : {}),
        ...(area && area.w > 0 && area.w <= 1 && area.h > 0 && area.h <= 1 ? { area } : {}),
      });
    });

    if (campos.length === 0) return;
    secoes.push({
      id: slug(String(s["id"] ?? s["titulo"] ?? ""), `secao_${i}`),
      titulo: String(s["titulo"] ?? `Seção ${i + 1}`).slice(0, 100),
      dica: String(s["dica"] ?? "Fale os dados desta parte do documento.").slice(0, 240),
      ...(typeof s["nota"] === "string" && s["nota"].trim()
        ? { nota: s["nota"].trim().slice(0, 400) }
        : {}),

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
