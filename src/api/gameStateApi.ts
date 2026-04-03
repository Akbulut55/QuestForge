import { NativeModules, Platform } from 'react-native';

const BACKEND_PORT = 4000;
let cachedBackendBaseUrl: string | null = null;

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

function appendBackendUrl(baseUrls: string[], host: string | null) {
  if (!host) {
    return;
  }

  const normalizedHost = host.trim();

  if (!normalizedHost) {
    return;
  }

  const nextBaseUrl = `http://${normalizedHost}:${BACKEND_PORT}`;

  if (!baseUrls.includes(nextBaseUrl)) {
    baseUrls.push(nextBaseUrl);
  }
}

function getBackendBaseUrls() {
  const scriptHost = getScriptHost();
  const baseUrls: string[] = [];

  if (Platform.OS === 'android') {
    appendBackendUrl(baseUrls, '10.0.2.2');
    appendBackendUrl(baseUrls, '10.0.3.2');

    if (scriptHost === 'localhost' || scriptHost === '127.0.0.1') {
      appendBackendUrl(baseUrls, '10.0.2.2');
    } else {
      appendBackendUrl(baseUrls, scriptHost);
    }
  } else {
    appendBackendUrl(baseUrls, scriptHost);
    appendBackendUrl(baseUrls, 'localhost');
    appendBackendUrl(baseUrls, '127.0.0.1');
  }

  return baseUrls;
}

export function getBackendBaseUrl() {
  return cachedBackendBaseUrl ?? getBackendBaseUrls()[0];
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
  const candidateBaseUrls = cachedBackendBaseUrl
    ? [
        cachedBackendBaseUrl,
        ...getBackendBaseUrls().filter(baseUrl => baseUrl !== cachedBackendBaseUrl),
      ]
    : getBackendBaseUrls();
  let lastNetworkError: unknown = null;

  for (const baseUrl of candidateBaseUrls) {
    try {
      const response = await fetch(`${baseUrl}${path}`, options);
      const parsedResponse = await readJsonResponse<T>(response);

      cachedBackendBaseUrl = baseUrl;

      return parsedResponse;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith('Backend request failed with status')
      ) {
        throw error;
      }

      lastNetworkError = error;
    }
  }

  cachedBackendBaseUrl = null;

  if (lastNetworkError instanceof Error) {
    throw lastNetworkError;
  }

  throw new Error('Unable to reach the Quest Forge API.');
}

export async function fetchRemoteGameState<T>(): Promise<T> {
  return requestJson<T>('/game-state');
}

export async function fetchRemoteQuestDetails<T>(
  questId: string,
): Promise<T> {
  return requestJson<T>(`/quests/${encodeURIComponent(questId)}/details`);
}

export async function fetchRemoteAppConfig<T>(): Promise<T> {
  return requestJson<T>('/app-config');
}

export async function fetchRemoteDailySuggestions<T>(): Promise<T> {
  return requestJson<T>('/daily-suggestions');
}

export async function fetchRemoteRealmCodex<T>(): Promise<T> {
  return requestJson<T>('/realm-codex');
}

export async function fetchRemoteThemeSanctum<T>(): Promise<T> {
  return requestJson<T>('/theme-sanctum');
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

export async function startRemoteQuest<TResponse>(
  questId: string,
): Promise<TResponse> {
  return requestJson<TResponse>(`/quests/${encodeURIComponent(questId)}/start`, {
    method: 'POST',
  });
}

export async function failRemoteQuest<TResponse>(
  questId: string,
): Promise<TResponse> {
  return requestJson<TResponse>(`/quests/${encodeURIComponent(questId)}/fail`, {
    method: 'POST',
  });
}

export async function resetRemoteProgress<TResponse>(): Promise<TResponse> {
  return requestJson<TResponse>('/progress/reset', {
    method: 'POST',
  });
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

export async function updateRemoteThemePack<TThemePackId, TResponse>(
  themePackId: TThemePackId,
): Promise<TResponse> {
  return requestJson<TResponse>('/preferences/theme-pack', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ themePackId }),
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



