import { createFileRoute, Link } from "@tanstack/react-router";
import { Mic, FileText, ShieldCheck, Sparkles } from "lucide-react";
import { Marca } from "@/components/marca";
import { Button } from "@/components/ui/button";
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

function Landing() {
  const { session } = useSessao();
  const destino = session ? "/modelos" : "/auth";

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Marca tamanho="sm" />
          <Button asChild size="sm" variant={session ? "default" : "outline"}>
            <Link to={destino}>{session ? "Meus modelos" : "Entrar"}</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
          Formulários por voz
        </p>
        <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
          Envie o documento. Fale. Está preenchido.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
          O VOZA lê seu formulário em Word, PDF ou foto, descobre sozinho quais são as lacunas e
          transforma tudo em campos que você preenche apenas falando.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="gap-2">
            <Link to={destino}>
              <Mic className="size-4" /> Começar agora
            </Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-5 pb-20 sm:grid-cols-3">
        {[
          {
            icon: FileText,
            titulo: "Qualquer documento",
            texto: "Word, PDF, texto ou foto do formulário impresso. A leitura é automática.",
          },
          {
            icon: Sparkles,
            titulo: "Campos criados sozinhos",
            texto: "As lacunas viram campos organizados em blocos, na ordem do documento.",
          },
          {
            icon: ShieldCheck,
            titulo: "Tudo na sua conta",
            texto: "Modelos, fichas preenchidas e o arquivo original ficam salvos e privados.",
          },
        ].map((item) => (
          <div key={item.titulo} className="rounded-2xl border border-border bg-card p-5">
            <item.icon className="size-5 text-primary" />
            <h2 className="mt-3 text-base font-semibold text-foreground">{item.titulo}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{item.texto}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
