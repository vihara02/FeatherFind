import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { INITIAL_BIRDS_DATA } from '../data/birdsData';

type DatabaseState = {
  instance: SQLite.SQLiteDatabase | null;
  promise: Promise<SQLite.SQLiteDatabase> | null;
};

const globalDatabase = globalThis as typeof globalThis & { __featherFindDatabase?: DatabaseState };
const databaseState = (globalDatabase.__featherFindDatabase ??= { instance: null, promise: null });

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (databaseState.instance) {
    return databaseState.instance;
  }
  if (!databaseState.promise) {
    databaseState.promise = (async () => {
      const db = await SQLite.openDatabaseAsync('featherfind.db');
      await initSchema(db);
      databaseState.instance = db;
      return db;
    })().catch((error: unknown) => {
      databaseState.promise = null;
      throw error;
    });
  }
  return databaseState.promise;
}

async function initSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  if (Platform.OS !== 'web') {
    await db.execAsync('PRAGMA journal_mode = WAL;');
  }

  // Create tables
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS birds (
      id TEXT PRIMARY KEY,
      common_name TEXT NOT NULL,
      scientific_name TEXT NOT NULL,
      sinhala_name TEXT,
      tamil_name TEXT,
      family TEXT,
      order_name TEXT,
      description TEXT,
      physical_characteristics TEXT,
      average_size TEXT,
      habitat TEXT,
      habitat_category TEXT,
      distribution_sl TEXT,
      diet TEXT,
      behavior TEXT,
      conservation_status TEXT,
      iucn_code TEXT,
      identification_keys TEXT,
      interesting_facts TEXT,
      similar_species TEXT,
      image_url TEXT,
      local_image_key TEXT,
      is_endemic INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS favorites (
      bird_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sightings (
      id TEXT PRIMARY KEY,
      bird_id TEXT,
      bird_name TEXT NOT NULL,
      scientific_name TEXT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      location_name TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      habitat TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      photo_uri TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS checklist (
      bird_id TEXT PRIMARY KEY,
      is_spotted INTEGER NOT NULL DEFAULT 0,
      spotted_date TEXT,
      notes TEXT
    );
  `);

  // Check if birds table is seeded
  const countRow = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM birds');
  const shouldSeedSamples = !countRow || countRow.count === 0;
  if (shouldSeedSamples) {
    console.log('Seeding initial verified Sri Lankan bird species into SQLite database...');
  }
  await seedBirdCatalog(db);
  if (shouldSeedSamples) {
    // Seed default sample sightings so the journal, timeline, and stats have realistic data right away
    await seedSampleSightings(db);
  }
}

async function seedBirdCatalog(db: SQLite.SQLiteDatabase): Promise<void> {
  for (const bird of INITIAL_BIRDS_DATA) {
    await db.runAsync(
      `INSERT OR IGNORE INTO birds (
        id, common_name, scientific_name, sinhala_name, tamil_name,
        family, order_name, description, physical_characteristics, average_size,
        habitat, habitat_category, distribution_sl, diet, behavior,
        conservation_status, iucn_code, identification_keys, interesting_facts,
        similar_species, image_url, local_image_key, is_endemic
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bird.id,
        bird.commonName,
        bird.scientificName,
        bird.sinhalaName,
        bird.tamilName,
        bird.family,
        bird.orderName,
        bird.description,
        bird.physicalCharacteristics,
        bird.averageSize,
        bird.habitat,
        bird.habitatCategory,
        bird.distributionInSriLanka,
        bird.diet,
        bird.behavior,
        bird.conservationStatus,
        bird.iucnCode,
        JSON.stringify(bird.identificationCharacteristics),
        JSON.stringify(bird.interestingFacts),
        JSON.stringify(bird.similarSpecies),
        bird.imageUrl,
        bird.localImageKey,
        bird.isEndemic ? 1 : 0,
      ]
    );
  }
}

