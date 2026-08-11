import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, FileDown, Loader2, Mic, RotateCcw, Save, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { cabecalhoAuth } from "@/lib/sessao";
import { startRecording } from "@/lib/recorder";
import { mensagemErro } from "@/lib/erros";
import {
  fichaEmTexto,
  normalizarEstrutura,
  type Estrutura,
  type Valores,
} from "@/lib/estrutura";

export const Route = createFileRoute("/_authenticated/modelo/$id")({
  head: () => ({
    meta: [
      { title: "Preencher por voz | Vozforma" },
      {
        name: "description",
        content: "Fale os dados e veja os campos do seu formulário sendo preenchidos sozinhos.",
      },
      { property: "og:title", content: "Preencher por voz | Vozforma" },
      { property: "og:description", content: "Preenchimento de formulários por voz no Vozforma." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Preencher,
});

type Stop = { stop: () => Promise<Blob> };

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

  async function microfone(secaoId: string) {
    const secao = estrutura.find((s) => s.id === secaoId);
    if (!secao) return;

    if (gravando === secaoId) {
      const rec = recorderRef.current;
      recorderRef.current = null;
      setGravando(null);
      if (!rec) return;
      setProcessando(secaoId);
      try {
        const blob = await rec.stop();
        if (blob.size < 2048) {
          toast.error("Gravação vazia. Tente falar novamente.");
          return;
        }
        const fd = new FormData();
        fd.append("audio", blob, "recording.wav");
        fd.append("campos", JSON.stringify(secao.campos));
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
        const campos = data.fields ?? {};
        const chaves = Object.keys(campos);
        if (chaves.length === 0) {
          toast("Nada reconhecido nessa fala.", { description: data.transcript });
          return;
        }
        setValores((v) => ({ ...v, ...campos }));
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
      setGravando(secaoId);
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

  function exportar() {
    const texto = fichaEmTexto(nome, estrutura, valores);
    const url = URL.createObjectURL(new Blob([texto], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${nome.replace(/[^\w\-]+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/30 pb-24">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-5 py-4">
          <Link
            to="/modelos"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Meus modelos
          </Link>
          <h1 className="mt-2 text-xl font-bold leading-tight text-foreground">{nome}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Toque no microfone de cada bloco e fale naturalmente. Você só confere no final.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-5 px-5 py-6">
        {transcricao && (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Você disse
            </p>
            <p className="mt-1 text-sm text-foreground">{transcricao}</p>
          </div>
        )}

        {estrutura.map((secao) => {
          const gravandoEssa = gravando === secao.id;
          const ocupada = processando === secao.id;
          return (
            <section
              key={secao.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{secao.titulo}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{secao.dica}</p>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant={gravandoEssa ? "destructive" : "default"}
                  className="size-12 shrink-0 rounded-full"
                  aria-label={gravandoEssa ? "Parar gravação" : `Falar dados de ${secao.titulo}`}
                  disabled={ocupada || (gravando !== null && !gravandoEssa)}
                  onClick={() => microfone(secao.id)}
                >
                  {ocupada ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : gravandoEssa ? (
                    <Square className="size-5" />
                  ) : (
                    <Mic className="size-5" />
                  )}
                </Button>
              </div>

              {gravandoEssa && (
                <p className="mt-3 flex items-center gap-2 text-sm font-medium text-destructive">
                  <span className="inline-block size-2 animate-pulse rounded-full bg-destructive" />
                  Ouvindo… toque no quadrado para parar.
                </p>
              )}

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {secao.campos.map((campo) => {
                  const opcoes =
                    campo.tipo === "simnao" ? ["Sim", "Não"] : campo.opcoes ?? null;
                  return (
                    <div
                      key={campo.chave}
                      className={campo.longo || opcoes ? "sm:col-span-2" : ""}
                    >
                      <Label htmlFor={campo.chave} className="text-xs text-muted-foreground">
                        {campo.rotulo}
                      </Label>
                      {opcoes ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {opcoes.map((opt) => (
                            <Button
                              key={opt}
                              type="button"
                              size="sm"
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
                          onChange={(e) => setValor(campo.chave, e.target.value)}
                          className={
                            preenchidos.includes(campo.chave) ? "mt-1 ring-2 ring-primary/40" : "mt-1"
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        <div className="flex flex-wrap gap-3">
          <Button onClick={salvar} disabled={salvando} className="gap-2">
            {salvando ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Salvar ficha
          </Button>
          <Button variant="outline" onClick={exportar} className="gap-2">
            <FileDown className="size-4" /> Exportar
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
    </main>
  );
}
