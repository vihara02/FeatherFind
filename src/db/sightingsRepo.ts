import { getDatabase } from './database';
import { Sighting, SightingFilter, BirdStats } from '../types';

interface SightingRow {
  id: string;
  bird_id: string | null;
  bird_name: string;
  scientific_name: string | null;
  date: string;
  time: string;
  location_name: string;
  latitude: number | null;
  longitude: number | null;
  habitat: string;
  count: number;
  notes: string | null;
  photo_uri: string | null;
  created_at: string;
  updated_at: string;
}

function mapRowToSighting(row: SightingRow): Sighting {
  return {
    id: row.id,
    birdId: row.bird_id,
    birdName: row.bird_name,
    scientificName: row.scientific_name || undefined,
    date: row.date,
    time: row.time,
    locationName: row.location_name,
    latitude: row.latitude,
    longitude: row.longitude,
    habitat: row.habitat,
    count: row.count,
    notes: row.notes || '',
    photoUri: row.photo_uri,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllSightings(filter?: SightingFilter): Promise<Sighting[]> {
  const db = await getDatabase();
  let query = 'SELECT * FROM sightings WHERE 1=1';
  const params: any[] = [];

  if (filter?.searchQuery && filter.searchQuery.trim().length > 0) {
    const q = `%${filter.searchQuery.trim().toLowerCase()}%`;
    query += ' AND (LOWER(bird_name) LIKE ? OR LOWER(location_name) LIKE ? OR LOWER(notes) LIKE ?)';
    params.push(q, q, q);
  }

  if (filter?.habitat && filter.habitat !== 'all') {
    query += ' AND LOWER(habitat) LIKE ?';
    params.push(`%${filter.habitat.toLowerCase()}%`);
  }

  if (filter?.startDate) {
    query += ' AND date >= ?';
    params.push(filter.startDate);
  }

  if (filter?.endDate) {
    query += ' AND date <= ?';
    params.push(filter.endDate);
  }

  query += ' ORDER BY date DESC, time DESC';

  const rows = await db.getAllAsync<SightingRow>(query, params);
  return rows.map(mapRowToSighting);
}

export async function getSightingById(id: string): Promise<Sighting | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SightingRow>('SELECT * FROM sightings WHERE id = ?', [id]);
  return row ? mapRowToSighting(row) : null;
}

export async function addSighting(data: {
  birdId?: string | null;
  birdName: string;
  scientificName?: string;
  date: string;
  time: string;
  locationName: string;
  latitude?: number | null;
  longitude?: number | null;
  habitat: string;
  count: number;
  notes?: string;
  photoUri?: string | null;
}): Promise<Sighting> {
  const db = await getDatabase();
  const id = `sight-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO sightings (
      id, bird_id, bird_name, scientific_name, date, time,
      location_name, latitude, longitude, habitat, count, notes,
      photo_uri, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.birdId || null,
      data.birdName,
      data.scientificName || null,
      data.date,
      data.time,
      data.locationName,
      data.latitude ?? null,
      data.longitude ?? null,
      data.habitat,
      data.count,
      data.notes || '',
      data.photoUri || null,
      now,
      now,
    ]
  );

  // If birdId exists, mark in checklist
  if (data.birdId) {
    await db.runAsync(
      `INSERT INTO checklist (bird_id, is_spotted, spotted_date, notes)
       VALUES (?, 1, ?, ?)
       ON CONFLICT(bird_id) DO UPDATE SET is_spotted = 1, spotted_date = excluded.spotted_date`,
      [data.birdId, data.date, data.notes || '']
    );
  }

  const created = await getSightingById(id);
  if (!created) {
    throw new Error('Failed to create sighting');
  }
  return created;
}

export async function updateSighting(
  id: string,
  data: Partial<Omit<Sighting, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Sighting> {
  const db = await getDatabase();
  const existing = await getSightingById(id);
  if (!existing) {
    throw new Error('Sighting not found');
  }

  const updated: Sighting = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  await db.runAsync(
    `UPDATE sightings SET
      bird_id = ?,
      bird_name = ?,
      scientific_name = ?,
      date = ?,
      time = ?,
      location_name = ?,
      latitude = ?,
      longitude = ?,
      habitat = ?,
      count = ?,
      notes = ?,
      photo_uri = ?,
      updated_at = ?
     WHERE id = ?`,
    [
      updated.birdId || null,
      updated.birdName,
      updated.scientificName || null,
      updated.date,
      updated.time,
      updated.locationName,
      updated.latitude,
      updated.longitude,
      updated.habitat,
      updated.count,
      updated.notes,
      updated.photoUri,
      updated.updatedAt,
      id,
    ]
  );

  return updated;
}

export async function deleteSighting(id: string): Promise<boolean> {
  const db = await getDatabase();
  const s = await getSightingById(id);
  if (!s) return false;

  await db.runAsync('DELETE FROM sightings WHERE id = ?', [id]);

  // If this was the only sighting for this birdId, we can check if any other sighting has this birdId
  if (s.birdId) {
    const remaining = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM sightings WHERE bird_id = ?',
      [s.birdId]
    );
    if (!remaining || remaining.count === 0) {
      await db.runAsync('DELETE FROM checklist WHERE bird_id = ?', [s.birdId]);
    }
  }

  return true;
}

export async function getBirdStats(): Promise<BirdStats> {
  const db = await getDatabase();

  // 1. Total sightings
  const totalRow = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM sightings');
  const totalSightings = totalRow?.count || 0;

  // 2. Unique species observed
  const uniqueRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(DISTINCT bird_name) as count FROM sightings'
  );
  const uniqueSpeciesCount = uniqueRow?.count || 0;

  // 3. Endemics observed
  const endemicRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(DISTINCT s.bird_id) as count 
     FROM sightings s
     INNER JOIN birds b ON s.bird_id = b.id
     WHERE b.is_endemic = 1`
  );
  const endemicSpeciesCount = endemicRow?.count || 0;

  // 4. Total endemics in DB
  const totalEndemicsRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM birds WHERE is_endemic = 1'
  );
  const totalEndemicsInDB = totalEndemicsRow?.count || 26;

  // 5. Most observed species
  const mostObservedRow = await db.getFirstAsync<{ bird_name: string; cnt: number }>(
    `SELECT bird_name, SUM(count) as cnt 
     FROM sightings 
     GROUP BY bird_name 
     ORDER BY cnt DESC 
     LIMIT 1`
  );
  const mostObservedSpecies = mostObservedRow ? { name: mostObservedRow.bird_name, count: mostObservedRow.cnt } : null;

  // 6. Habitat breakdown
  const habitatRows = await db.getAllAsync<{ habitat: string; cnt: number }>(
    `SELECT habitat, COUNT(*) as cnt 
     FROM sightings 
     GROUP BY habitat 
     ORDER BY cnt DESC`
  );
  const habitatBreakdown = habitatRows.map(r => ({ habitat: r.habitat, count: r.cnt }));

  // 7. Monthly breakdown (last 6 months)
  const monthlyRows = await db.getAllAsync<{ month: string; cnt: number }>(
    `SELECT strftime('%Y-%m', date) as month, COUNT(*) as cnt 
     FROM sightings 
     GROUP BY month 
     ORDER BY month ASC 
     LIMIT 6`
  );
  const monthlyBreakdown = monthlyRows.map(r => ({ month: r.month, count: r.cnt }));

  // 8. Recent 3 sightings
  const recent = await getAllSightings();

  return {
    totalSightings,
    uniqueSpeciesCount,
    endemicSpeciesCount,
    totalEndemicsInDB,
    mostObservedSpecies,
    habitatBreakdown,
    monthlyBreakdown,
    recentSightings: recent.slice(0, 3),
  };
}

export async function exportSightingsToCSV(): Promise<string> {
  const sightings = await getAllSightings();
  const headers = ['ID', 'Bird Name', 'Scientific Name', 'Date', 'Time', 'Location', 'Latitude', 'Longitude', 'Habitat', 'Count', 'Notes', 'Created At'];

  const rows = sightings.map(s => [
    `"${s.id}"`,
    `"${(s.birdName || '').replace(/"/g, '""')}"`,
    `"${(s.scientificName || '').replace(/"/g, '""')}"`,
    `"${s.date}"`,
    `"${s.time}"`,
    `"${(s.locationName || '').replace(/"/g, '""')}"`,
    s.latitude !== null ? s.latitude : '',
    s.longitude !== null ? s.longitude : '',
    `"${(s.habitat || '').replace(/"/g, '""')}"`,
    s.count,
    `"${(s.notes || '').replace(/"/g, '""')}"`,
    `"${s.createdAt}"`,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
