import { createClient } from "@supabase/supabase-js";

/** Valida o token do usuário logado numa rota HTTP e devolve o id dele. */
export async function usuarioDaRequisicao(request: Request): Promise<string | null> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
  if (!url || !key) return null;

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}
