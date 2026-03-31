import AsyncStorage from '@react-native-async-storage/async-storage';

export const GAME_STATE_STORAGE_KEY = '@questforge/game-state';
export const LEGACY_QUESTS_STORAGE_KEY = '@questforge/quests';

export async function loadStoredGameState<T>(): Promise<T | null> {
  try {
    const storedGameState = await AsyncStorage.getItem(GAME_STATE_STORAGE_KEY);

    if (!storedGameState) {
      return null;
    }

    return JSON.parse(storedGameState) as T;
  } catch {
    return null;
  }
}

export async function loadLegacyStoredQuests<T>(): Promise<T[] | null> {
  try {
    const storedQuests = await AsyncStorage.getItem(LEGACY_QUESTS_STORAGE_KEY);

    if (!storedQuests) {
      return null;
    }

    const parsedQuests = JSON.parse(storedQuests);

    return Array.isArray(parsedQuests) ? (parsedQuests as T[]) : null;
  } catch {
    return null;
  }
}

export async function saveStoredGameState<T>(gameState: T): Promise<void> {
  try {
    await AsyncStorage.setItem(
      GAME_STATE_STORAGE_KEY,
      JSON.stringify(gameState),
    );
  } catch {
    // Keep persistence failures silent for this iteration so the in-memory flow still works.
  }
}
