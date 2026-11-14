export interface BirdTaxonSuggestion {
  id: number;
  scientificName: string;
  commonName: string;
  imageUrl: string | null;
  imageAttribution: string | null;
  observationsCount: number;
}

const INAT_TAXA_URL = 'https://api.inaturalist.org/v1/taxa/autocomplete';

export async function searchBirdTaxa(query: string, signal: AbortSignal): Promise<BirdTaxonSuggestion[]> {
  const params = new URLSearchParams({
    q: query.trim(),
    taxon_id: '3',
    rank: 'species',
    is_active: 'true',
    per_page: '10',
    locale: 'en',
  });
  const response = await fetch(`${INAT_TAXA_URL}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('iNaturalist is receiving too many searches. Please try again in a minute.');
    }
    throw new Error(`iNaturalist search failed (error ${response.status}).`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error('iNaturalist returned an invalid search response.');
  }
  if (!isRecord(payload) || !Array.isArray(payload.results)) {
    throw new Error('iNaturalist returned an invalid search response.');
  }

  return payload.results.flatMap((item): BirdTaxonSuggestion[] => {
    if (!isRecord(item) || item.rank !== 'species' || item.iconic_taxon_id !== 3) {
      return [];
    }
    const id = readNumber(item.id);
    const scientificName = readString(item.name);
    if (!id || !scientificName) return [];

    const photo = isRecord(item.default_photo) ? item.default_photo : null;
    const imageAttribution = photo ? readString(photo.attribution) : '';
    const imageUrl = photo && readString(photo.license_code) && imageAttribution
      ? readString(photo.medium_url) || readString(photo.square_url) || null
      : null;

    return [{
      id,
      scientificName,
      commonName: readString(item.preferred_common_name) || scientificName,
      imageUrl,
      imageAttribution: imageUrl ? imageAttribution : null,
      observationsCount: readNumber(item.observations_count) ?? 0,
    }];
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
