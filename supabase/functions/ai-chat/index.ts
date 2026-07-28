import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface IncomingMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface IncomingBody {
  messages: IncomingMessage[];
  preferences: {
    ai_name?: string;
    user_name?: string | null;
    personality?: string;
  };
  memory?: Record<string, string>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido." }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY");

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          "A chave da API OpenAI não está configurada no servidor. Adicione OPENAI_API_KEY como um secret da edge function.",
      }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: IncomingBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Corpo da requisição inválido." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response(JSON.stringify({ error: "Mensagens ausentes." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const send = (data: unknown) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

        try {
          const openaiResponse = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: body.messages,
                stream: true,
                temperature: 0.7,
                max_tokens: 1024,
              }),
            }
          );

          if (!openaiResponse.ok || !openaiResponse.body) {
            await openaiResponse.text().catch(() => "");
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  error: `O serviço de IA retornou erro ${openaiResponse.status}.`,
                })}\n\n`
              )
            );
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            return;
          }

          const reader = openaiResponse.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              const payload = trimmed.slice(5).trim();
              if (payload === "[DONE]") continue;

              try {
                const chunk = JSON.parse(payload);
                const token = chunk?.choices?.[0]?.delta?.content;
                if (token) {
                  send({ token });
                }
              } catch {
                /* skip malformed chunk */
              }
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          const message = err instanceof Error ? err.message : "Erro desconhecido.";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno.";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
