import JSZip from "jszip";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

/** Extrai texto de um .docx (zip com word/document.xml). */
async function textoDocx(bytes: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(bytes);
  const partes: string[] = [];
  for (const nome of ["word/document.xml", "word/header1.xml", "word/footer1.xml"]) {
    const arquivo = zip.file(nome);
    if (!arquivo) continue;
    const xml = await arquivo.async("string");
    partes.push(
      xml
        .replace(/<\/w:p>/g, "\n")
        .replace(/<w:tab[^>]*\/>/g, "\t")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#x([0-9A-Fa-f]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16))),
    );
  }
  return partes.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Extrai texto legível de um .doc antigo (binário). */
function textoDocAntigo(bytes: ArrayBuffer): string {
  const buf = new Uint8Array(bytes);
  let out = "";
  for (let i = 0; i < buf.length; i++) {
    const b = buf[i]!;
    const proximo = buf[i + 1];
    if (b >= 32 && b < 127 && proximo === 0) {
      out += String.fromCharCode(b);
      i++;
    } else if (b === 13 || b === 10) {
      out += "\n";
    } else if (b >= 32 && b < 127) {
      out += String.fromCharCode(b);
    } else {
      out += " ";
    }
  }
  return out.replace(/[ \t]{3,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export type ConteudoDocumento =
  | { tipo: "texto"; texto: string }
  | { tipo: "arquivo"; mime: string; base64: string; nome: string };

function paraBase64(bytes: ArrayBuffer): string {
  const buf = new Uint8Array(bytes);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < buf.length; i += chunk) {
    bin += String.fromCharCode(...buf.subarray(i, i + chunk));
  }
  return btoa(bin);
}

export async function lerDocumento(file: File): Promise<ConteudoDocumento> {
  const nome = file.name.toLowerCase();
  const bytes = await file.arrayBuffer();

  if (nome.endsWith(".pdf") || file.type === "application/pdf") {
    return { tipo: "arquivo", mime: "application/pdf", base64: paraBase64(bytes), nome: file.name };
  }
  if (file.type.startsWith("image/")) {
    return { tipo: "arquivo", mime: file.type, base64: paraBase64(bytes), nome: file.name };
  }
  if (nome.endsWith(".docx")) {
    return { tipo: "texto", texto: await textoDocx(bytes) };
  }
  if (nome.endsWith(".doc")) {
    return { tipo: "texto", texto: textoDocAntigo(bytes) };
  }
  return { tipo: "texto", texto: new TextDecoder().decode(bytes) };
}

const INSTRUCAO = `Você reproduz documentos e formulários dentro de um app de preenchimento por voz, em português do Brasil.
Sua tarefa é COPIAR o documento fielmente, campo por campo, sem resumir e sem reorganizar.
Devolva SOMENTE um objeto JSON com este formato:
{"nome":"título exatamente como está no documento","descricao":"uma frase sobre o documento","secoes":[{"id":"identificador_curto","titulo":"Título da seção como aparece no documento","nota":"texto fixo/observação impressa nessa parte, se houver","dica":"instrução curta do que a pessoa deve falar","campos":[{"chave":"identificador_sem_acento","rotulo":"Rótulo do campo exatamente como está escrito no documento","tipo":"texto|numero|data|opcao|simnao","opcoes":["A","B"],"longo":true}]}]}
Regras de fidelidade (obrigatórias):
- Transcreva TODOS os campos do documento, do começo ao fim, na mesma ordem em que aparecem. Não pule nenhum, mesmo que pareça repetido.
- Mantenha o texto dos rótulos e dos títulos de seção IDÊNTICO ao documento (mesma redação, abreviações, pontuação e maiúsculas quando forem do original). Não traduza, não reescreva, não "melhore".
- Se um bloco se repete (ex.: Sócio 1, Sócio 2, Sócio 3), crie uma seção separada para cada repetição, com o número correspondente.
- Cada lacuna, linha pontilhada, tabela, parêntese de marcar ou item a preencher vira um campo.
- Textos impressos que não são campos (observações, avisos, instruções do formulário) vão em "nota" da seção, sem virar campo.
- Use "opcao" quando o documento oferece alternativas para marcar, listando-as em "opcoes" exatamente como escritas.
- Use "simnao" para itens de sim/não, "data" para datas, "numero" para valores, quantidades e áreas.
- "longo": true para campos de texto extenso (nomes completos, endereços, descrições).
- Pode criar quantas seções o documento tiver (até 30). Prefira seguir exatamente as divisões do documento original.
- Não invente campos que não existem. Não escreva nada fora do JSON.`;

export async function gerarEstruturaDoDocumento(
  conteudo: ConteudoDocumento,
  nomeArquivo: string,
  apiKey: string,
): Promise<unknown> {
  const partes: unknown[] = [
    { type: "text", text: `Documento: ${nomeArquivo}\n\n${INSTRUCAO}` },
  ];

  if (conteudo.tipo === "texto") {
    const texto = conteudo.texto.slice(0, 60000);
    if (texto.replace(/\s/g, "").length < 20) {
      throw new Error("Não consegui ler texto nesse arquivo. Tente enviar em PDF.");
    }
    partes.push({ type: "text", text: `Conteúdo do documento:\n\n${texto}` });
  } else if (conteudo.mime.startsWith("image/")) {
    partes.push({
      type: "image_url",
      image_url: { url: `data:${conteudo.mime};base64,${conteudo.base64}` },
    });
  } else {
    partes.push({
      type: "file",
      file: { filename: conteudo.nome, file_data: `data:${conteudo.mime};base64,${conteudo.base64}` },
    });
  }

  const res = await fetch(`${GATEWAY}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3.6-flash",
      messages: [{ role: "user", content: partes }],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("Muitas leituras seguidas. Espere alguns segundos e tente de novo.");
    if (res.status === 402) throw new Error("Os créditos de IA acabaram. Adicione créditos para continuar.");
    throw new Error(`Falha ao ler o documento: ${body.slice(0, 300)}`);
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  try {
    return JSON.parse(json.choices?.[0]?.message?.content ?? "{}");
  } catch {
    throw new Error("A leitura do documento voltou incompleta. Tente novamente.");
  }
}
