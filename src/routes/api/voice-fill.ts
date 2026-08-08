import { createFileRoute } from "@tanstack/react-router";
import { usuarioDaRequisicao } from "@/lib/api-auth.server";
import type { Campo } from "@/lib/estrutura";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/voice-fill")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return json({ error: "Serviço de voz indisponível." }, 500);

        const userId = await usuarioDaRequisicao(request);
        if (!userId) return json({ error: "Faça login para usar a voz." }, 401);

        const form = await request.formData();
        const audio = form.get("audio");
        if (!(audio instanceof File) || audio.size < 2048) {
          return json({ error: "Áudio muito curto. Grave novamente." }, 400);
        }

        let campos: Campo[] = [];
        try {
          const raw = JSON.parse(String(form.get("campos") ?? "[]"));
          if (Array.isArray(raw)) campos = raw as Campo[];
        } catch {
          campos = [];
        }
        if (campos.length === 0) return json({ error: "Nenhum campo informado." }, 400);

        const upstream = new FormData();
        upstream.append("model", "openai/gpt-4o-mini-transcribe");
        upstream.append("file", audio, "recording.wav");
        upstream.append("language", "pt");

        const sttRes = await fetch(`${GATEWAY}/audio/transcriptions`, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}` },
          body: upstream,
        });
        if (!sttRes.ok) {
          const body = await sttRes.text().catch(() => "");
          return json({ error: `Falha na transcrição: ${body.slice(0, 200)}` }, sttRes.status);
        }
        const stt = (await sttRes.json()) as { text?: string };
        const transcript = (stt.text ?? "").trim();
        if (!transcript) return json({ transcript: "", fields: {} });

        const fieldSpec = campos
          .map((f) => {
            const opts = f.opcoes ? ` | valores possíveis: ${f.opcoes.join(" / ")}` : "";
            const tipo = f.tipo === "simnao" ? "Sim/Não" : f.tipo;
            return `- ${f.chave}: ${f.rotulo} (${tipo}${opts})`;
          })
          .join("\n");

        const chatRes = await fetch(`${GATEWAY}/chat/completions`, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3.6-flash",
            messages: [
              {
                role: "system",
                content:
                  "Você preenche um formulário a partir de uma fala em português do Brasil. " +
                  "Retorne SOMENTE um objeto JSON com as chaves citadas na fala. Não invente dados. " +
                  "Omita chaves não mencionadas. Datas no formato AAAA-MM-DD. Valores monetários e áreas apenas com números (use ponto decimal). " +
                  'Campos com valores possíveis devem receber exatamente um dos valores listados. Campos Sim/Não recebem "Sim" ou "Não".\n\nCampos:\n' +
                  fieldSpec,
              },
              { role: "user", content: transcript },
            ],
            response_format: { type: "json_object" },
          }),
        });
        if (!chatRes.ok) {
          const body = await chatRes.text().catch(() => "");
          return json({ transcript, error: `Falha na extração: ${body.slice(0, 200)}` }, chatRes.status);
        }
        const chat = (await chatRes.json()) as { choices?: { message?: { content?: string } }[] };
        let parsed: Record<string, unknown> = {};
        try {
          parsed = JSON.parse(chat.choices?.[0]?.message?.content ?? "{}");
        } catch {
          parsed = {};
        }

        const allowed = new Set(campos.map((f) => f.chave));
        const result: Record<string, string> = {};
        for (const [k, v] of Object.entries(parsed)) {
          if (!allowed.has(k) || v == null || v === "") continue;
          result[k] = String(v);
        }

        return json({ transcript, fields: result });
      },
    },
  },
});
