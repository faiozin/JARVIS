import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
          "A chave da API OpenAI não está configurada. Adicione OPENAI_API_KEY como um secret da edge function.",
      }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio");
    const language = formData.get("language")?.toString() || "pt";

    if (!audioFile || !(audioFile instanceof File)) {
      return new Response(JSON.stringify({ error: "Arquivo de áudio ausente." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openaiFormData = new FormData();
    openaiFormData.append("file", audioFile, audioFile.name || "recording.webm");
    openaiFormData.append("model", "whisper-1");
    openaiFormData.append("language", language);
    openaiFormData.append("response_format", "json");

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: openaiFormData,
      }
    );

    if (!openaiResponse.ok) {
      await openaiResponse.text().catch(() => "");
      return new Response(
        JSON.stringify({
          error: `O serviço de transcrição retornou erro ${openaiResponse.status}.`,
        }),
        {
          status: openaiResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await openaiResponse.json();
    return new Response(
      JSON.stringify({ text: data.text ?? "" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno.";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
