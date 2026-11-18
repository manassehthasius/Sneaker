/**
 * KI-Foto-Rendering über die Google Gemini API (Bildmodell «Nano Banana»).
 * Der API-Schlüssel bleibt auf dem Server: GEMINI_API_KEY in .env.local bzw. in den Vercel-Umgebungsvariablen.
 */

const DEFAULT_MODELS = ["gemini-3.1-flash-image", "gemini-nano-banana-2.1", "gemini-3.1-flash-image-preview"];
const BASE = "https://generativelanguage.googleapis.com";

interface RenderRequest {
  /** Bild als Base64 (JPEG), ohne «data:»-Präfix */
  image: string;
  prompt: string;
  aspectRatio?: "1:1" | "4:3" | "3:4" | "16:9";
}

type Part = { text?: string; thought?: boolean; inlineData?: { mimeType: string; data: string }; inline_data?: { mime_type: string; data: string } };

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json(
      { error: "Kein API-Schlüssel eingerichtet. Lege in der Datei .env.local die Zeile GEMINI_API_KEY=… an (Schlüssel aus Google AI Studio) und starte das Studio neu." },
      { status: 501 },
    );
  }

  let body: RenderRequest;
  try {
    body = (await req.json()) as RenderRequest;
  } catch {
    return Response.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }
  if (!body.image || !body.prompt || body.image.length > 8_000_000) {
    return Response.json({ error: "Bild oder Beschreibung fehlt oder ist zu gross." }, { status: 400 });
  }

  const models = process.env.GEMINI_IMAGE_MODEL ? [process.env.GEMINI_IMAGE_MODEL] : DEFAULT_MODELS;
  const payload = {
    contents: [{ parts: [{ text: body.prompt }, { inline_data: { mime_type: "image/jpeg", data: body.image } }] }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: { aspectRatio: body.aspectRatio ?? "4:3", imageSize: "1K" },
    },
  };

  let lastError = "Unbekannter Fehler";
  for (const model of models) {
    for (const version of ["v1beta", "v1"]) {
      let res: globalThis.Response;
      try {
        res = await fetch(`${BASE}/${version}/models/${model}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify(payload),
        });
      } catch (e) {
        lastError = `Google ist nicht erreichbar (${(e as Error).message}).`;
        continue;
      }
      if (res.status === 404) {
        lastError = `Modell ${model} nicht gefunden.`;
        continue;
      }
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = json?.error?.message ?? `Fehler ${res.status}`;
        if (res.status === 400 && /model|not found|not supported/i.test(msg)) {
          lastError = msg;
          continue;
        }
        const status = res.status === 401 || res.status === 403 ? 401 : res.status === 429 ? 429 : 502;
        const hint = status === 401 ? "Der API-Schlüssel wurde abgelehnt. Prüfe ihn in Google AI Studio und ob die Abrechnung aktiviert ist." : status === 429 ? "Zu viele Anfragen oder Kontingent aufgebraucht. Bitte später erneut versuchen." : "";
        return Response.json({ error: [hint, msg].filter(Boolean).join(" ") }, { status });
      }
      const parts: Part[] = json?.candidates?.[0]?.content?.parts ?? [];
      const img = [...parts].reverse().find((p) => !p.thought && (p.inlineData?.data || p.inline_data?.data));
      if (!img) {
        const text = parts.map((p) => p.text).filter(Boolean).join(" ");
        return Response.json({ error: `Das Modell hat kein Bild geliefert. ${text}`.trim() }, { status: 502 });
      }
      const data = img.inlineData?.data ?? img.inline_data!.data;
      const mime = img.inlineData?.mimeType ?? img.inline_data?.mime_type ?? "image/png";
      return Response.json({ image: data, mime, model });
    }
  }
  return Response.json({ error: lastError }, { status: 502 });
}
