import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPreferences } from '../types';

const PREFS_KEY = '@featherfind_user_prefs_v1';
const RECENT_VIEWED_KEY = '@featherfind_recent_viewed_birds';

const DEFAULT_PREFERENCES: UserPreferences = {
  userName: 'Sri Lankan Explorer',
  profilePhotoUri: null,
  theme: 'system',
  language: 'en',
  notificationsEnabled: true,
  autoGpsEnabled: true,
};

export async function getUserPreferences(): Promise<UserPreferences> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const stored = JSON.parse(raw) as Partial<UserPreferences> & { geminiApiKey?: string };
    if (Object.prototype.hasOwnProperty.call(stored, 'geminiApiKey')) {
      delete stored.geminiApiKey;
      try {
        await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(stored));
      } catch (error) {
        console.error('Unable to remove the old Gemini API key from preferences:', error);
      }
    }
    return { ...DEFAULT_PREFERENCES, ...stored };
  } catch (error) {
    console.error('Error reading user preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

export async function saveUserPreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
  try {
    const current = await getUserPreferences();
    const updated = { ...current, ...prefs };
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Error saving user preferences:', error);
    throw error;
  }
}

export async function getRecentViewedBirdIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_VIEWED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export async function addRecentViewedBirdId(birdId: string): Promise<void> {
  try {
    const current = await getRecentViewedBirdIds();
    const filtered = current.filter(id => id !== birdId);
    filtered.unshift(birdId);
    const limited = filtered.slice(0, 10);
    await AsyncStorage.setItem(RECENT_VIEWED_KEY, JSON.stringify(limited));
  } catch (e) {
    console.error('Error saving recent viewed bird:', e);
  }
}
