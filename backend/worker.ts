interface Env {
  INAT_OAUTH_ACCESS_TOKEN: string;
  IDENTIFY_LIMITER: {
    limit(options: { key: string }): Promise<{ success: boolean }>;
  };
}

const MAX_IMAGE_BASE64_LENGTH = 10_700_000;
const INAT_API_TOKEN_URL = 'https://www.inaturalist.org/users/api_token';
const INAT_COMPUTER_VISION_URL = 'https://api.inaturalist.org/v1/computervision/score_image';

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
    if (!env.INAT_OAUTH_ACCESS_TOKEN) {
      return jsonResponse({ error: 'The iNaturalist connection is not configured.' }, 503);
    }

    let image: unknown;
    try {
      const body = await request.json() as { image?: unknown };
      image = body.image;
    } catch {
      return jsonResponse({ error: 'A valid photo is required.' }, 400);
    }
    if (typeof image !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(image)) {
      return jsonResponse({ error: 'A valid photo is required.' }, 400);
    }
    if (image.length > MAX_IMAGE_BASE64_LENGTH) {
      return jsonResponse({ error: 'The photo is too large. Choose a smaller image.' }, 413);
    }

    try {
      const tokenResponse = await fetch(INAT_API_TOKEN_URL, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${env.INAT_OAUTH_ACCESS_TOKEN}`,
        },
      });
      if (!tokenResponse.ok) {
        return jsonResponse({ error: 'The iNaturalist authorization has expired or is invalid.' }, 502);
      }

      const tokenData: unknown = await tokenResponse.json();
      if (!isRecord(tokenData) || typeof tokenData.api_token !== 'string' || !tokenData.api_token) {
        return jsonResponse({ error: 'iNaturalist did not provide an API token.' }, 502);
      }

      const imageBytes = decodeBase64(image);
      const imageBuffer = new ArrayBuffer(imageBytes.byteLength);
      new Uint8Array(imageBuffer).set(imageBytes);
      const formData = new FormData();
      formData.append('image', new Blob([imageBuffer], { type: 'image/jpeg' }), 'bird.jpg');
      formData.append('taxon_id', '3');
      formData.append('per_page', '3');

      const identificationResponse = await fetch(INAT_COMPUTER_VISION_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${tokenData.api_token}`,
        },
        body: formData,
      });
      if (!identificationResponse.ok) {
        return jsonResponse({ error: 'iNaturalist could not process this photo right now.' }, 502);
      }

      return new Response(await identificationResponse.text(), {
        status: 200,
        headers: corsHeaders({ 'Content-Type': 'application/json' }),
      });
    } catch (error) {
      console.error('iNaturalist identification request failed:', error);
      return jsonResponse({ error: 'The iNaturalist service could not be reached. Please try again.' }, 502);
    }
  },
};

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
