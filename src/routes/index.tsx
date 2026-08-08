import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Mic, Square, Loader2, FileDown, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SECTIONS, type FormValues } from "@/lib/form-schema";
import { startRecording } from "@/lib/recorder";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ficha de Abertura de Empresa por Voz | Innova" },
      {
        name: "description",
        content:
          "Preencha a ficha de abertura ou alteração de empresa falando: a voz é transcrita e os campos são preenchidos automaticamente.",
      },
      { property: "og:title", content: "Ficha de Abertura de Empresa por Voz | Innova" },
      {
        property: "og:description",
        content: "Fale os dados e a ficha contábil de abertura de empresa se preenche sozinha.",
      },
    ],
  }),
  component: Index,
});

type Stop = { stop: () => Promise<Blob> };

function Index() {
  const [values, setValues] = useState<FormValues>({});
  const [recordingSection, setRecordingSection] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [lastTranscript, setLastTranscript] = useState("");
  const [filled, setFilled] = useState<string[]>([]);
  const recorderRef = useRef<Stop | null>(null);

  const setValue = (key: string, value: string) => setValues((v) => ({ ...v, [key]: value }));

  async function handleMic(sectionId: string) {
    if (recordingSection === sectionId) {
      const rec = recorderRef.current;
      recorderRef.current = null;
      setRecordingSection(null);
      if (!rec) return;
      setProcessing(sectionId);
      try {
        const blob = await rec.stop();
        if (blob.size < 2048) {
          toast.error("Gravação vazia. Tente falar novamente.");
          return;
        }
        const fd = new FormData();
        fd.append("audio", blob, "recording.wav");
        fd.append("sectionId", sectionId);
        const res = await fetch("/api/voice-fill", { method: "POST", body: fd });
        const data = (await res.json()) as {
          transcript?: string;
          fields?: FormValues;
          error?: string;
        };
        if (!res.ok || data.error) {
          toast.error(data.error ?? "Não consegui processar o áudio.");
          return;
        }
        setLastTranscript(data.transcript ?? "");
        const fields = data.fields ?? {};
        const keys = Object.keys(fields);
        if (keys.length === 0) {
          toast("Nada reconhecido nessa fala.", { description: data.transcript });
          return;
        }
        setValues((v) => ({ ...v, ...fields }));
        setFilled(keys);
        toast.success(`${keys.length} campo(s) preenchido(s)`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao gravar.");
      } finally {
        setProcessing(null);
      }
      return;
    }

    try {
      recorderRef.current = await startRecording();
      setRecordingSection(sectionId);
    } catch {
      toast.error("Preciso de acesso ao microfone para ouvir você.");
    }
  }

  function exportar() {
    const lines = SECTIONS.map((s) => {
      const body = s.fields
        .map((f) => `${f.label}: ${values[f.key] ?? "____________"}`)
        .join("\n");
      return `${s.title.toUpperCase()}\n${body}`;
    }).join("\n\n");
    const text = `PROCESSO DE ABERTURA / ALTERAÇÃO DE EMPRESA\nInnova Contabilidade e Assessoria Contábil\n\n${lines}\n`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "ficha-abertura-empresa.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-background pb-28">
      <Toaster position="top-center" />
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-5 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Innova Contabilidade
          </p>
          <h1 className="mt-1 text-2xl font-bold leading-tight text-foreground">
            Ficha de abertura de empresa por voz
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Toque no microfone de cada bloco e fale naturalmente. Os campos são preenchidos
            sozinhos — você só confere.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-5 px-5 py-6">
        {lastTranscript && (
          <div className="rounded-xl border border-border bg-muted/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Você disse
            </p>
            <p className="mt-1 text-sm text-foreground">{lastTranscript}</p>
          </div>
        )}

        {SECTIONS.map((section) => {
          const isRec = recordingSection === section.id;
          const isBusy = processing === section.id;
          return (
            <section
              key={section.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{section.hint}</p>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant={isRec ? "destructive" : "default"}
                  className="size-12 shrink-0 rounded-full"
                  aria-label={isRec ? "Parar gravação" : `Falar dados de ${section.title}`}
                  disabled={isBusy || (recordingSection !== null && !isRec)}
                  onClick={() => handleMic(section.id)}
                >
                  {isBusy ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : isRec ? (
                    <Square className="size-5" />
                  ) : (
                    <Mic className="size-5" />
                  )}
                </Button>
              </div>

              {isRec && (
                <p className="mt-3 flex items-center gap-2 text-sm font-medium text-destructive">
                  <span className="inline-block size-2 animate-pulse rounded-full bg-destructive" />
                  Ouvindo… toque no quadrado para parar.
                </p>
              )}

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {section.fields.map((field) => (
                  <div
                    key={field.key}
                    className={field.type === "text" && !field.options ? "sm:col-span-2" : ""}
                  >
                    <Label htmlFor={field.key} className="text-xs text-muted-foreground">
                      {field.label}
                    </Label>
                    {field.options ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {field.options.map((opt) => (
                          <Button
                            key={opt}
                            type="button"
                            size="sm"
                            variant={values[field.key] === opt ? "default" : "outline"}
                            onClick={() => setValue(field.key, opt)}
                          >
                            {opt}
                          </Button>
                        ))}
                      </div>
                    ) : field.type === "boolean" ? (
                      <div className="mt-2 flex gap-2">
                        {["Sim", "Não"].map((opt) => (
                          <Button
                            key={opt}
                            type="button"
                            size="sm"
                            variant={values[field.key] === opt ? "default" : "outline"}
                            onClick={() => setValue(field.key, opt)}
                          >
                            {opt}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <Input
                        id={field.key}
                        type={field.type === "date" ? "date" : "text"}
                        inputMode={field.type === "number" ? "decimal" : undefined}
                        placeholder={field.placeholder}
                        value={values[field.key] ?? ""}
                        onChange={(e) => setValue(field.key, e.target.value)}
                        className={
                          filled.includes(field.key) ? "mt-1 ring-2 ring-primary/40" : "mt-1"
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        <div className="flex flex-wrap gap-3">
          <Button onClick={exportar} className="gap-2">
            <FileDown className="size-4" /> Exportar ficha
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              setValues({});
              setFilled([]);
              setLastTranscript("");
            }}
          >
            <RotateCcw className="size-4" /> Limpar
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Documentos necessários: RG/CNH, CPF, certidão de casamento, comprovante de endereço,
          declaração de IR, título de eleitor e certificado digital e-CPF (A1) ou senha GOV. Consulte
          os CNAEs em cnae.ibge.gov.br e o CCI no portal da Prefeitura de Palmas.
        </p>
      </div>
    </main>
  );
}
