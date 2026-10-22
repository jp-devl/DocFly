import JSZip from "jszip";
import type { Campo, Estrutura, Valores } from "./estrutura";
import { todosOsCampos } from "./estrutura";

/**
 * Preenche o ARQUIVO ORIGINAL enviado pelo usuário (Word ou PDF), sem recriar
 * o documento: mantém fontes, logotipo, cabeçalho, rodapé, tabelas, margens e
 * paginação. Apenas o conteúdo das lacunas é inserido no lugar correspondente.
 */

export type ResultadoPreenchimento = {
  blob: Blob;
  arquivo: string;
  mime: string;
  preenchidos: number;
  faltando: string[];
};

function semAcento(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function escaparRegex(texto: string) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Regex do rótulo tolerante a espaços, acentos e pontuação final. */
function regexRotulo(rotulo: string) {
  const limpo = rotulo.trim().replace(/[:：]+\s*$/, "");
  const partes = semAcento(limpo)
    .split(/\s+/)
    .filter(Boolean)
    .map(escaparRegex);
  if (partes.length === 0) return null;
  return new RegExp(partes.join("\\s+"), "i");
}

function valorDoCampo(campo: Campo, valores: Valores) {
  return (valores[campo.chave] ?? "").trim();
}

function camposComValor(estrutura: Estrutura, valores: Valores) {
  return todosOsCampos(estrutura)
    .map((campo) => ({ campo, valor: valorDoCampo(campo, valores) }))
    .filter((x) => x.valor.length > 0)
    // rótulos maiores primeiro evitam casar "Sócio 1" dentro de "Sócio 1 %"
    .sort((a, b) => b.campo.rotulo.length - a.campo.rotulo.length);
}

/** Para cada campo, os rótulos dos outros campos — usados como fronteira. */
function limitesDeCampos(estrutura: Estrutura) {
  const campos = todosOsCampos(estrutura);
  const mapa = new Map<string, RegExp[]>();
  for (const campo of campos) {
    const outros = campos
      .filter((c) => c.chave !== campo.chave)
      .map((c) => regexRotulo(c.rotulo))
      .filter((rx): rx is RegExp => rx !== null);
    mapa.set(campo.chave, outros);
  }
  return mapa;
}


/* ------------------------------- WORD (.docx) ------------------------------ */

type Segmento = { xmlIni: number; xmlFim: number; ini: number; fim: number };

function escaparXml(texto: string) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function desescaparXml(texto: string) {
  return texto
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, "&");
}

/** Só espaços, sublinhados, pontos ou tracejados — ou seja, lacuna vazia. */
function ehLacuna(texto: string) {
  return texto.trim().length === 0 || /^[_.\-–—…·\u00A0\s]+$/.test(texto);
}

/**
 * Onde termina a área que pertence ao campo: no começo do próximo rótulo
 * conhecido, ou no fim do trecho analisado.
 */
function fimDaArea(plano: string, inicio: number, limites: RegExp[]) {
  const resto = plano.slice(inicio);
  let fim = resto.length;
  for (const rx of limites) {
    const achado = rx.exec(resto);
    if (achado && achado.index > 0 && achado.index < fim) fim = achado.index;
  }
  return inicio + fim;
}

