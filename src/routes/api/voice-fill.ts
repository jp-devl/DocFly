import { createFileRoute } from "@tanstack/react-router";
import { ALL_FIELDS } from "@/lib/form-schema";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

export const Route = createFileRoute("/api/voice-fill")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const form = await request.formData();
        const audio = form.get("audio");
        const sectionId = String(form.get("sectionId") ?? "");
        if (!(audio instanceof File) || audio.size < 2048) {
          return new Response(JSON.stringify({ error: "Áudio muito curto. Grave novamente." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

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
          return new Response(JSON.stringify({ error: `Falha na transcrição: ${body}` }), {
            status: sttRes.status,
            headers: { "Content-Type": "application/json" },
          });
        }
        const stt = (await sttRes.json()) as { text?: string };
        const transcript = (stt.text ?? "").trim();
        if (!transcript) {
          return new Response(JSON.stringify({ transcript: "", fields: {} }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        const fields = ALL_FIELDS;
        void sectionId;
        const fieldSpec = fields
          .map((f) => {
            const opts = f.options ? ` | valores possíveis: ${f.options.join(" / ")}` : "";
            const type = f.type === "boolean" ? "Sim/Não" : f.type;
            return `- ${f.key}: ${f.label} (${type}${opts})`;
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
                  "Você preenche uma ficha de abertura de empresa a partir de uma fala em português do Brasil. " +
                  "Retorne SOMENTE um objeto JSON com as chaves citadas na fala. Não invente dados. " +
                  "Omita chaves não mencionadas. Datas no formato AAAA-MM-DD. Valores monetários e áreas apenas com números (use ponto decimal). " +
                  "Campos com valores possíveis devem receber exatamente um dos valores listados. Campos Sim/Não recebem \"Sim\" ou \"Não\".\n\nCampos:\n" +
                  fieldSpec,
              },
              { role: "user", content: transcript },
            ],
            response_format: { type: "json_object" },
          }),
        });
        if (!chatRes.ok) {
          const body = await chatRes.text().catch(() => "");
          return new Response(JSON.stringify({ transcript, error: `Falha na extração: ${body}` }), {
            status: chatRes.status,
            headers: { "Content-Type": "application/json" },
          });
        }
        const chat = (await chatRes.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        let parsed: Record<string, unknown> = {};
        try {
          parsed = JSON.parse(chat.choices?.[0]?.message?.content ?? "{}");
        } catch {
          parsed = {};
        }

        const allowed = new Set(ALL_FIELDS.map((f) => f.key));
        const result: Record<string, string> = {};
        for (const [k, v] of Object.entries(parsed)) {
          if (!allowed.has(k) || v == null || v === "") continue;
          result[k] = String(v);
        }

        return new Response(JSON.stringify({ transcript, fields: result }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
