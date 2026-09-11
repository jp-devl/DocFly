import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  FileUp,
  LogOut,
  Sparkles,
  Trash2,
  FileText,
  MoreHorizontal,
  ArrowRight,
  Inbox,
  ShieldCheck,
  FileCheck2,
  CircleCheck,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { Marca } from "@/components/marca";
import { TemaToggle } from "@/components/tema-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { cabecalhoAuth } from "@/lib/sessao";
import { normalizarEstrutura, type Estrutura } from "@/lib/estrutura";
import { MODELO_EXEMPLO } from "@/lib/modelo-exemplo";
import { mensagemErro } from "@/lib/erros";
import { ConsoleLeitura } from "@/components/console-leitura";


export const Route = createFileRoute("/_authenticated/modelos")({
  head: () => ({
    meta: [
      { title: "Meus modelos | Docfly" },
      {
        name: "description",
        content: "Envie documentos e gerencie os modelos de formulário que você preenche por voz.",
      },
      { property: "og:title", content: "Meus modelos | Docfly" },
      { property: "og:description", content: "Seus formulários de voz, sempre à mão." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Modelos,
});

type Modelo = {
  id: string;
  nome: string;
  descricao: string | null;
  arquivo_nome: string | null;
  estrutura: unknown;
  created_at: string;
};

const ACEITOS = [".doc", ".docx", ".pdf", ".txt", ".md"];

const FAMILIAS: Array<[RegExp, string]> = [
  [/\.(mov|mp4|avi|mkv|webm|wmv|m4v|3gp)$/i, "é um vídeo, e vídeos não têm texto para ler"],
  [/\.(mp3|wav|m4a|ogg|aac|flac)$/i, "é um áudio, e áudios não têm texto para ler"],
  [/\.(zip|rar|7z|tar|gz)$/i, "é um arquivo compactado; extraia e envie o documento de dentro"],
  [/\.(xls|xlsx|csv)$/i, "é uma planilha; salve como PDF antes de enviar"],
  [/\.(ppt|pptx)$/i, "é uma apresentação; salve como PDF antes de enviar"],
  [/\.(exe|dmg|apk|app)$/i, "é um programa, não um documento"],
];

/** Valida o arquivo antes de enviar e devolve a mensagem de erro em português. */
function validarArquivo(file: File): { erro: string; motivo: string } | null {
  const nome = file.name.toLowerCase();
  const ext = nome.slice(nome.lastIndexOf(".")) || "sem extensão";
  const imagem = file.type.startsWith("image/") || /\.(jpe?g|png|webp|heic|heif|gif|bmp)$/i.test(nome);

  if (file.size > 60 * 1024 * 1024) {
    return {
      erro: `O arquivo "${file.name}" tem ${(file.size / 1048576).toFixed(1)} MB e o limite é 60 MB.`,
      motivo: "arquivo grande demais para leitura",
    };
  }

  for (const [regex, motivo] of FAMILIAS) {
    if (regex.test(nome)) {
      return {
        erro: `O arquivo "${file.name}" não atende aos requisitos porque é ${ext}.`,
        motivo,
      };
    }
  }

  if (!imagem && !ACEITOS.some((a) => nome.endsWith(a))) {
    return {
      erro: `O arquivo "${file.name}" não atende aos requisitos porque é ${ext}.`,
      motivo: "esse formato não é aceito pelo leitor",
    };
  }
  return null;
}

function Modelos() {
  const navigate = useNavigate();
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [etapa, setEtapa] = useState("");
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [erro, setErro] = useState<{ erro: string; motivo: string } | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function carregar() {
    const { data, error } = await supabase
      .from("modelos")
      .select("id, nome, descricao, arquivo_nome, estrutura, created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error("Não consegui carregar seus modelos.");
    setModelos((data as Modelo[] | null) ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    void carregar();
  }, []);

  async function enviarArquivo(file: File) {
    setNomeArquivo(file.name);
    setErro(null);
    const invalido = validarArquivo(file);
    if (invalido) {
      setEnviando(true);
      setErro(invalido);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setEnviando(true);
    setEtapa("Lendo o documento…");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/parse-document", {
        method: "POST",
        headers: await cabecalhoAuth(),
        body: fd,
      });
      const data = (await res.json()) as {
        nome?: string;
        descricao?: string;
        estrutura?: Estrutura;
        error?: string;
      };
      if (!res.ok || data.error) throw new Error(data.error ?? "Falha ao ler o documento.");

      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Sessão expirada. Entre novamente.");

      setEtapa("Guardando o arquivo…");
      const path = `${uid}/${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
      const up = await supabase.storage.from("documentos").upload(path, file);

      setEtapa("Criando o formulário…");
      const { data: novo, error } = await supabase
        .from("modelos")
        .insert({
          user_id: uid,
          nome: data.nome ?? file.name,
          descricao: data.descricao ?? null,
          arquivo_nome: file.name,
          arquivo_path: up.error ? null : path,
          estrutura: (data.estrutura ?? []) as never,
        })
        .select("id")
        .single();
      if (error) throw error;

      toast.success("Formulário criado! Agora é só falar.");
      void navigate({ to: "/modelo/$id", params: { id: novo.id } });
    } catch (err) {
      const msg = mensagemErro(err, "Não consegui processar esse documento.");
      setErro({ erro: msg, motivo: "a leitura do documento não foi concluída" });
      setEtapa("");
      if (inputRef.current) inputRef.current.value = "";
      return;
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
    setEnviando(false);
    setEtapa("");
  }

  async function criarExemplo() {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    const { data, error } = await supabase
      .from("modelos")
      .insert({
        user_id: uid,
        nome: MODELO_EXEMPLO.nome,
        descricao: MODELO_EXEMPLO.descricao,
        estrutura: MODELO_EXEMPLO.estrutura as never,
      })
      .select("id")
      .single();
    if (error || !data) {
      toast.error("Não consegui criar o exemplo.");
      return;
    }
    void navigate({ to: "/modelo/$id", params: { id: data.id } });
  }

  async function excluir(id: string) {
    const { error } = await supabase.from("modelos").delete().eq("id", id);
    if (error) {
      toast.error("Não consegui excluir.");
      return;
    }
    setModelos((m) => m.filter((x) => x.id !== id));
    toast.success("Modelo excluído.");
  }

  async function sair() {
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  return (
    <main className="min-h-screen bg-muted/60 pb-24">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-card/80 backdrop-blur-xl transition-colors">
        <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="min-w-0 transition-transform duration-200 active:scale-95">
            <Marca tamanho="sm" />
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <TemaToggle />
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 rounded-full border-border/80 px-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-95"
              onClick={sair}
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="animate-fade-in">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-primary">
            <Sparkles className="size-3" /> Formulários por voz
          </span>
          <h1 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
            Meus modelos
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Envie um formulário em Word, PDF, texto ou foto. Eu descubro os campos e você preenche
            falando.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".doc,.docx,.pdf,.txt,.md,image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void enviarArquivo(f);
          }}
        />

        {enviando ? (
          <div className="mt-6 animate-fade-in">
            <ConsoleLeitura
              arquivo={nomeArquivo}
              etapa={etapa}
              erro={erro?.erro ?? null}
              motivo={erro?.motivo ?? null}
              onVoltar={() => {
                setErro(null);
                setEnviando(false);
              }}
              onTentarNovamente={() => {
                setErro(null);
                setEnviando(false);
                window.setTimeout(() => inputRef.current?.click(), 60);
              }}
            />
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setArrastando(true);
            }}
            onDragLeave={() => setArrastando(false)}
            onDrop={(e) => {
              e.preventDefault();
              setArrastando(false);
              const f = e.dataTransfer.files?.[0];
              if (f) void enviarArquivo(f);
            }}
            className={`group mt-6 animate-fade-in rounded-2xl border-2 border-dashed p-6 text-center shadow-sm transition-all duration-300 sm:p-8 ${
              arrastando
                ? "-translate-y-0.5 border-primary bg-primary/10 shadow-lg"
                : "border-primary/25 bg-card hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg active:translate-y-0 active:scale-[0.995]"
            }`}
          >
            <div className="mx-auto grid size-12 place-items-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-105">
              <FileUp className={`size-6 ${arrastando ? "" : "animate-float"}`} />
            </div>
            <p className="mt-4 text-base font-semibold text-foreground">
              Enviar um documento com lacunas
            </p>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Word, PDF, texto ou foto — até 60 MB
            </p>
            <div className="mt-5 flex flex-col items-stretch gap-2.5 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                onClick={() => inputRef.current?.click()}
                className="h-12 gap-2 px-7 text-base shadow-lg shadow-primary/20"
              >
                <FileUp className="size-5" /> Escolher arquivo
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={criarExemplo}
                className="h-12 gap-2 px-6 text-sm text-muted-foreground hover:text-foreground"
              >
                <Sparkles className="size-4" /> Usar modelo de exemplo
              </Button>
            </div>
            <p className="mt-4 hidden text-xs text-muted-foreground sm:block">
              ou arraste e solte o arquivo aqui
            </p>
          </div>
        )}

        <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-border/60 bg-card/50 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-5">
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-3.5 shrink-0 text-primary" />
            Seus documentos são processados com segurança.
          </span>
          <span className="flex items-center gap-2">
            <FileCheck2 className="size-3.5 shrink-0 text-primary" />
            Não alteramos o arquivo original.
          </span>
        </div>


        <div className="mt-9">
          {carregando ? (
            <div className="space-y-3" aria-label="Carregando documentos">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                  <div className="skeleton-shimmer size-11 shrink-0 rounded-xl bg-muted" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="skeleton-shimmer h-3.5 rounded-md bg-muted" style={{ width: `${62 + i * 8}%` }} />
                    <div className="skeleton-shimmer h-2.5 w-2/5 rounded-md bg-muted" />
                  </div>
                  <div className="skeleton-shimmer size-9 rounded-xl bg-muted" />
                </div>
              ))}
            </div>
          ) : modelos.length === 0 ? (
            <div className="animate-fade-in rounded-3xl border border-border/70 bg-card/60 px-6 py-12 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
                <Inbox className="size-5" />
              </div>
              <p className="mt-4 text-sm font-semibold text-foreground">Nenhum modelo ainda</p>
              <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                Os documentos que você enviar aparecerão aqui, prontos para preencher por voz.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Documentos recentes
                </h2>
                <span className="text-xs text-muted-foreground">{modelos.length}</span>
              </div>
              <div className="space-y-3">
                {modelos.map((m, i) => {
                  const campos = normalizarEstrutura(m.estrutura).reduce(
                    (n, s) => n + s.campos.length,
                    0,
                  );
                  const nomeArq = m.arquivo_nome ?? "";
                  const tipo = nomeArq.includes(".")
                    ? nomeArq.slice(nomeArq.lastIndexOf(".") + 1).toUpperCase()
                    : "MODELO";
                  const data = new Date(m.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });
                  return (
                    <div
                      key={m.id}
                      style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
                       className="animate-fade-in group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md active:translate-y-0 active:scale-[0.995]"
                    >
                       <span className="absolute inset-y-3 left-0 w-0.5 rounded-r-full bg-primary/70 opacity-0 transition-opacity group-hover:opacity-100" />
                       <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-primary/10 bg-primary/5 text-primary transition-transform duration-200 group-hover:scale-105">
                        <FileText className="size-5" />
                      </div>
                      <Link to="/modelo/$id" params={{ id: m.id }} className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">{m.nome}</p>
                         <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted-foreground">
                          <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium">
                            {tipo}
                          </span>
                           <span className="inline-flex items-center gap-1"><CalendarDays className="size-3" />{data}</span>
                          {campos > 0 ? <span>· {campos} campos</span> : null}
                           <span className="inline-flex items-center gap-1 font-medium text-foreground/70"><CircleCheck className="size-3 text-primary" />Pronto</span>
                        </div>
                      </Link>
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        aria-label={`Abrir ${m.nome}`}
                        className="hidden min-h-11 min-w-11 shrink-0 rounded-xl text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary sm:inline-flex"
                      >
                        <Link to="/modelo/$id" params={{ id: m.id }}>
                          <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Opções de ${m.nome}`}
                            className="min-h-11 min-w-11 shrink-0 rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem asChild>
                            <Link to="/modelo/$id" params={{ id: m.id }}>
                              <ArrowRight className="size-4" /> Continuar preenchendo
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => excluir(m.id)}
                          >
                            <Trash2 className="size-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