/** Preenche um parágrafo do Word substituindo o conteúdo antigo do campo. */
function preencherParagrafo(
  paragrafo: string,
  pendentes: { campo: Campo; valor: string }[],
  usados: Set<string>,
  limites: Map<string, RegExp[]>,
): string {
  const segmentos: Segmento[] = [];
  let texto = "";
  const re = /(<w:t(?:\s[^>]*)?>)([\s\S]*?)(<\/w:t>)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(paragrafo)) !== null) {
    const bruto = m[2] ?? "";
    const visivel = desescaparXml(bruto);
    // só mapeamos textos sem entidades multi-caractere para manter os índices
    const xmlIni = m.index + (m[1] ?? "").length;
    segmentos.push({
      xmlIni,
      xmlFim: xmlIni + bruto.length,
      ini: texto.length,
      fim: texto.length + (bruto.length === visivel.length ? visivel.length : bruto.length),
    });
    texto += bruto.length === visivel.length ? visivel : bruto;
  }
  if (segmentos.length === 0) return paragrafo;

  const plano = semAcento(texto);
  type Edicao = { ini: number; fim: number; texto: string };
  const edicoes: Edicao[] = [];

  for (const { campo, valor } of pendentes) {
    if (usados.has(campo.chave)) continue;
    const rx = regexRotulo(campo.rotulo);
    if (!rx) continue;
    const achado = rx.exec(plano);
    if (!achado) continue;

    let pos = achado.index + achado[0].length;
    // pula ":" e espaços logo após o rótulo
    const depois = texto.slice(pos);
    const pulo = /^\s*[:：]?\s*/.exec(depois);
    pos += pulo?.[0]?.length ?? 0;

    // a área do campo vai até o próximo rótulo conhecido (ou fim do parágrafo)
    let fim = fimDaArea(plano, pos, limites.get(campo.chave) ?? []);
    const area = texto.slice(pos, fim);
    const areaVazia = ehLacuna(area);

    if (!areaVazia && area.length > 80) {
      // rótulo citado no meio de um texto corrido: não apagamos o parágrafo
      const lacuna = /^[_.…·\u00A0\s]{2,}/.exec(area);
      if (lacuna) fim = pos + lacuna[0].length;
      else fim = pos;
    } else {
      // preserva o espaçamento final da área (pontuação/linha seguinte)
      const cauda = /\s+$/.exec(area);
      if (cauda && fim - cauda[0].length > pos) fim -= cauda[0].length;
    }

    edicoes.push({ ini: pos, fim, texto: valor });
    usados.add(campo.chave);
  }


  if (edicoes.length === 0) return paragrafo;
  edicoes.sort((a, b) => b.ini - a.ini);

  let saida = paragrafo;
  for (const ed of edicoes) {
    // aplica a edição sobre os segmentos afetados, do último para o primeiro
    const afetados = segmentos.filter(
      (s) => s.fim > ed.ini && s.ini < Math.max(ed.fim, ed.ini + 1),
    );
    const alvos = afetados.length > 0 ? afetados : segmentos.filter((s) => s.fim >= ed.ini);
    const primeiro = alvos[0];
    if (!primeiro) continue;

    for (let i = alvos.length - 1; i >= 0; i--) {
      const seg = alvos[i]!;
      const de = Math.max(ed.ini, seg.ini);
      const ate = Math.min(ed.fim, seg.fim);
      const xmlDe = seg.xmlIni + (de - seg.ini);
      const xmlAte = seg.xmlIni + Math.max(ate - seg.ini, de - seg.ini);
      const insercao = seg === primeiro ? escaparXml(ed.texto) : "";
      saida = saida.slice(0, xmlDe) + insercao + saida.slice(xmlAte);
    }
    // reposiciona segmentos seguintes (o XML mudou de tamanho)
    const delta =
      escaparXml(ed.texto).length -
      alvos.reduce((acc, s) => {
        const de = Math.max(ed.ini, s.ini);
        const ate = Math.min(ed.fim, s.fim);
        return acc + Math.max(0, ate - de);
      }, 0);
    for (const seg of segmentos) {
      if (seg.xmlIni > primeiro.xmlIni) {
        seg.xmlIni += delta;
        seg.xmlFim += delta;
      }
    }
  }
  return saida;
}

