import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { jsPDF } from "jspdf";
import type { Estrutura, Valores } from "./estrutura";

function nomeArquivo(nome: string) {
  return (
    nome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\- ]+/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase() || "ficha"
  );
}

async function baixarBlob(blob: Blob, arquivo: string, tipo: string) {
  const file = new File([blob], arquivo, { type: tipo });

  // iOS/Android: o link de download costuma ser bloqueado; usa a folha de
  // compartilhamento (Salvar em Arquivos / Downloads) quando disponível.
  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean;
    share?: (data: { files: File[]; title?: string }) => Promise<void>;
  };
  const ehMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (ehMobile && nav.canShare?.({ files: [file] }) && nav.share) {
    try {
      await nav.share({ files: [file], title: arquivo });
      return;
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return;
    }
  }

  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = arquivo;
  a.rel = "noopener";
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 15000);
}


const VAZIO = "____________________";

export async function baixarWord(nome: string, estrutura: Estrutura, valores: Valores) {
  const filhos: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: nome, bold: true, size: 32 })],
    }),
    new Paragraph({ children: [new TextRun("")] }),
  ];

  estrutura.forEach((secao) => {
    filhos.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        children: [new TextRun({ text: secao.titulo.toUpperCase(), bold: true, size: 26 })],
      }),
    );
    secao.campos.forEach((campo) => {
      filhos.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({ text: `${campo.rotulo}: `, bold: true, size: 22 }),
            new TextRun({ text: valores[campo.chave]?.trim() || VAZIO, size: 22 }),
          ],
        }),
      );
    });
  });

  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 22 } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
          },
        },
        children: filhos,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  await baixarBlob(
    blob,
    `${nomeArquivo(nome)}.docx`,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  );
}

export async function baixarPdf(nome: string, estrutura: Estrutura, valores: Valores) {
  const pdf = new jsPDF({ unit: "pt", format: "letter" });
  const margem = 56;
  const largura = pdf.internal.pageSize.getWidth() - margem * 2;
  const alturaPagina = pdf.internal.pageSize.getHeight();
  let y = margem + 6;

  const quebra = (altura: number) => {
    if (y + altura > alturaPagina - margem) {
      pdf.addPage();
      y = margem;
    }
  };

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(pdf.splitTextToSize(nome, largura) as string[], margem, y);
  y += 28;

  estrutura.forEach((secao) => {
    quebra(40);
    y += 10;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text(secao.titulo.toUpperCase(), margem, y);
    y += 6;
    pdf.setDrawColor(180);
    pdf.line(margem, y, margem + largura, y);
    y += 16;

    secao.campos.forEach((campo) => {
      const rotulo = `${campo.rotulo}: `;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10.5);
      const larguraRotulo = pdf.getTextWidth(rotulo);
      const valor = valores[campo.chave]?.trim() || VAZIO;
      pdf.setFont("helvetica", "normal");
      const linhas = pdf.splitTextToSize(valor, largura - larguraRotulo) as string[];
      quebra(linhas.length * 14 + 4);
      pdf.setFont("helvetica", "bold");
      pdf.text(rotulo, margem, y);
      pdf.setFont("helvetica", "normal");
      pdf.text(linhas, margem + larguraRotulo, y);
      y += linhas.length * 14 + 4;
    });
  });

  await baixarBlob(pdf.output("blob"), `${nomeArquivo(nome)}.pdf`, "application/pdf");
}
