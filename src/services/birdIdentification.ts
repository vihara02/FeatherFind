import { AIIdentificationMatch, AIIdentificationResult } from '../types';
import { getAllBirds } from '../db/birdsRepo';

const IDENTIFICATION_API_URL = process.env.EXPO_PUBLIC_BIRD_IDENTIFICATION_API_URL?.trim();

export async function identifyBirdPhoto(
  photoUri: string,
  base64Data?: string | null
): Promise<AIIdentificationResult> {
  if (!base64Data) {
    throw new Error('The photo could not be read. Please take another photo or choose one from your gallery.');
  }
  if (!IDENTIFICATION_API_URL) {
    throw new Error('Bird identification is not configured. Set up the free iNaturalist connection and try again.');
  }

  let response: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    response = await fetch(IDENTIFICATION_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Data }),
      signal: controller.signal,
    });
  } catch {
    if (controller.signal.aborted) {
      throw new Error('Bird identification timed out. Check your connection and try again.');
    }
    throw new Error('Could not connect to the bird identification service. Check your connection and try again.');
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('The iNaturalist connection needs attention. Please contact the app administrator.');
    }
    if (response.status === 429) {
      throw new Error('The free identification service is busy. Please wait a moment and try again.');
    }
    throw new Error(`Bird identification failed (error ${response.status}). Please try again.`);
  }

  let data: INaturalistVisionResponse;
  try {
    data = await response.json() as INaturalistVisionResponse;
  } catch {
    throw new Error('The bird identification service returned an invalid response. Please try again.');
  }
  const birds = await getAllBirds();
  const matches = (Array.isArray(data.results) ? data.results : [])
    .flatMap((result): AIIdentificationMatch[] => {
      if (!isRecord(result)) return [];
      const taxon = isRecord(result.taxon) ? result.taxon : {};
      const scientificName = readString(taxon?.name);
      const birdName = readString(taxon?.preferred_common_name) || scientificName;
      if (!birdName) return [];

      const matchingBird = birds.find(
        (bird) =>
          bird.scientificName.toLowerCase() === scientificName.toLowerCase() ||
          bird.commonName.toLowerCase() === birdName.toLowerCase()
      );
      const score = readNumber(result.original_combined_score)
        ?? readNumber(result.score)
        ?? readNumber(result.vision_score);
      const confidence = typeof score === 'number' && Number.isFinite(score)
        ? Math.max(0, Math.min(1, score))
        : 0;

      return [{
        birdName,
        scientificName,
        confidence,
        matchingBird,
        description: matchingBird?.description ?? 'Suggested by iNaturalist computer vision. Check the visible features before confirming.',
        identifyingCharacteristics: matchingBird?.identificationCharacteristics ?? [],
        habitatInfo: matchingBird?.habitat ?? '',
        similarSpecies: matchingBird?.similarSpecies ?? [],
        notes: 'Computer-vision suggestion; compare the bird’s visible features to confirm.',
      }];
    });

  if (matches.length === 0) {
    throw new Error('iNaturalist could not identify a bird in this photo. Try a clear, close-up image with one bird in focus.');
  }

  return {
    isOffline: false,
    matches,
    queryPhotoUri: photoUri,
    analyzedAt: new Date().toISOString(),
  };
}

interface INaturalistVisionResponse {
  results?: unknown[];
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