async function preencherDocx(
  bytes: ArrayBuffer,
  estrutura: Estrutura,
  valores: Valores,
): Promise<{ blob: Blob; usados: Set<string> }> {
  const zip = await JSZip.loadAsync(bytes);
  const pendentes = camposComValor(estrutura, valores);
  const usados = new Set<string>();
  const limites = limitesDeCampos(estrutura);

  const partes = Object.keys(zip.files).filter((n) =>
    /^word\/(document\d*|header\d*|footer\d*)\.xml$/.test(n),
  );

  for (const nome of partes) {
    const arquivo = zip.file(nome);
    if (!arquivo) continue;
    const xml = await arquivo.async("string");
    const novo = xml.replace(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g, (par) =>
      preencherParagrafo(par, pendentes, usados, limites),
    );

    zip.file(nome, novo);
  }

  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  return { blob, usados };
}

/* ---------------------------------- PDF ----------------------------------- */

async function preencherPdf(
  bytes: ArrayBuffer,
  estrutura: Estrutura,
  valores: Valores,
): Promise<{ blob: Blob; usados: Set<string> }> {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

  const pendentes = camposComValor(estrutura, valores);
  const usados = new Set<string>();
  const limites = limitesDeCampos(estrutura);

  const doc = await pdfjs.getDocument({ data: bytes.slice(0) }).promise;
  const saida = await PDFDocument.load(bytes.slice(0));
  const fonte = await saida.embedFont(StandardFonts.Helvetica);
  const paginas = saida.getPages();

  type ItemTexto = { str: string; width: number; height: number; transform: number[] };
  type Peca = { texto: string; x: number; fimX: number; y: number; alt: number };
  type Trecho = { ini: number; fim: number; peca: Peca };

  for (let p = 1; p <= doc.numPages; p++) {
    const pagina = await doc.getPage(p);
    const conteudo = await pagina.getTextContent();
    const alvo = paginas[p - 1];
    if (!alvo) continue;
    const larguraPagina = alvo.getWidth();

    const pecas: Peca[] = (conteudo.items as unknown[])
      .filter((i): i is ItemTexto => typeof (i as { str?: unknown }).str === "string")
      .filter((i) => i.str.length > 0)
      .map((i) => {
        const t = i.transform;
        const x = t[4] ?? 0;
        const alt = Math.abs(t[3] ?? i.height ?? 10) || 10;
        return { texto: i.str, x, fimX: x + (i.width ?? 0), y: t[5] ?? 0, alt };
      });

    // agrupa as peças por linha (mesma altura base)
    const linhas: Peca[][] = [];
    for (const peca of [...pecas].sort((a, b) => b.y - a.y || a.x - b.x)) {
      const ultima = linhas[linhas.length - 1];
      const ref = ultima?.[0];
      if (ultima && ref && Math.abs(ref.y - peca.y) <= Math.max(2, ref.alt * 0.3)) ultima.push(peca);
      else linhas.push([peca]);
    }

    for (const linha of linhas) {
      linha.sort((a, b) => a.x - b.x);
      let texto = "";
      const trechos: Trecho[] = [];
      let anterior: Peca | null = null;
      for (const peca of linha) {
        if (anterior && peca.x - anterior.fimX > anterior.alt * 0.2 && !/\s$/.test(texto)) {
          texto += " ";
        }
        const ini = texto.length;
        texto += peca.texto;
        trechos.push({ ini, fim: texto.length, peca });
        anterior = peca;
      }
      const normal = semAcento(texto);

      /**
       * Coordenada x de um índice de caractere da linha. A largura de cada
       * letra é estimada com a métrica de uma fonte proporcional e depois
       * ajustada à largura real da peça — bem mais preciso que dividir igual.
       */
      const xDoIndice = (idx: number) => {
        for (const t of trechos) {
          if (idx >= t.ini && idx <= t.fim) {
            const conteudo = texto.slice(t.ini, t.fim);
            const parcial = texto.slice(t.ini, idx);
            let prop = (idx - t.ini) / Math.max(1, t.fim - t.ini);
            try {
              const total = fonte.widthOfTextAtSize(conteudo, 10);
              if (total > 0) prop = fonte.widthOfTextAtSize(parcial, 10) / total;
            } catch {
              /* caracteres fora da fonte: mantém a divisão simples */
            }
            return t.peca.x + (t.peca.fimX - t.peca.x) * Math.min(1, Math.max(0, prop));
          }
        }
        const ultimo = trechos[trechos.length - 1];
        return ultimo ? ultimo.peca.fimX : 0;
      };

      for (const { campo, valor } of pendentes) {
        if (usados.has(campo.chave)) continue;
        const rx = regexRotulo(campo.rotulo);
        if (!rx) continue;
        const achado = rx.exec(normal);
        if (!achado) continue;

        const fimRotulo = achado.index + achado[0].length;
        let pos = fimRotulo;
        const pulo = /^\s*[:：]?\s*/.exec(texto.slice(pos));
        pos += pulo?.[0]?.length ?? 0;

        // a área do campo termina no próximo rótulo conhecido, ou no fim da linha
        const fim = fimDaArea(normal, pos, limites.get(campo.chave) ?? []);
        const area = texto.slice(pos, fim);
        if (!ehLacuna(area) && area.length > 80) continue;

        const trechoAncora =
          trechos.find((t) => pos >= t.ini && pos < t.fim) ?? trechos[trechos.length - 1];
        if (!trechoAncora) continue;
        const alt = trechoAncora.peca.alt;
        const xIni = xDoIndice(pos);
        const xFimArea = xDoIndice(fim);
        // a estimativa de coordenada por caractere tem folga: apaga um pouco
        // antes e depois da área, sem invadir o rótulo nem o campo seguinte
        const folga = alt * 0.55;
        // o limite esquerdo é logo após o ":" do rótulo, para não apagá-lo
        const puloTexto = pulo?.[0] ?? "";
        const idxDoisPontos = puloTexto.search(/[:：]/);
        const xRotulo =
          idxDoisPontos >= 0
            ? xDoIndice(fimRotulo + idxDoisPontos + 1)
            : xDoIndice(fimRotulo);
        const xApagaIni = Math.max(xRotulo + 0.5, xIni - folga);
        const xProximo = fim < texto.length ? xDoIndice(fim) : xFimArea;
        const xApagaFim = Math.max(
          xFimArea,
          Math.min(xFimArea + folga, fim < texto.length ? xProximo : xFimArea + folga),
        );
        const limiteDireito = Math.min(larguraPagina - 24, Math.max(xApagaFim, xIni + alt * 4));
        const y = trechoAncora.peca.y;

        // apaga o conteúdo antigo da área do campo antes de escrever o novo valor
        if (area.trim().length > 0 && xApagaFim > xApagaIni) {
          alvo.drawRectangle({
            x: xApagaIni,
            y: y - alt * 0.3,
            width: xApagaFim - xApagaIni,
            height: alt * 1.25,
            color: rgb(1, 1, 1),
          });
        }

        // ajusta o tamanho para o valor caber na área, sem invadir o campo seguinte
        const xTexto = Math.max(xApagaIni, xIni - folga * 0.6);
        const disponivel = Math.max(24, limiteDireito - xTexto);
        let tamanho = Math.min(12, Math.max(7, alt * 0.92));
        while (tamanho > 6 && fonte.widthOfTextAtSize(valor, tamanho) > disponivel) {
          tamanho -= 0.5;
        }

        alvo.drawText(valor, {
          x: xTexto + 0.5,
          y,
          size: tamanho,
          font: fonte,
          color: rgb(0.05, 0.05, 0.05),
          maxWidth: disponivel,
        });
        usados.add(campo.chave);
      }
    }
  }


  const bytesFinais = await saida.save();
  return {
    blob: new Blob([bytesFinais as unknown as BlobPart], { type: "application/pdf" }),
    usados,
  };
}

