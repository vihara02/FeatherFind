import { AIIdentificationMatch, AIIdentificationResult, Bird } from '../types';
import { getAllBirds } from '../db/birdsRepo';
import { getUserPreferences } from './storageService';

const GEMINI_MODEL = 'gemini-3.8-flash';
const MAX_RETRIES = 3;

export async function identifyBirdPhoto(
  photoUri: string,
  base64Data?: string | null
): Promise<AIIdentificationResult> {
  if (!base64Data) {
    throw new Error('The photo could not be read. Please take another photo or choose one from your gallery.');
  }

  const prefs = await getUserPreferences();
  const apiKey = prefs.geminiApiKey?.trim();
  if (!apiKey) {
    throw new Error('Add your Gemini API key in Profile settings to identify a bird.');
  }

  const allBirds = await getAllBirds();
  const matches = await callGeminiVisionAPI(base64Data, apiKey, allBirds);
  return {
    isOffline: false,
    matches,
    queryPhotoUri: photoUri,
    analyzedAt: new Date().toISOString(),
  };
}

async function callGeminiVisionAPI(
  base64Image: string,
  apiKey: string,
  knownBirds: Bird[]
): Promise<AIIdentificationMatch[]> {
  const prompt = `
You are an expert ornithologist identifying birds photographed in Sri Lanka.
Examine the image carefully. Never guess when the image does not show enough detail; return an empty array if you cannot identify a bird reliably. Return up to three candidates, ordered from most to least likely. Confidence must reflect the visible evidence and be between 0 and 1.
The local species catalogue is: ${knownBirds.map((bird) => `${bird.commonName} (${bird.scientificName})`).join(', ')}.
Respond only with a valid JSON array using this format:
[
  {
    "birdName": "Common English Name",
    "scientificName": "Scientific name",
    "confidence": 0.92,
    "description": "A short, useful overview of this bird.",
    "identifyingCharacteristics": ["Key trait 1 seen in photo", "Key trait 2", "Key trait 3"],
    "habitatInfo": "Typical habitat in Sri Lanka",
    "similarSpecies": ["Similar species 1", "Similar species 2"],
    "notes": "Short rationale for the identification"
  }
]`;

  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: base64Image,
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
    },
  };

  let response: Response | undefined;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        }
      );
    } catch {
      if (attempt === MAX_RETRIES) {
        if (controller.signal.aborted) {
          throw new Error('Bird identification timed out. Check your connection and try again.');
        }
        throw new Error('Could not connect to Gemini. Check your internet connection and try again.');
      }
      await waitForRetry(attempt);
      continue;
    } finally {
      clearTimeout(timeout);
    }

    if (response.ok || !isRetryableStatus(response.status) || attempt === MAX_RETRIES) {
      break;
    }
    await waitForRetry(attempt, response.headers.get('Retry-After'));
  }

  if (!response) {
    throw new Error('Could not connect to Gemini. Check your internet connection and try again.');
  }
  if (!response.ok) {
    if (response.status === 400 || response.status === 403) {
      throw new Error('Gemini rejected the API key or request. Check your key in Profile settings.');
    }
    if (response.status === 429) {
      throw new Error('Gemini is busy or the API quota has been reached. Please try again later.');
    }
    if (response.status === 503 || response.status >= 500) {
      throw new Error(`Gemini is temporarily unavailable (error ${response.status}). The app retried automatically; please wait a minute and try again.`);
    }
    throw new Error(`Gemini could not identify this photo (error ${response.status}). Please try again.`);
  }

  const data = await response.json() as GeminiResponse;
  const textContent = data.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text;
  if (!textContent) {
    throw new Error('Gemini did not return an identification. Try a clearer photo of one bird.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(textContent);
  } catch {
    throw new Error('Gemini returned an unreadable result. Please try again.');
  }
  const items = Array.isArray(parsed)
    ? parsed
    : isRecord(parsed) && Array.isArray(parsed.matches)
      ? parsed.matches
      : [parsed];
  const matches = items.filter(isRecord).flatMap((item): AIIdentificationMatch[] => {
    const birdName = readString(item.birdName);
    if (!birdName) return [];
    const scientificName = readString(item.scientificName);
    const matchingBird = knownBirds.find(
      (bird) =>
        bird.commonName.toLowerCase() === birdName.toLowerCase() ||
        (scientificName && bird.scientificName.toLowerCase() === scientificName.toLowerCase())
    );
    const confidence = typeof item.confidence === 'number' && Number.isFinite(item.confidence)
      ? Math.max(0, Math.min(1, item.confidence))
      : 0;
    const similarSpecies = readStringArray(item.similarSpecies);
    return [{
      birdName,
      scientificName: scientificName || matchingBird?.scientificName || '',
      confidence,
      matchingBird,
      description: readString(item.description) || matchingBird?.description || '',
      identifyingCharacteristics: readStringArray(item.identifyingCharacteristics),
      habitatInfo: readString(item.habitatInfo) || matchingBird?.habitat || '',
      similarSpecies: similarSpecies.length ? similarSpecies : matchingBird?.similarSpecies ?? [],
      notes: readString(item.notes),
    }];
  });
  if (matches.length === 0) {
    throw new Error('No bird could be identified. Try a close, well-lit photo with the bird in focus.');
  }
  return matches;
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

async function waitForRetry(attempt: number, retryAfter: string | null = null): Promise<void> {
  const retryAfterSeconds = retryAfter ? Number(retryAfter) : NaN;
  const delayMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
    ? Math.min(retryAfterSeconds * 1000, 10_000)
    : 1000 * (2 ** attempt) + Math.floor(Math.random() * 250);
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}
