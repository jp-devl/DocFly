import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar no Vozforma" },
      {
        name: "description",
        content: "Acesse sua conta Vozforma para enviar documentos e preencher formulários falando.",
      },
      { property: "og:title", content: "Entrar no Vozforma" },
      { property: "og:description", content: "Entre com e-mail e senha ou com sua conta Google." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [aguardandoEmail, setAguardandoEmail] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) void navigate({ to: "/modelos", replace: true });
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/modelos", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    try {
      if (modo === "criar") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          setAguardandoEmail(true);
          toast.success("Confirme seu e-mail para ativar a conta.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Não foi possível continuar.";
      toast.error(
        msg.includes("Invalid login") ? "E-mail ou senha incorretos." :
        msg.includes("already registered") ? "Esse e-mail já tem conta. Faça login." : msg,
      );
    } finally {
      setCarregando(false);
    }
  }

  async function entrarComGoogle() {
    setCarregando(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setCarregando(false);
      toast.error("Não foi possível entrar com o Google.");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/modelos", replace: true });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-5 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="block text-center text-lg font-bold tracking-tight text-foreground">
          Voz<span className="text-primary">forma</span>
        </Link>

        <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-foreground">
            {modo === "entrar" ? "Entrar na sua conta" : "Criar uma conta"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Seus modelos e fichas ficam salvos e privados.
          </p>

          {aguardandoEmail ? (
            <p className="mt-6 rounded-xl bg-muted p-4 text-sm text-foreground">
              Enviamos um link de confirmação para <strong>{email}</strong>. Abra o e-mail para
              ativar a conta e depois volte aqui para entrar.
            </p>
          ) : (
            <form onSubmit={enviar} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  autoComplete={modo === "criar" ? "new-password" : "current-password"}
                  required
                  minLength={6}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={carregando}>
                {carregando && <Loader2 className="size-4 animate-spin" />}
                {modo === "entrar" ? "Entrar" : "Criar conta"}
              </Button>
            </form>
          )}

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">ou</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={carregando}
            onClick={entrarComGoogle}
          >
            Continuar com Google
          </Button>

          <button
            type="button"
            className="mt-5 w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => {
              setAguardandoEmail(false);
              setModo(modo === "entrar" ? "criar" : "entrar");
            }}
          >
            {modo === "entrar" ? "Não tenho conta ainda" : "Já tenho conta"}
          </button>
        </div>
      </div>
    </main>
  );
}
