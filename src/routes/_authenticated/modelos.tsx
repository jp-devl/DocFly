import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { FileUp, Loader2, LogOut, Sparkles, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cabecalhoAuth } from "@/lib/sessao";
import { normalizarEstrutura, type Estrutura } from "@/lib/estrutura";
import { MODELO_EXEMPLO } from "@/lib/modelo-exemplo";
import { mensagemErro } from "@/lib/erros";
import { ConsoleLeitura } from "@/components/console-leitura";

export const Route = createFileRoute("/_authenticated/modelos")({
  head: () => ({
    meta: [
      { title: "Meus modelos | Vozforma" },
      {
        name: "description",
        content: "Envie documentos e gerencie os modelos de formulário que você preenche por voz.",
      },
      { property: "og:title", content: "Meus modelos | Vozforma" },
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

function Modelos() {
  const navigate = useNavigate();
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [etapa, setEtapa] = useState("");
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
      toast.error(mensagemErro(err, "Não consegui processar esse documento."));
    } finally {
      setEnviando(false);
      setEtapa("");
      if (inputRef.current) inputRef.current.value = "";
    }
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
    <main className="min-h-screen bg-muted/30 pb-20">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link to="/" className="text-lg font-bold tracking-tight text-foreground">
            Voz<span className="text-primary">forma</span>
          </Link>
          <Button variant="ghost" size="sm" className="gap-2" onClick={sair}>
            <LogOut className="size-4" /> Sair
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-7">
        <h1 className="text-2xl font-bold text-foreground">Meus modelos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Envie um formulário em Word, PDF, texto ou foto. Eu descubro os campos e você preenche
          falando.
        </p>

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
          <div className="mt-5">
            <ConsoleLeitura arquivo={nomeArquivo} etapa={etapa} />
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-primary/40 bg-card p-6 text-center">
            <FileUp className="mx-auto size-7 text-primary" />
            <p className="mt-3 text-sm font-medium text-foreground">
              Enviar um documento com lacunas
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Word, PDF, texto ou foto — até 60 MB
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button onClick={() => inputRef.current?.click()} className="gap-2">
                <FileUp className="size-4" /> Escolher arquivo
              </Button>
              <Button variant="outline" onClick={criarExemplo} className="gap-2">
                <Sparkles className="size-4" /> Usar modelo de exemplo
              </Button>
            </div>
          </div>
        )}


        <div className="mt-7 space-y-3">
          {carregando ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : modelos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum modelo ainda. Envie seu primeiro documento acima.
            </p>
          ) : (
            modelos.map((m) => {
              const campos = normalizarEstrutura(m.estrutura).reduce(
                (n, s) => n + s.campos.length,
                0,
              );
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
                >
                  <FileText className="size-5 shrink-0 text-primary" />
                  <Link
                    to="/modelo/$id"
                    params={{ id: m.id }}
                    className="min-w-0 flex-1"
                  >
                    <p className="truncate font-medium text-foreground">{m.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {campos} campos {m.arquivo_nome ? `· ${m.arquivo_nome}` : ""}
                    </p>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Excluir ${m.nome}`}
                    onClick={() => excluir(m.id)}
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
