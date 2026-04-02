import { NativeModules, Platform } from 'react-native';

const BACKEND_PORT = 4000;

function getScriptHost() {
  const scriptURL = NativeModules.SourceCode?.scriptURL;

  if (!scriptURL) {
    return null;
  }

  try {
    return new URL(scriptURL).hostname;
  } catch {
    const hostMatch = scriptURL.match(/^https?:\/\/([^/:]+)/);

    return hostMatch?.[1] ?? null;
  }
}

export function getBackendBaseUrl() {
  const host =
    getScriptHost() ?? (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');

  return `http://${host}:${BACKEND_PORT}`;
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Backend request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

async function requestJson<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${getBackendBaseUrl()}${path}`, options);

  return readJsonResponse<T>(response);
}

export async function fetchRemoteGameState<T>(): Promise<T> {
  return requestJson<T>('/game-state');
}

export async function fetchRemoteAppConfig<T>(): Promise<T> {
  return requestJson<T>('/app-config');
}

export async function saveRemoteGameState<T>(gameState: T): Promise<T> {
  return requestJson<T>('/game-state', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(gameState),
  });
}

export async function createRemoteQuest<TQuest, TResponse>(
  quest: TQuest,
): Promise<TResponse> {
  return requestJson<TResponse>('/quests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(quest),
  });
}

export async function updateRemoteQuest<TQuest, TResponse>(
  questId: string,
  quest: TQuest,
): Promise<TResponse> {
  return requestJson<TResponse>(`/quests/${encodeURIComponent(questId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(quest),
  });
}

export async function deleteRemoteQuest<TResponse>(
  questId: string,
): Promise<TResponse> {
  return requestJson<TResponse>(`/quests/${encodeURIComponent(questId)}`, {
    method: 'DELETE',
  });
}

export async function completeRemoteQuest<TResponse>(
  questId: string,
): Promise<TResponse> {
  return requestJson<TResponse>(
    `/quests/${encodeURIComponent(questId)}/complete`,
    {
      method: 'POST',
    },
  );
}

export async function updateRemoteTheme<TThemeMode, TResponse>(
  themeMode: TThemeMode,
): Promise<TResponse> {
  return requestJson<TResponse>('/preferences/theme', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ themeMode }),
  });
}

export async function updateRemoteSortOption<TSortOption, TResponse>(
  sortOption: TSortOption,
): Promise<TResponse> {
  return requestJson<TResponse>('/preferences/sort', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sortOption }),
  });
}
