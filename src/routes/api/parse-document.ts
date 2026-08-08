import { createFileRoute } from "@tanstack/react-router";
import { usuarioDaRequisicao } from "@/lib/api-auth.server";
import { lerDocumento, gerarEstruturaDoDocumento } from "@/lib/documento.server";
import { normalizarEstrutura } from "@/lib/estrutura";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/parse-document")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return json({ error: "Serviço de leitura indisponível." }, 500);

        const userId = await usuarioDaRequisicao(request);
        if (!userId) return json({ error: "Faça login para enviar documentos." }, 401);

        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File) || file.size === 0) {
          return json({ error: "Envie um arquivo válido." }, 400);
        }
        if (file.size > 15 * 1024 * 1024) {
          return json({ error: "O arquivo é maior que 15 MB." }, 400);
        }

        try {
          const conteudo = await lerDocumento(file);
          const bruto = (await gerarEstruturaDoDocumento(conteudo, file.name, key)) as Record<string, unknown>;
          const estrutura = normalizarEstrutura(bruto["secoes"]);
          if (estrutura.length === 0) {
            return json({ error: "Não encontrei campos para preencher nesse documento." }, 422);
          }
          return json({
            nome: String(bruto["nome"] ?? file.name).slice(0, 120),
            descricao: String(bruto["descricao"] ?? "").slice(0, 300),
            estrutura,
          });
        } catch (e) {
          return json({ error: e instanceof Error ? e.message : "Falha ao ler o documento." }, 400);
        }
      },
    },
  },
});
