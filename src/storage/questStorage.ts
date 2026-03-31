import AsyncStorage from '@react-native-async-storage/async-storage';

export const QUESTS_STORAGE_KEY = '@questforge/quests';

export async function loadStoredQuests<T>(): Promise<T[] | null> {
  try {
    const storedQuests = await AsyncStorage.getItem(QUESTS_STORAGE_KEY);

    if (!storedQuests) {
      return null;
    }

    const parsedQuests = JSON.parse(storedQuests);

    return Array.isArray(parsedQuests) ? (parsedQuests as T[]) : null;
  } catch {
    return null;
  }
}

export async function saveStoredQuests<T>(quests: T[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUESTS_STORAGE_KEY, JSON.stringify(quests));
  } catch {
    // Keep persistence failures silent for this iteration so the in-memory flow still works.
  }
}
