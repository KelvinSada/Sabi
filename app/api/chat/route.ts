import { convertToModelMessages, safeValidateUIMessages, streamText } from "ai";
import {
  CHAT_SYSTEM_PROMPT,
  getChatModel,
  MAX_OUTPUT_TOKENS,
} from "@/lib/ai-config";

export const maxDuration = 60;

const MAX_MESSAGES = 40;
const MAX_MESSAGE_CHARACTERS = 20_000;

export async function POST(request: Request) {
  if (!process.env.OPENROUTER_API_KEY) {
    return Response.json(
      {
        error:
          "The server is missing its OPENROUTER_API_KEY configuration.",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("messages" in body) ||
    !Array.isArray(body.messages)
  ) {
    return Response.json({ error: "A messages array is required." }, { status: 400 });
  }

  if (body.messages.length === 0 || body.messages.length > MAX_MESSAGES) {
    return Response.json(
      { error: `Send between 1 and ${MAX_MESSAGES} messages.` },
      { status: 400 },
    );
  }

  const validation = await safeValidateUIMessages({ messages: body.messages });
  if (!validation.success) {
    return Response.json({ error: "One or more messages are invalid." }, { status: 400 });
  }

  const messages = validation.data;
  if (messages.some((message) => !["user", "assistant"].includes(message.role))) {
    return Response.json(
      { error: "Only user and assistant messages are supported." },
      { status: 400 },
    );
  }

  if (messages.at(-1)?.role !== "user") {
    return Response.json(
      { error: "The latest message must be from the user." },
      { status: 400 },
    );
  }

  const hasUnsupportedParts = messages.some((message) =>
    message.parts.some((part) =>
      message.role === "user"
        ? part.type !== "text"
        : !["text", "reasoning", "step-start"].includes(part.type),
    ),
  );
  if (hasUnsupportedParts) {
    return Response.json(
      { error: "This conversation contains unsupported message content." },
      { status: 400 },
    );
  }

  const messageCharacters = messages.reduce(
    (total, message) =>
      total +
      message.parts.reduce(
        (length, part) =>
          length + (part.type === "text" ? part.text.length : 0),
        0,
      ),
    0,
  );
  if (messageCharacters > MAX_MESSAGE_CHARACTERS) {
    return Response.json(
      { error: "The conversation is too long. Start a new chat to continue." },
      { status: 413 },
    );
  }

  const result = streamText({
    model: getChatModel(),
    system: CHAT_SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    abortSignal: request.signal,
    maxRetries: 0,
    onError({ error }) {
      console.error("Chat generation failed:", error);
    },
  });

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      if (
        error instanceof Error &&
        /invalid credentials|invalid api key|unauthorized|invalid_token/i.test(
          error.message,
        )
      ) {
        return "OpenRouter rejected the server API key. Create a valid key in your OpenRouter dashboard, update OPENROUTER_API_KEY in .env, and restart the server.";
      }

      if (
        error instanceof Error &&
        /high demand|UNAVAILABLE|RESOURCE_EXHAUSTED|rate limit|too many requests|ECONNRESET|\b429\b|\b503\b/i.test(
          error.message,
        )
      ) {
        if (
          /quota exceeded|free_tier_requests|daily quota|free model.*limit/i.test(
            error.message,
          )
        ) {
          return "The free-model request limit has been reached. Wait for it to reset, or try again later.";
        }

        return "The free model is busy right now. Your conversation is still here—please try again in a moment.";
      }

      return "The assistant could not complete this response.";
    },
  });
}
