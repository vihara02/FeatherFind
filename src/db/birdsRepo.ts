import { getDatabase } from './database';
import { Bird, BirdFilter } from '../types';

interface BirdRow {
  id: string;
  common_name: string;
  scientific_name: string;
  sinhala_name: string;
  tamil_name: string;
  family: string;
  order_name: string;
  description: string;
  physical_characteristics: string;
  average_size: string;
  habitat: string;
  habitat_category: string;
  distribution_sl: string;
  diet: string;
  behavior: string;
  conservation_status: string;
  iucn_code: string;
  identification_keys: string;
  interesting_facts: string;
  similar_species: string;
  image_url: string;
  local_image_key: string;
  is_endemic: number;
  is_favorite?: number;
  is_spotted?: number;
}

function mapRowToBird(row: BirdRow): Bird {
  let idKeys: string[] = [];
  let facts: string[] = [];
  let similar: string[] = [];

  try {
    idKeys = row.identification_keys ? JSON.parse(row.identification_keys) : [];
  } catch (e) {
    idKeys = [];
  }
  try {
    facts = row.interesting_facts ? JSON.parse(row.interesting_facts) : [];
  } catch (e) {
    facts = [];
  }
  try {
    similar = row.similar_species ? JSON.parse(row.similar_species) : [];
  } catch (e) {
    similar = [];
  }

  return {
    id: row.id,
    commonName: row.common_name,
    scientificName: row.scientific_name,
    sinhalaName: row.sinhala_name || '',
    tamilName: row.tamil_name || '',
    family: row.family,
    orderName: row.order_name,
    description: row.description,
    physicalCharacteristics: row.physical_characteristics,
    averageSize: row.average_size,
    habitat: row.habitat,
    habitatCategory: row.habitat_category as any,
    distributionInSriLanka: row.distribution_sl,
    diet: row.diet,
    behavior: row.behavior,
    conservationStatus: row.conservation_status as any,
    iucnCode: row.iucn_code as any,
    identificationCharacteristics: idKeys,
    interestingFacts: facts,
    similarSpecies: similar,
    imageUrl: row.image_url,
    localImageKey: row.local_image_key,
    isEndemic: row.is_endemic === 1,
    isFavorite: (row.is_favorite ?? 0) === 1,
    isSpotted: (row.is_spotted ?? 0) === 1,
  };
}

export async function getAllBirds(filter?: BirdFilter): Promise<Bird[]> {
  const db = await getDatabase();
  let query = `
    SELECT b.*, 
      CASE WHEN f.bird_id IS NOT NULL THEN 1 ELSE 0 END AS is_favorite,
      CASE WHEN c.is_spotted = 1 THEN 1 ELSE 0 END AS is_spotted
    FROM birds b
    LEFT JOIN favorites f ON b.id = f.bird_id
    LEFT JOIN checklist c ON b.id = c.bird_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filter?.searchQuery && filter.searchQuery.trim().length > 0) {
    const q = `%${filter.searchQuery.trim().toLowerCase()}%`;
    query += ` AND (LOWER(b.common_name) LIKE ? OR LOWER(b.scientific_name) LIKE ? OR LOWER(b.sinhala_name) LIKE ? OR LOWER(b.family) LIKE ?)`;
    params.push(q, q, q, q);
  }

  if (filter?.endemicOnly) {
    query += ` AND b.is_endemic = 1`;
  }

  if (filter?.habitat && filter.habitat !== 'all') {
    query += ` AND (b.habitat_category = ? OR LOWER(b.habitat) LIKE ?)`;
    params.push(filter.habitat, `%${filter.habitat}%`);
  }

  if (filter?.family && filter.family !== 'all') {
    query += ` AND b.family = ?`;
    params.push(filter.family);
  }

  if (filter?.conservationStatus && filter.conservationStatus !== 'all') {
    query += ` AND b.conservation_status = ?`;
    params.push(filter.conservationStatus);
  }

  if (filter?.sortBy === 'name_desc') {
    query += ` ORDER BY b.common_name DESC`;
  } else if (filter?.sortBy === 'family') {
    query += ` ORDER BY b.family ASC, b.common_name ASC`;
  } else if (filter?.sortBy === 'status') {
    query += ` ORDER BY CASE b.iucn_code WHEN 'CR' THEN 1 WHEN 'EN' THEN 2 WHEN 'VU' THEN 3 WHEN 'NT' THEN 4 ELSE 5 END, b.common_name ASC`;
  } else {
    query += ` ORDER BY b.common_name ASC`;
  }

  const rows = await db.getAllAsync<BirdRow>(query, params);
  return rows.map(mapRowToBird);
}

export async function getBirdById(id: string): Promise<Bird | null> {
  const db = await getDatabase();
  const query = `
    SELECT b.*, 
      CASE WHEN f.bird_id IS NOT NULL THEN 1 ELSE 0 END AS is_favorite,
      CASE WHEN c.is_spotted = 1 THEN 1 ELSE 0 END AS is_spotted
    FROM birds b
    LEFT JOIN favorites f ON b.id = f.bird_id
    LEFT JOIN checklist c ON b.id = c.bird_id
    WHERE b.id = ?
  `;
  const row = await db.getFirstAsync<BirdRow>(query, [id]);
  return row ? mapRowToBird(row) : null;
}

export async function toggleFavorite(birdId: string): Promise<boolean> {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<{ bird_id: string }>(
    'SELECT bird_id FROM favorites WHERE bird_id = ?',
    [birdId]
  );
  if (existing) {
    await db.runAsync('DELETE FROM favorites WHERE bird_id = ?', [birdId]);
    return false;
  } else {
    await db.runAsync('INSERT INTO favorites (bird_id, created_at) VALUES (?, ?)', [
      birdId,
      new Date().toISOString(),
    ]);
    return true;
  }
}

export async function getFavoriteBirds(): Promise<Bird[]> {
  const db = await getDatabase();
  const query = `
    SELECT b.*, 1 AS is_favorite,
      CASE WHEN c.is_spotted = 1 THEN 1 ELSE 0 END AS is_spotted
    FROM birds b
    INNER JOIN favorites f ON b.id = f.bird_id
    LEFT JOIN checklist c ON b.id = c.bird_id
    ORDER BY f.created_at DESC
  `;
  const rows = await db.getAllAsync<BirdRow>(query);
  return rows.map(mapRowToBird);
}

export async function getBirdOfTheDay(): Promise<Bird> {
  const all = await getAllBirds();
  if (all.length === 0) {
    throw new Error('No birds available');
  }
  // Deterministic daily pick based on day of year
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const index = dayOfYear % all.length;
  return all[index];
}

export async function getFeaturedEndemicBird(): Promise<Bird> {
  const endemics = await getAllBirds({ endemicOnly: true });
  // Pick SL Blue Magpie or SL Junglefowl as prime featured
  const blueMagpie = endemics.find(b => b.id === 'sl-blue-magpie');
  return blueMagpie || endemics[0];
}

export async function getDistinctFamilies(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ family: string }>('SELECT DISTINCT family FROM birds ORDER BY family ASC');
  return rows.map(r => r.family);
}
