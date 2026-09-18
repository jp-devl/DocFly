import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Mic,
  FileText,
  ShieldCheck,
  ArrowRight,
  FileCheck2,
  Waves,
  Brain,
  Zap,
  Sparkles,
  ClipboardList,
  Building2,
  Receipt,
  PenLine,
  Files,
  Menu,
  X,
  Check,
} from "lucide-react";
import { Marca } from "@/components/marca";
import { Button } from "@/components/ui/button";
import { TemaToggle } from "@/components/tema-toggle";
import { DemoVoz } from "@/components/demo-voz";
import { useSessao } from "@/lib/sessao";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DocFly — preencha documentos só falando" },
      {
        name: "description",
        content:
          "Envie um documento em Word, PDF ou foto. O DocFly identifica os campos, conversa com você e preenche o arquivo original.",
      },
      { property: "og:title", content: "DocFly — preencha documentos só falando" },
      {
        property: "og:description",
        content:
          "Seu documento vira um formulário de voz: fale e o DocFly preenche o arquivo original.",
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
    titulo: "Envie",
    texto: "Arraste seu documento em Word, PDF ou foto.",
  },
  {
    icon: Waves,
    titulo: "Fale",
    texto: "Responda falando; cada dado cai na linha certa.",
  },
  {
    icon: Sparkles,
    titulo: "Pronto",
    texto: "Receba o documento preenchido para baixar.",
  },
];

const RECURSOS = [
  {
    icon: Zap,
    titulo: "Preenchimento por voz",
    texto: "Fale naturalmente e veja os campos sendo completados na hora.",
  },
  {
    icon: FileCheck2,
    titulo: "Seu arquivo original",
    texto: "O DocFly preenche o próprio arquivo enviado, em vez de recriar outro.",
  },
  {
    icon: Brain,
    titulo: "Campos identificados sozinhos",
    texto: "Lacunas, rótulos e tabelas são reconhecidos automaticamente.",
  },
  {
    icon: ShieldCheck,
    titulo: "Seus documentos",
    texto: "Arquivos e respostas ficam privados, visíveis apenas na sua conta.",
  },
];

const USOS = [
  { icon: FileText, nome: "Currículos" },
  { icon: ClipboardList, nome: "Formulários" },
  { icon: Building2, nome: "Documentos empresariais" },
  { icon: Receipt, nome: "Fichas" },
  { icon: PenLine, nome: "Contratos" },
  { icon: Files, nome: "Documentos administrativos" },
];