/* --------------------------------- público -------------------------------- */

/* --------------------------------- IMAGEM ---------------------------------- */

/**
 * Foto/scan do documento: a imagem original vira o fundo integral de uma
 * página PDF e os valores são escritos apenas dentro das áreas das lacunas
 * (coordenadas aproximadas identificadas na leitura). Nada do documento é
 * recriado — o visual vem da própria imagem.
 */
async function preencherImagem(
  bytes: ArrayBuffer,
  estrutura: Estrutura,
  valores: Valores,
): Promise<{ blob: Blob; usados: Set<string> }> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(new Blob([bytes]));
  } catch {
    throw new Error("Não consegui abrir essa imagem. Envie em JPG, PNG ou WebP.");
  }

  // close() zera as dimensões do bitmap: guardamos o tamanho antes de liberá-lo
  const W = bmp.width;
  const H = bmp.height;
  if (!W || !H) throw new Error("Não consegui ler o tamanho dessa imagem.");

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não consegui processar essa imagem.");
  ctx.drawImage(bmp, 0, 0);
  const png = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
  bmp.close();
  if (!png) throw new Error("Não consegui processar essa imagem.");

  const doc = await PDFDocument.create();
  const pagina = doc.addPage([W, H]);
  const img = await doc.embedPng(await png.arrayBuffer());
  pagina.drawImage(img, { x: 0, y: 0, width: W, height: H });
  const fonte = await doc.embedFont(StandardFonts.Helvetica);

  const usados = new Set<string>();
  for (const campo of todosOsCampos(estrutura)) {
    const valor = (valores[campo.chave] ?? "").trim();
    if (!valor || !campo.area) continue;
    const { x, y, w, h } = campo.area;
    const px = x * W;
    const pw = w * W;
    const ph = h * H;
    const py = H - (y + h) * H; // PDF tem origem no rodapé
    pagina.drawRectangle({ x: px, y: py, width: pw, height: ph, color: rgb(1, 1, 1) });
    let tamanho = Math.min(14, Math.max(6, ph * 0.72));
    while (tamanho > 5 && fonte.widthOfTextAtSize(valor, tamanho) > pw * 0.94) tamanho -= 0.5;
    pagina.drawText(valor, {
      x: px + pw * 0.03,
      y: py + Math.max(ph * 0.18, (ph - tamanho) / 2),
      size: tamanho,
      font: fonte,
      color: rgb(0.05, 0.05, 0.05),
      maxWidth: pw * 0.94,
    });
    usados.add(campo.chave);
  }

  const bytesFinais = await doc.save();
  return {
    blob: new Blob([bytesFinais as unknown as BlobPart], { type: "application/pdf" }),
    usados,
  };
}

