import { GoogleGenerativeAI } from "@google/generative-ai";

/** Models valid as of mid-2026 — avoid retired preview/1.5/2.0 IDs. */
const MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-2.5-flash",
  "gemini-3.1-flash-lite",
];

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();

  const attempts = [
    trimmed,
    trimmed
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim(),
  ];

  for (const candidate of attempts) {
    if (!candidate) continue;
    try {
      return JSON.parse(candidate);
    } catch {
      // try next
    }
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1));
  }

  throw new Error("Response did not contain valid JSON");
}

function readResponseText(
  response: Awaited<
    ReturnType<
      ReturnType<GoogleGenerativeAI["getGenerativeModel"]>["generateContent"]
    >
  >["response"]
): string | null {
  try {
    const text = response.text()?.trim();
    if (text) return text;
  } catch {
    // response.text() throws when no text parts exist
  }

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const joined = parts
    .map((part) => ("text" in part ? part.text : undefined))
    .filter(Boolean)
    .join("")
    .trim();

  return joined || null;
}

export interface GenerateJsonResult<T> {
  data: T | null;
  model?: string;
  error?: string;
}

export async function generateJsonWithMeta<T>(
  prompt: string
): Promise<GenerateJsonResult<T>> {
  const client = getClient();
  if (!client) {
    return { data: null, error: "GEMINI_API_KEY not set" };
  }

  let lastError = "All models failed";

  for (const modelName of MODELS) {
    try {
      const model = client.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      });

      const result = await model.generateContent(prompt);
      const finishReason = result.response.candidates?.[0]?.finishReason;

      if (finishReason === "SAFETY" || finishReason === "RECITATION") {
        lastError = `${modelName}: blocked (${finishReason})`;
        continue;
      }

      const text = readResponseText(result.response);
      if (!text) {
        lastError = `${modelName}: empty response`;
        continue;
      }

      const parsed = extractJson(text) as T;
      return { data: parsed, model: modelName };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown Gemini error";
      lastError = `${modelName}: ${message}`;
      console.error(`Gemini error (${modelName}):`, error);
    }
  }

  return { data: null, error: lastError };
}

export async function generateJson<T>(prompt: string): Promise<T | null> {
  const result = await generateJsonWithMeta<T>(prompt);
  return result.data;
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}