function Landing() {
  const { session } = useSessao();
  const destino = session ? "/modelos" : "/auth";
  const [menuAberto, setMenuAberto] = useState(false);

  const links = (
    <>
      <a href="#como-funciona" className="transition-colors hover:text-foreground">
        Como funciona
      </a>
      <a href="#recursos" className="transition-colors hover:text-foreground">
        Recursos
      </a>
      <Link to={destino} className="transition-colors hover:text-foreground">
        Meus documentos
      </Link>
    </>
  );

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-8">
            <Marca tamanho="sm" />
            <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground lg:flex">
              {links}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <TemaToggle />
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="hidden h-9 rounded-full px-3 sm:inline-flex"
            >
              <Link to={destino}>{session ? "Minha conta" : "Entrar"}</Link>
            </Button>
            <Button asChild size="sm" className="hidden h-9 rounded-full px-4 sm:inline-flex">
              <Link to={destino}>Começar agora</Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Abrir menu"
              className="h-9 w-9 rounded-full lg:hidden"
              onClick={() => setMenuAberto((v) => !v)}
            >
              {menuAberto ? <X className="size-4" /> : <Menu className="size-4" />}
            </Button>
          </div>
        </div>
        {menuAberto && (
          <div className="animate-fade-in border-t border-border/60 px-5 py-4 lg:hidden">
            <nav className="flex flex-col gap-3 text-sm font-medium text-muted-foreground">
              {links}
            </nav>
            <div className="mt-4 flex gap-2">
              <Button asChild variant="outline" size="sm" className="flex-1 rounded-full">
                <Link to={destino}>{session ? "Minha conta" : "Entrar"}</Link>
              </Button>
              <Button asChild size="sm" className="flex-1 rounded-full">
                <Link to={destino}>Começar agora</Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-14 sm:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <div>
            <h1 className="animate-fade-in text-[2.6rem] font-extrabold leading-[1.03] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Preencha documentos.
              <br />
              <span className="text-primary">Só falando.</span>
            </h1>
            <p className="animate-fade-in mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Envie um documento. O DocFly identifica os campos, conversa com você e preenche o
              arquivo original sem reconstruir o documento.
            </p>
            <div className="animate-fade-in mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Button
                asChild
                size="lg"
                className="h-14 w-full gap-2.5 rounded-2xl px-8 text-base shadow-lg shadow-primary/20 sm:w-auto"
              >
                <Link to={destino}>
                  <Mic className="size-5" /> Começar a preencher
                  <ArrowRight className="size-4 opacity-70" />
                </Link>
              </Button>
              <span className="text-sm text-muted-foreground">Sem configuração complicada.</span>
            </div>
            <p className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary/80" />
              Seus documentos ficam privados na sua conta.
            </p>
          </div>
          <DemoVoz />
        </div>
      </section>

      {/* Passos */}
      <section id="como-funciona" className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Três passos. Nada de digitar.
        </h2>
        <div className="relative mt-14 grid gap-10 sm:grid-cols-3">
          <div
            aria-hidden
            className="absolute inset-x-[16%] top-10 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent sm:block"
          />
          {PASSOS.map((p, i) => (
            <div
              key={p.titulo}
              style={{ animationDelay: `${i * 80}ms` }}
              className="animate-fade-in relative text-center"
            >
              <div className="mx-auto grid size-20 place-items-center rounded-3xl border border-border/70 bg-card text-primary shadow-sm transition-transform duration-300 hover:-translate-y-1">
                <p.icon className="size-8" />
              </div>
              <div className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Passo {i + 1}
              </div>
              <h3 className="mt-1 text-xl font-bold text-foreground">{p.titulo}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {p.texto}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Seu documento continua sendo seu */}
      <section className="mx-auto max-w-6xl px-5 py-4">
        <div className="animate-fade-in rounded-[2rem] border border-border/70 bg-card p-8 sm:p-12">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Seu documento continua sendo seu.
              </h2>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
                O DocFly preenche o arquivo original em vez de recriar um documento completamente
                diferente. Ele preserva a estrutura e o layout original sempre que possível.
              </p>
              <ul className="mt-6 space-y-2.5 text-sm text-foreground">
                {[
                  "O arquivo enviado é a fonte de verdade",
                  "Logo, cabeçalho e tabelas continuam no lugar",
                  "Você baixa uma cópia preenchida, o original fica intacto",
                ].map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <MiniFolha titulo="Antes" preenchido={false} />
              <MiniFolha titulo="Depois" preenchido />
            </div>
          </div>
        </div>
      </section>

      {/* Recursos */}
      <section id="recursos" className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Tudo que o DocFly faz por você
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {RECURSOS.map((r, i) => (
            <div
              key={r.titulo}
              style={{ animationDelay: `${i * 60}ms` }}
              className="animate-fade-in group rounded-3xl border border-border/70 bg-card p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"
            >
              <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-105">
                <r.icon className="size-6" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-foreground">{r.titulo}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{r.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feito para documentos reais */}
      <section className="mx-auto max-w-6xl px-5 pb-16 sm:pb-24">
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Feito para documentos reais
        </h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {USOS.map((u) => (
            <div
              key={u.nome}
              className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card px-5 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <u.icon className="size-5 shrink-0 text-primary" />
              <span className="min-w-0 truncate text-sm font-semibold text-foreground">
                {u.nome}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="animate-fade-in rounded-[2rem] border border-border/70 bg-card px-6 py-16 text-center sm:px-12">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-6xl">
            Pare de digitar.
            <br />
            <span className="text-primary">Comece a falar.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
            Envie seu primeiro documento e veja o DocFly preencher por você.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-9 h-14 gap-2.5 rounded-2xl px-9 text-base shadow-lg shadow-primary/20"
          >
            <Link to={destino}>
              <Mic className="size-5" /> Começar agora
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 text-xs text-muted-foreground">
          <Marca tamanho="sm" />
          <span>Preenchimento de documentos por voz</span>
        </div>
      </footer>
    </main>
  );
}

/** Miniatura de folha usada na comparação antes / depois. */
function MiniFolha({ titulo, preenchido }: { titulo: string; preenchido: boolean }) {
  const linhas = preenchido
    ? ["Ana Carolina Ribeiro", "123.456.789-00", "Studio Aurora Ltda.", "12/03/2026"]
    : ["", "", "", ""];

  return (
    <div
      className={`rounded-2xl border p-4 transition-colors ${
        preenchido ? "border-primary/35 bg-primary/5" : "border-border/70 bg-background"
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {titulo}
      </p>
      <div className="mt-3 space-y-2.5">
        {["Nome", "CPF", "Empresa", "Data"].map((rotulo, i) => (
          <div key={rotulo} className="text-[11px] leading-tight">
            <span className="text-muted-foreground">{rotulo}:</span>{" "}
            {preenchido ? (
              <span className="font-medium text-foreground">{linhas[i]}</span>
            ) : (
              <span className="inline-block h-px w-20 translate-y-[-3px] bg-border align-middle" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
