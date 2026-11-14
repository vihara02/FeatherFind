export type IUCNCode = 'LC' | 'NT' | 'VU' | 'EN' | 'CR';

export type ConservationStatus = 
  | 'Least Concern'
  | 'Near Threatened'
  | 'Vulnerable'
  | 'Endangered'
  | 'Critically Endangered';

export type HabitatType = 
  | 'forest'
  | 'wetland'
  | 'mountain'
  | 'garden'
  | 'grassland'
  | 'coastal';

export interface Bird {
  id: string;
  commonName: string;
  scientificName: string;
  sinhalaName: string;
  tamilName: string;
  family: string;
  orderName: string;
  description: string;
  physicalCharacteristics: string;
  averageSize: string;
  habitat: string;
  habitatCategory: HabitatType;
  distributionInSriLanka: string;
  diet: string;
  behavior: string;
  conservationStatus: ConservationStatus;
  iucnCode: IUCNCode;
  identificationCharacteristics: string[];
  interestingFacts: string[];
  similarSpecies: string[];
  imageUrl: string;
  localImageKey: string;
  isEndemic: boolean;
  isFavorite?: boolean;
  isSpotted?: boolean;
}

export interface Sighting {
  id: string;
  birdId?: string | null;
  birdName: string;
  scientificName?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  locationName: string;
  latitude: number | null;
  longitude: number | null;
  habitat: string;
  count: number;
  notes: string;
  photoUri: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SightingFilter {
  searchQuery?: string;
  habitat?: string;
  startDate?: string;
  endDate?: string;
  endemicOnly?: boolean;
}

export interface BirdFilter {
  searchQuery?: string;
  habitat?: string;
  family?: string;
  conservationStatus?: string;
  endemicOnly?: boolean;
  sortBy?: 'name_asc' | 'name_desc' | 'family' | 'status';
}

export interface BirdStats {
  totalSightings: number;
  uniqueSpeciesCount: number;
  endemicSpeciesCount: number;
  totalEndemicsInDB: number;
  mostObservedSpecies: { name: string; count: number } | null;
  habitatBreakdown: { habitat: string; count: number }[];
  monthlyBreakdown: { month: string; count: number }[];
  recentSightings: Sighting[];
}

export interface UserPreferences {
  userName: string;
  profilePhotoUri: string | null;
  theme: 'system' | 'light' | 'dark';
  language: 'en' | 'si' | 'ta';
  notificationsEnabled: boolean;
  geminiApiKey?: string;
  autoGpsEnabled: boolean;
}

export interface AIIdentificationMatch {
  birdName: string;
  scientificName: string;
  confidence: number; // 0 to 1
  matchingBird?: Bird;
  description: string;
  identifyingCharacteristics: string[];
  habitatInfo: string;
  similarSpecies: string[];
  notes?: string;
}

export interface AIIdentificationResult {
  isOffline: boolean;
  matches: AIIdentificationMatch[];
  queryPhotoUri: string;
  analyzedAt: string;
}
