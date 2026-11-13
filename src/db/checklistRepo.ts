import { getDatabase } from './database';
import { Bird } from '../types';
import { getAllBirds } from './birdsRepo';

export interface ChecklistItem {
  bird: Bird;
  isSpotted: boolean;
  spottedDate: string | null;
  notes: string | null;
}

export async function getChecklist(): Promise<ChecklistItem[]> {
  const birds = await getAllBirds();
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ bird_id: string; is_spotted: number; spotted_date: string | null; notes: string | null }>(
    'SELECT * FROM checklist'
  );

  const map = new Map<string, { is_spotted: number; spotted_date: string | null; notes: string | null }>();
  for (const r of rows) {
    map.set(r.bird_id, r);
  }

  return birds.map(b => {
    const entry = map.get(b.id);
    return {
      bird: b,
      isSpotted: entry?.is_spotted === 1,
      spottedDate: entry?.spotted_date || null,
      notes: entry?.notes || null,
    };
  });
}

export async function toggleChecklistSpotted(birdId: string, spotted: boolean): Promise<void> {
  const db = await getDatabase();
  if (spotted) {
    const today = new Date().toISOString().split('T')[0];
    await db.runAsync(
      `INSERT INTO checklist (bird_id, is_spotted, spotted_date)
       VALUES (?, 1, ?)
       ON CONFLICT(bird_id) DO UPDATE SET is_spotted = 1, spotted_date = excluded.spotted_date`,
      [birdId, today]
    );
  } else {
    await db.runAsync('DELETE FROM checklist WHERE bird_id = ?', [birdId]);
  }
}
