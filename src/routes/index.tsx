import { createFileRoute, Link } from "@tanstack/react-router";
import { Mic, FileText, ShieldCheck, Sparkles, ArrowRight, FileCheck2, Waves } from "lucide-react";
import { Marca } from "@/components/marca";
import { Button } from "@/components/ui/button";
import { TemaToggle } from "@/components/tema-toggle";
import { useSessao } from "@/lib/sessao";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VOZA — preencha qualquer formulário falando" },
      {
        name: "description",
        content:
          "Envie um documento em Word, PDF ou foto, o VOZA identifica os campos e você preenche tudo falando, sem digitar.",
      },
      { property: "og:title", content: "VOZA — preencha qualquer formulário falando" },
      {
        property: "og:description",
        content: "Seu documento vira um formulário de voz: fale e os campos se preenchem sozinhos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const PASSOS = [
  {
    icon: FileText,
    titulo: "Envie o documento",
    texto: "Word, PDF, texto ou foto do formulário impresso. A leitura é automática.",
  },
  {
    icon: Waves,
    titulo: "Fale os dados",
    texto: "As lacunas viram campos e cada informação cai na linha certa enquanto você fala.",
  },
  {
    icon: FileCheck2,
    titulo: "Baixe preenchido",
    texto: "O próprio arquivo enviado volta preenchido, com o layout original intacto.",
  },
];

function Landing() {
  const { session } = useSessao();
  const destino = session ? "/modelos" : "/auth";

  return (
    <main className="min-h-screen bg-gradient-to-b from-muted/50 via-background to-background">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3.5">
          <Marca tamanho="sm" />
          <div className="flex shrink-0 items-center gap-2">
            <TemaToggle />
            <Button
              asChild
              size="sm"
              variant={session ? "default" : "outline"}
              className="h-9 rounded-full px-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-95"
            >
              <Link to={destino}>{session ? "Meus modelos" : "Entrar"}</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 pb-14 pt-16 text-center sm:pt-24">
        <span className="animate-fade-in inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
          <Sparkles className="size-3" /> Formulários por voz
        </span>
        <h1 className="animate-fade-in mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-6xl">
          Envie o documento.
          <br />
          <span className="text-primary">Fale.</span> Está preenchido.
        </h1>
        <p className="animate-fade-in mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          O VOZA lê seu formulário em Word, PDF ou foto, descobre sozinho quais são as lacunas e
          transforma tudo em campos que você preenche apenas falando.
        </p>
        <div className="animate-fade-in mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="h-13 gap-2 rounded-2xl px-8 text-base font-semibold shadow-lg shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/25 active:translate-y-0 active:scale-[0.98]"
          >
            <Link to={destino}>
              <Mic className="size-5" /> Começar agora
              <ArrowRight className="size-4 opacity-70 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
        <p className="mt-5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary/80" />
          Seus documentos ficam privados na sua conta.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-24">
        <div className="grid gap-4 sm:grid-cols-3">
          {PASSOS.map((item, i) => (
            <div
              key={item.titulo}
              style={{ animationDelay: `${i * 70}ms` }}
              className="animate-fade-in group rounded-3xl border border-border/70 bg-card/80 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl active:translate-y-0"
            >
              <div className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-105">
                <item.icon className="size-5" />
              </div>
              <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Passo {i + 1}
              </div>
              <h2 className="mt-1 text-base font-semibold text-foreground">{item.titulo}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.texto}</p>
            </div>
          ))}
        </div>

        <div className="animate-fade-in mt-6 grid gap-3 rounded-3xl border border-border/70 bg-card/60 p-6 sm:grid-cols-2 sm:p-8">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Seus documentos são processados com segurança
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Arquivos e fichas ficam guardados de forma privada, visíveis apenas na sua conta.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <FileCheck2 className="mt-0.5 size-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Não alteramos o arquivo original
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                O documento enviado é preservado; o download é uma cópia com as lacunas preenchidas.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 text-xs text-muted-foreground">
          <Marca tamanho="sm" />
          <span>Preenchimento de documentos por voz</span>
        </div>
      </footer>
    </main>
  );
}
