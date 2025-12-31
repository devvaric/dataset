export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Use POST with JSON body", { status: 400 });
    }

    const body = await request.json();
    const userPrompt = body.prompt;

    if (!userPrompt) {
      return new Response("Missing 'prompt'", { status: 400 });
    }

    const response = await env.AI.run(
      "@cf/mistral/mistral-7b-instruct-v0.2-lora",
      {
        messages: [
          {
            role: "system",
            content:
`You are a STRICTLY fine-tuned assistant.

You MUST answer ONLY questions that are explicitly supported by your fine-tuned training data.

If the question is unrelated, generic, or outside your training data
(e.g. general knowledge, definitions, companies, history),
you MUST respond with exactly:

REFUSE

Do not explain.
Do not add anything else.`
          },
          { role: "user", content: userPrompt }
        ],
        lora: "cirav-lora-mis-v2",
        temperature: 0.1,
        max_tokens: 200
      }
    );

    const output =
      response?.result?.response ||
      response?.result?.content ||
      "REFUSE";

    if (output.trim() !== "REFUSE" && output.length > 500) {
      return new Response(
        JSON.stringify({ result: "REFUSE" }),
        { headers: { "content-type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ result: output }), {
      headers: { "content-type": "application/json" }
    });
  }
};