async function seedSampleSightings(db: SQLite.SQLiteDatabase): Promise<void> {
  const sampleSightings = [
    {
      id: 'sight-001',
      bird_id: 'sl-junglefowl',
      bird_name: 'Sri Lanka Junglefowl',
      scientific_name: 'Gallus lafayettii',
      date: '2026-11-10',
      time: '07:15',
      location_name: 'Sinharaja Forest Reserve, Kudawa Entrance',
      latitude: 6.4428,
      longitude: 80.4578,
      habitat: 'Wet Zone Rainforest',
      count: 2,
      notes: 'Spectacular male crowing atop a mossy branch beside the trail, female foraging nearby in leaf litter.',
      photo_uri: null,
      created_at: new Date('2026-11-10T07:15:00Z').toISOString(),
      updated_at: new Date('2026-11-10T07:15:00Z').toISOString(),
    },
    {
      id: 'sight-002',
      bird_id: 'sl-blue-magpie',
      bird_name: 'Sri Lanka Blue Magpie',
      scientific_name: 'Urocissa ornata',
      date: '2026-11-10',
      time: '09:40',
      location_name: 'Sinharaja Research Station Trail',
      latitude: 6.4352,
      longitude: 80.4521,
      habitat: 'Wet Zone Rainforest',
      count: 3,
      notes: 'Group of three vocalizing in the subcanopy, moving with a mixed species feeding flock.',
      photo_uri: null,
      created_at: new Date('2026-11-10T09:40:00Z').toISOString(),
      updated_at: new Date('2026-11-10T09:40:00Z').toISOString(),
    },
    {
      id: 'sight-003',
      bird_id: 'sl-whistling-thrush',
      bird_name: 'Sri Lanka Whistling Thrush',
      scientific_name: 'Myophonus blighi',
      date: '2026-11-04',
      time: '06:05',
      location_name: 'Horton Plains National Park, Aranga Pool',
      latitude: 6.8028,
      longitude: 80.8091,
      habitat: 'Montane Cloud Forest',
      count: 1,
      notes: 'Extremely lucky sighting right before sunrise on a damp rock beside the stream. Flirted tail and made piercing whistle call.',
      photo_uri: null,
      created_at: new Date('2026-11-04T06:05:00Z').toISOString(),
      updated_at: new Date('2026-11-04T06:05:00Z').toISOString(),
    },
    {
      id: 'sight-004',
      bird_id: 'sl-grey-hornbill',
      bird_name: 'Sri Lanka Grey Hornbill',
      scientific_name: 'Ocyceros gingalensis',
      date: '2026-10-28',
      time: '16:20',
      location_name: 'Kitulgala Forest Reserve, Kelani River bank',
      latitude: 6.9902,
      longitude: 80.4125,
      habitat: 'Wet Zone Rainforest',
      count: 4,
      notes: 'Family party feeding on wild ripe figs with loud chuckling calls.',
      photo_uri: null,
      created_at: new Date('2026-10-28T16:20:00Z').toISOString(),
      updated_at: new Date('2026-10-28T16:20:00Z').toISOString(),
    },
    {
      id: 'sight-005',
      bird_id: 'sl-hanging-parrot',
      bird_name: 'Sri Lanka Hanging Parrot',
      scientific_name: 'Loriculus beryllinus',
      date: '2026-10-18',
      time: '11:10',
      location_name: 'Peradeniya Royal Botanical Gardens, Kandy',
      latitude: 7.2715,
      longitude: 80.5960,
      habitat: 'Home Gardens & Plantations',
      count: 2,
      notes: 'Hanging upside down sipping nectar from red flower blossoms. Very active!',
      photo_uri: null,
      created_at: new Date('2026-10-18T11:10:00Z').toISOString(),
      updated_at: new Date('2026-10-18T11:10:00Z').toISOString(),
    }
  ];

  for (const s of sampleSightings) {
    await db.runAsync(
      `INSERT OR REPLACE INTO sightings (
        id, bird_id, bird_name, scientific_name, date, time,
        location_name, latitude, longitude, habitat, count, notes, photo_uri, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s.id,
        s.bird_id,
        s.bird_name,
        s.scientific_name,
        s.date,
        s.time,
        s.location_name,
        s.latitude,
        s.longitude,
        s.habitat,
        s.count,
        s.notes,
        s.photo_uri,
        s.created_at,
        s.updated_at,
      ]
    );

    // Also mark in checklist
    await db.runAsync(
      `INSERT OR REPLACE INTO checklist (bird_id, is_spotted, spotted_date, notes) VALUES (?, 1, ?, ?)`,
      [s.bird_id, s.date, s.notes]
    );
  }

  // Pre-seed a few favorites (e.g. SL Junglefowl & Blue Magpie)
  await db.runAsync(`INSERT OR REPLACE INTO favorites (bird_id, created_at) VALUES ('sl-junglefowl', ?)`, [new Date().toISOString()]);
  await db.runAsync(`INSERT OR REPLACE INTO favorites (bird_id, created_at) VALUES ('sl-blue-magpie', ?)`, [new Date().toISOString()]);
}

export async function clearAllLocalUserData(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM sightings');
  await db.runAsync('DELETE FROM favorites');
  await db.runAsync('DELETE FROM checklist');
}