/* --------------------------------- público -------------------------------- */

export function podePreencherOriginal(nomeArquivo: string | null | undefined) {
  if (!nomeArquivo) return false;
  return /\.(docx|pdf|jpe?g|png|webp|gif|bmp)$/i.test(nomeArquivo);
}

export async function preencherArquivoOriginal(
  original: Blob,
  nomeArquivo: string,
  estrutura: Estrutura,
  valores: Valores,
): Promise<ResultadoPreenchimento> {
  const bytes = await original.arrayBuffer();
  const ehImagem = /\.(jpe?g|png|webp|gif|bmp)$/i.test(nomeArquivo);
  const ehPdf = /\.pdf$/i.test(nomeArquivo);
  const saidaPdf = ehImagem || ehPdf;
  const { blob, usados } = ehImagem
    ? await preencherImagem(bytes, estrutura, valores)
    : ehPdf
      ? await preencherPdf(bytes, estrutura, valores)
      : await preencherDocx(bytes, estrutura, valores);

  const preenchiveis = camposComValor(estrutura, valores);
  const faltando = preenchiveis
    .filter((x) => !usados.has(x.campo.chave))
    .map((x) => x.campo.rotulo);

  const base = nomeArquivo.replace(/\.(docx|pdf|jpe?g|png|webp|gif|bmp)$/i, "");
  return {
    blob,
    arquivo: `${base}-preenchido.${saidaPdf ? "pdf" : "docx"}`,
    mime: saidaPdf
      ? "application/pdf"
      : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    preenchidos: usados.size,
    faltando,
  };
}
