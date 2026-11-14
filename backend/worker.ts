interface Env {
  GROQ_API_KEY: string;
  IDENTIFY_LIMITER: {
    limit(options: { key: string }): Promise<{ success: boolean }>;
  };
}

const MAX_IMAGE_BASE64_LENGTH = 10_700_000;
const GROQ_CHAT_COMPLETIONS_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_VISION_MODEL = 'qwen/qwen3.8-27b';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/health') {
      return jsonResponse({ ok: true });
    }
    if (request.method !== 'POST' || url.pathname !== '/api/identify') {
      return jsonResponse({ error: 'Not found.' }, 404);
    }

    const contentLength = Number(request.headers.get('Content-Length'));
    if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BASE64_LENGTH + 100_000) {
      return jsonResponse({ error: 'The photo is too large. Choose a smaller image.' }, 413);
    }

    const { success } = await env.IDENTIFY_LIMITER.limit({
      key: request.headers.get('CF-Connecting-IP') ?? 'unknown',
    });
    if (!success) {
      return jsonResponse({ error: 'Too many photo identification requests. Please try again later.' }, 429);
    }
    if (!env.GROQ_API_KEY) {
      return jsonResponse({ error: 'Photo identification is not configured. Add the GROQ_API_KEY Cloudflare secret.' }, 503);
    }

    let image: unknown;
    try {
      const body = await request.json() as { image?: unknown };
      image = body.image;
    } catch {
      return jsonResponse({ error: 'A valid photo is required.' }, 400);
    }
    if (typeof image !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(image)) {
      return jsonResponse({ error: 'A valid JPEG photo is required.' }, 400);
    }
    if (image.length > MAX_IMAGE_BASE64_LENGTH) {
      return jsonResponse({ error: 'The photo is too large. Choose a smaller image.' }, 413);
    }

    try {
      const groqResponse = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_VISION_MODEL,
          temperature: 0.1,
          max_completion_tokens: 700,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: [
                'You are a careful bird identification assistant for birds found in Sri Lanka.',
                'Identify only birds that are visibly supported by the photo. Never invent visual details or force an identification.',
                'Return at most three candidate bird species in descending likelihood order. If no bird is visible or the image is too unclear, return {"matches":[]}.',
                'Return only valid JSON with this shape: {"matches":[{"commonName":"English common name","scientificName":"Scientific name","confidence":0.0,"notes":"Brief visible evidence"}]}.',
                'confidence must be a number from 0 to 1 representing visual certainty, not a guarantee.',
              ].join(' '),
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Identify the bird or birds visible in this photo.' },
                {
                  type: 'image_url',
                  image_url: { url: `data:image/jpeg;base64,${image}` },
                },
              ],
            },
          ],
        }),
      });

      if (groqResponse.status === 401 || groqResponse.status === 403) {
        console.error('Groq rejected the configured API key.');
        return jsonResponse({ error: 'The Groq API key is invalid or does not have access to the vision model.' }, 503);
      }
      if (groqResponse.status === 429) {
        return jsonResponse({ error: 'The free vision service is busy or its quota was reached. Please try again later.' }, 429);
      }
      if (!groqResponse.ok) {
        console.error('Groq vision request failed with status:', groqResponse.status);
        return jsonResponse({ error: 'The bird identification service is temporarily unavailable.' }, 502);
      }

      const groqPayload: unknown = await groqResponse.json();
      const content = getCompletionContent(groqPayload);
      if (!content) {
        return jsonResponse({ error: 'The vision service returned an empty identification.' }, 502);
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch {
        return jsonResponse({ error: 'The vision service returned an invalid identification.' }, 502);
      }
      const matches = normalizeMatches(parsed);
      if (!matches) {
        return jsonResponse({ error: 'The vision service returned an invalid identification.' }, 502);
      }

      return jsonResponse({ results: matches });
    } catch (error) {
      console.error('Groq bird identification request failed:', error);
      return jsonResponse({ error: 'Could not connect to the bird identification service. Please try again.' }, 502);
    }
  },
};

interface BirdMatch {
  taxon: {
    name: string;
    preferred_common_name: string;
  };
  original_combined_score: number;
}

function getCompletionContent(value: unknown): string {
  if (!isRecord(value) || !Array.isArray(value.choices)) return '';
  const firstChoice = value.choices[0];
  if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) return '';
  return typeof firstChoice.message.content === 'string' ? firstChoice.message.content.trim() : '';
}

function normalizeMatches(value: unknown): BirdMatch[] | null {
  if (!isRecord(value) || !Array.isArray(value.matches)) return null;

  return value.matches.slice(0, 3).flatMap((item): BirdMatch[] => {
    if (!isRecord(item)) return [];
    const commonName = readString(item.commonName);
    const scientificName = readString(item.scientificName);
    if (!commonName || !scientificName) return [];

    const confidence = typeof item.confidence === 'number' && Number.isFinite(item.confidence)
      ? Math.max(0, Math.min(1, item.confidence))
      : 0;
    return [{
      taxon: {
        name: scientificName,
        preferred_common_name: commonName,
      },
      original_combined_score: confidence,
    }];
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function corsHeaders(extraHeaders: Record<string, string> = {}): Headers {
  return new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
    ...extraHeaders,
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders({ 'Content-Type': 'application/json' }),
  });
}
