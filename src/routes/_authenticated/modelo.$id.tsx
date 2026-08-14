import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, FileText, FileType2, Loader2, Mic, RotateCcw, Save, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cabecalhoAuth } from "@/lib/sessao";
import { startRecording } from "@/lib/recorder";
import { mensagemErro } from "@/lib/erros";
import { baixarPdf, baixarWord } from "@/lib/exportar";
import {
  normalizarEstrutura,
  todosOsCampos,
  type Campo,
  type Estrutura,
  type Valores,
} from "@/lib/estrutura";

export const Route = createFileRoute("/_authenticated/modelo/$id")({
  head: () => ({
    meta: [
      { title: "Preencher por voz | VOZA" },
      {
        name: "description",
        content: "Fale os dados e veja o documento completo sendo preenchido sozinho.",
      },
      { property: "og:title", content: "Preencher por voz | VOZA" },
      { property: "og:description", content: "Preenchimento de documentos por voz no VOZA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Preencher,
});

type Stop = { stop: () => Promise<Blob> };
const TUDO = "__tudo__";

function Preencher() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [estrutura, setEstrutura] = useState<Estrutura>([]);
  const [carregando, setCarregando] = useState(true);
  const [valores, setValores] = useState<Valores>({});
  const [gravando, setGravando] = useState<string | null>(null);
  const [processando, setProcessando] = useState<string | null>(null);
  const [transcricao, setTranscricao] = useState("");
  const [preenchidos, setPreenchidos] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [baixando, setBaixando] = useState(false);
  const recorderRef = useRef<Stop | null>(null);

  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase
        .from("modelos")
        .select("nome, estrutura")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) {
        toast.error("Modelo não encontrado.");
        void navigate({ to: "/modelos" });
        return;
      }
      setNome(data.nome);
      setEstrutura(normalizarEstrutura(data.estrutura));
      setCarregando(false);
    })();
  }, [id, navigate]);

  const setValor = (chave: string, valor: string) =>
    setValores((v) => ({ ...v, [chave]: valor }));

  const total = todosOsCampos(estrutura).length;
  const feitos = todosOsCampos(estrutura).filter((c) => (valores[c.chave] ?? "").trim()).length;

  async function microfone(alvo: string) {
    const campos: Campo[] =
      alvo === TUDO
        ? todosOsCampos(estrutura)
        : (estrutura.find((s) => s.id === alvo)?.campos ?? []);
    if (campos.length === 0) return;

    if (gravando === alvo) {
      const rec = recorderRef.current;
      recorderRef.current = null;
      setGravando(null);
      if (!rec) return;
      setProcessando(alvo);
      try {
        const blob = await rec.stop();
        if (blob.size < 2048) {
          toast.error("Gravação vazia. Tente falar novamente.");
          return;
        }
        const fd = new FormData();
        fd.append("audio", blob, "recording.wav");
        fd.append("campos", JSON.stringify(campos));
        const res = await fetch("/api/voice-fill", {
          method: "POST",
          headers: await cabecalhoAuth(),
          body: fd,
        });
        const data = (await res.json()) as {
          transcript?: string;
          fields?: Valores;
          error?: string;
        };
        if (!res.ok || data.error) {
          toast.error(data.error ?? "Não consegui processar o áudio.");
          return;
        }
        setTranscricao(data.transcript ?? "");
        const novos = data.fields ?? {};
        const chaves = Object.keys(novos);
        if (chaves.length === 0) {
          toast("Nada reconhecido nessa fala.", { description: data.transcript });
          return;
        }
        setValores((v) => ({ ...v, ...novos }));
        setPreenchidos(chaves);
        toast.success(`${chaves.length} campo(s) preenchido(s)`);
      } catch (err) {
        toast.error(mensagemErro(err, "Não consegui gravar o áudio. Tente de novo."));
      } finally {
        setProcessando(null);
      }
      return;
    }

    try {
      recorderRef.current = await startRecording();
      setGravando(alvo);
    } catch {
      toast.error("Preciso de acesso ao microfone para ouvir você.");
    }
  }

  async function salvar() {
    setSalvando(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      setSalvando(false);
      return;
    }
    const primeiro = estrutura[0]?.campos[0]?.chave;
    const titulo = (primeiro ? valores[primeiro] : "")?.trim() || `Ficha de ${nome}`;
    const { error } = await supabase.from("fichas").insert({
      user_id: uid,
      modelo_id: id,
      titulo: titulo.slice(0, 120),
      valores: valores as never,
    });
    setSalvando(false);
    if (error) {
      toast.error("Não consegui salvar a ficha.");
      return;
    }
    toast.success("Ficha salva na sua conta.");
  }

  async function exportarWord() {
    setBaixando(true);
    try {
      await baixarWord(nome, estrutura, valores);
      toast.success("Documento Word baixado.");
    } catch (err) {
      toast.error(mensagemErro(err, "Não consegui gerar o Word."));
    } finally {
      setBaixando(false);
    }
  }

  function exportarPdf() {
    try {
      baixarPdf(nome, estrutura, valores);
      toast.success("PDF baixado.");
    } catch (err) {
      toast.error(mensagemErro(err, "Não consegui gerar o PDF."));
    }
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </main>
    );
  }

  const gravandoTudo = gravando === TUDO;
  const processandoTudo = processando === TUDO;

  return (
    <main className="min-h-screen bg-muted/40 pb-36">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-3">
          <div className="min-w-0">
            <Link
              to="/modelos"
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" /> Meus modelos
            </Link>
            <h1 className="truncate text-base font-bold text-foreground">{nome}</h1>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{feitos}</span>/{total} campos
          </div>
        </div>
        <div className="h-1 w-full bg-muted">
          <div
            className="h-full rounded-r-full bg-primary transition-all duration-500"
            style={{ width: total ? `${(feitos / total) * 100}%` : "0%" }}
          />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6">
        {transcricao && (
          <div className="mb-4 rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Você disse
            </p>
            <p className="mt-1 text-sm text-foreground">{transcricao}</p>
          </div>
        )}

        {/* Folha do documento */}
        <article className="rounded-2xl border border-border bg-card px-6 py-8 shadow-lg sm:px-12 sm:py-12">
          <h2 className="text-center text-xl font-bold uppercase tracking-wide text-foreground">
            {nome}
          </h2>
          <div className="mx-auto mt-3 h-px w-24 bg-border" />

          <div className="mt-8 space-y-9">
            {estrutura.map((secao) => {
              const gravandoEssa = gravando === secao.id;
              const ocupada = processando === secao.id;
              return (
                <section key={secao.id}>
                  <div className="flex items-center justify-between gap-3 border-b border-border pb-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                      {secao.titulo}
                    </h3>
                    <Button
                      type="button"
                      size="sm"
                      variant={gravandoEssa ? "destructive" : "outline"}
                      className="h-8 shrink-0 gap-1.5 rounded-full px-3 text-xs"
                      aria-label={gravandoEssa ? "Parar gravação" : `Falar dados de ${secao.titulo}`}
                      disabled={ocupada || (gravando !== null && !gravandoEssa)}
                      onClick={() => microfone(secao.id)}
                    >
                      {ocupada ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : gravandoEssa ? (
                        <Square className="size-3.5" />
                      ) : (
                        <Mic className="size-3.5" />
                      )}
                      {gravandoEssa ? "Parar" : "Falar"}
                    </Button>
                  </div>
                  {secao.nota && (
                    <p className="mt-2 whitespace-pre-line rounded-lg bg-muted/60 px-3 py-2 text-xs italic text-foreground">
                      {secao.nota}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">{secao.dica}</p>


                  <div className="mt-4 space-y-3">
                    {secao.campos.map((campo) => {
                      const opcoes =
                        campo.tipo === "simnao" ? ["Sim", "Não"] : campo.opcoes ?? null;
                      const destacado = preenchidos.includes(campo.chave);
                      return (
                        <div
                          key={campo.chave}
                          className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3"
                        >
                          <span className="shrink-0 text-sm font-semibold text-foreground sm:w-56">
                            {campo.rotulo}:
                          </span>
                          {opcoes ? (
                            <div className="flex flex-wrap gap-2">
                              {opcoes.map((opt) => (
                                <Button
                                  key={opt}
                                  type="button"
                                  size="sm"
                                  className="h-7 rounded-full px-3 text-xs"
                                  variant={valores[campo.chave] === opt ? "default" : "outline"}
                                  onClick={() => setValor(campo.chave, opt)}
                                >
                                  {opt}
                                </Button>
                              ))}
                            </div>
                          ) : (
                            <Input
                              id={campo.chave}
                              type={campo.tipo === "data" ? "date" : "text"}
                              inputMode={campo.tipo === "numero" ? "decimal" : undefined}
                              value={valores[campo.chave] ?? ""}
                              placeholder="_______________"
                              onChange={(e) => setValor(campo.chave, e.target.value)}
                              className={`h-8 flex-1 rounded-none border-0 border-b bg-transparent px-1 shadow-none focus-visible:ring-0 ${
                                destacado
                                  ? "border-b-primary bg-primary/5 font-medium text-foreground"
                                  : "border-b-border"
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </article>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={salvar} disabled={salvando} variant="secondary" className="gap-2">
            {salvando ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Salvar ficha
          </Button>
          <Button onClick={exportarWord} disabled={baixando} className="gap-2">
            {baixando ? <Loader2 className="size-4 animate-spin" /> : <FileType2 className="size-4" />}
            Baixar Word
          </Button>
          <Button onClick={exportarPdf} variant="outline" className="gap-2">
            <FileText className="size-4" /> Baixar PDF
          </Button>
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() => {
              setValores({});
              setPreenchidos([]);
              setTranscricao("");
            }}
          >
            <RotateCcw className="size-4" /> Limpar
          </Button>
        </div>
      </div>

      {/* Microfone geral */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            {gravandoTudo
              ? "Ouvindo… fale os dados e toque para parar."
              : "Fale de uma vez só: eu distribuo cada dado no campo certo."}
          </p>
          <Button
            type="button"
            size="lg"
            variant={gravandoTudo ? "destructive" : "default"}
            className="shrink-0 gap-2 rounded-full px-6"
            disabled={processandoTudo || (gravando !== null && !gravandoTudo)}
            onClick={() => microfone(TUDO)}
          >
            {processandoTudo ? (
              <Loader2 className="size-5 animate-spin" />
            ) : gravandoTudo ? (
              <Square className="size-5" />
            ) : (
              <Mic className="size-5" />
            )}
            {gravandoTudo ? "Parar" : "Falar tudo"}
          </Button>
        </div>
      </div>
    </main>
  );
}
