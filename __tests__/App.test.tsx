/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('react-native-safe-area-context', () => {
  const mockReact = require('react');
  const { View } = require('react-native');

  return {
    SafeAreaProvider: ({ children }: { children: any }) =>
      mockReact.createElement(View, null, children),
    SafeAreaView: ({
      children,
      style,
    }: {
      children: any;
      style?: object;
    }) => mockReact.createElement(View, { style }, children),
  };
});

jest.mock('@react-native-async-storage/async-storage', () => {
  const storage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
  };

  return {
    __esModule: true,
    default: storage,
    getItem: storage.getItem,
    setItem: storage.setItem,
  };
});

jest.mock('../src/api/gameStateApi', () => ({
  __esModule: true,
  completeRemoteQuest: jest.fn(),
  createRemoteQuest: jest.fn(),
  deleteRemoteQuest: jest.fn(),
  fetchRemoteAppConfig: jest.fn(),
  fetchRemoteDailySuggestions: jest.fn(),
  fetchRemoteGameState: jest.fn(),
  fetchRemoteRealmCodex: jest.fn(),
  saveRemoteGameState: jest.fn(),
  updateRemoteQuest: jest.fn(),
  updateRemoteSortOption: jest.fn(),
  updateRemoteTheme: jest.fn(),
}));

import App from '../App';
import {
  GAME_STATE_STORAGE_KEY,
  LEGACY_QUESTS_STORAGE_KEY,
  loadLegacyStoredQuests,
  loadStoredGameState,
} from '../src/storage/questStorage';
import {
  completeRemoteQuest,
  createRemoteQuest,
  deleteRemoteQuest,
  fetchRemoteAppConfig,
  fetchRemoteDailySuggestions,
  fetchRemoteGameState,
  fetchRemoteRealmCodex,
  saveRemoteGameState,
  updateRemoteQuest,
  updateRemoteSortOption,
  updateRemoteTheme,
} from '../src/api/gameStateApi';

const mockAsyncStorage =
  require('@react-native-async-storage/async-storage').default;
const mockFetchRemoteAppConfig = fetchRemoteAppConfig as jest.Mock;
const mockFetchRemoteGameState = fetchRemoteGameState as jest.Mock;
const mockSaveRemoteGameState = saveRemoteGameState as jest.Mock;
const mockCreateRemoteQuest = createRemoteQuest as jest.Mock;
const mockUpdateRemoteQuest = updateRemoteQuest as jest.Mock;
const mockDeleteRemoteQuest = deleteRemoteQuest as jest.Mock;
const mockCompleteRemoteQuest = completeRemoteQuest as jest.Mock;
const mockFetchRemoteDailySuggestions = fetchRemoteDailySuggestions as jest.Mock;
const mockFetchRemoteRealmCodex = fetchRemoteRealmCodex as jest.Mock;
const mockUpdateRemoteTheme = updateRemoteTheme as jest.Mock;
const mockUpdateRemoteSortOption = updateRemoteSortOption as jest.Mock;

type TestGameState = {
  hero: {
    xp: number;
    rankTitle: string;
    streakCount: number;
    lastCompletedDate: string | null;
  };
  quests: Array<{
    id: string;
    title: string;
    difficulty: string;
    xpReward: number;
    status: string;
    category: string;
    createdAt: number;
  }>;
  themeMode: string;
  unlockedAchievementIds: string[];
  sortOption: string;
};

type TestAppConfig = {
  configVersion: number;
  boardKicker: string;
  boardSubtitle: string;
  heroEyebrow: string;
  realmSyncMessage: string;
  suggestionSectionTitle: string;
  addQuestSectionTitle: string;
  filterSectionTitle: string;
  mainQuestSectionTitle: string;
  sideQuestSectionTitle: string;
  completedQuestSectionTitle: string;
  progressKicker: string;
  progressTitle: string;
  progressSubtitle: string;
  progressHeroEyebrow: string;
  progressSectionTitle: string;
  progressSectionIntro: string;
  achievementSectionTitle: string;
  achievementSectionIntro: string;
  featureFlags: {
    showRealmSyncCard: boolean;
    showSuggestionSection: boolean;
    showFilterSection: boolean;
    showAchievementSection: boolean;
    showAddQuestScreen: boolean;
    showProgressScreen: boolean;
    showRealmCodexScreen: boolean;
  };
};

const defaultRemoteGameState: TestGameState = {
  hero: {
    xp: 10,
    rankTitle: 'Novice',
    streakCount: 0,
    lastCompletedDate: null,
  },
  quests: [
    {
      id: 'quest-1',
      title: 'Defeat the Laundry Dragon',
      difficulty: 'Epic',
      xpReward: 50,
      status: 'In Progress',
      category: 'Main Quest',
      createdAt: 1,
    },
    {
      id: 'quest-2',
      title: 'Brew a Focus Potion',
      difficulty: 'Medium',
      xpReward: 20,
      status: 'Ready',
      category: 'Side Quest',
      createdAt: 2,
    },
    {
      id: 'quest-3',
      title: 'Sharpen the Study Blade',
      difficulty: 'Easy',
      xpReward: 10,
      status: 'Completed',
      category: 'Side Quest',
      createdAt: 3,
    },
  ],
  themeMode: 'dark',
  unlockedAchievementIds: ['first-quest', 'quest-finisher'],
  sortOption: 'Newest first',
};

const defaultRemoteAppConfig: TestAppConfig = {
  configVersion: 1,
  boardKicker: 'Daily Quest Log',
  boardSubtitle: 'Turn your everyday tasks into a progression path worth chasing.',
  heroEyebrow: 'Hero Overview',
  realmSyncMessage:
    'Refresh this screen to pull the latest board copy from the backend.',
  suggestionSectionTitle: 'Daily Suggestions',
  addQuestSectionTitle: 'Forge New Quest',
  filterSectionTitle: 'Search And Filter',
  mainQuestSectionTitle: 'Main Quest',
  sideQuestSectionTitle: 'Side Quests',
  completedQuestSectionTitle: 'Completed Quests',
  progressKicker: 'Profile',
  progressTitle: 'Hero Summary',
  progressSubtitle:
    'Track the progress you have forged from quests already living in your current log.',
  progressHeroEyebrow: 'Current Progress',
  progressSectionTitle: 'Quest Progress',
  progressSectionIntro:
    'This screen summarizes the quest board without creating any new data or changing your current flow.',
  achievementSectionTitle: 'Achievements',
  achievementSectionIntro:
    'Badges unlock automatically from the progress you already build on the quest board.',
  featureFlags: {
    showRealmSyncCard: true,
    showSuggestionSection: true,
    showFilterSection: true,
    showAchievementSection: true,
    showAddQuestScreen: true,
    showProgressScreen: true,
    showRealmCodexScreen: true,
  },
};

const completionXpByDifficulty = {
  Easy: 10,
  Medium: 20,
  Hard: 35,
  Epic: 50,
} as const;
const suggestionTemplates = [
  {
    title: 'Refill the Mana Flask',
    difficulty: 'Easy',
    category: 'Side Quest',
  },
  {
    title: 'Map the Day Ahead',
    difficulty: 'Easy',
    category: 'Main Quest',
  },
  {
    title: 'Train the Focus Familiar',
    difficulty: 'Medium',
    category: 'Side Quest',
  },
  {
    title: 'Polish the Guild Resume',
    difficulty: 'Medium',
    category: 'Main Quest',
  },
  {
    title: 'Clear the Inbox Cavern',
    difficulty: 'Hard',
    category: 'Main Quest',
  },
  {
    title: 'Raid the Laundry Keep',
    difficulty: 'Hard',
    category: 'Side Quest',
  },
  {
    title: 'Forge a Weekly Master Plan',
    difficulty: 'Epic',
    category: 'Main Quest',
  },
  {
    title: 'Protect the Evening Wind-Down',
    difficulty: 'Easy',
    category: 'Side Quest',
  },
] as const;
const rankThresholds = [
  { minimumXp: 100, title: 'Champion' },
  { minimumXp: 50, title: 'Knight' },
  { minimumXp: 20, title: 'Adventurer' },
  { minimumXp: 0, title: 'Novice' },
] as const;
const achievementIds = [
  'first-quest',
  'quest-finisher',
  'rising-hero',
  'streak-keeper',
  'quest-master',
] as const;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const cloneState = <T,>(value: T) => JSON.parse(JSON.stringify(value)) as T;

let mockBackendState = cloneState(defaultRemoteGameState);
let mockRemoteAppConfig = cloneState(defaultRemoteAppConfig);

function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return null;
  }

  const [year, month, day] = dateKey.split('-').map(Number);
  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
}

function getDateDifferenceInDays(fromDateKey: string, toDateKey: string) {
  const fromDate = parseDateKey(fromDateKey);
  const toDate = parseDateKey(toDateKey);

  if (!fromDate || !toDate) {
    return null;
  }

  return Math.round((toDate.getTime() - fromDate.getTime()) / DAY_IN_MS);
}

function normalizeStreakProgress(
  streakCount: number,
  lastCompletedDate: string | null,
) {
  if (!lastCompletedDate) {
    return {
      streakCount: 0,
      lastCompletedDate: null,
    };
  }

  const dateDifference = getDateDifferenceInDays(lastCompletedDate, getDateKey());

  if (dateDifference === null || dateDifference < 0) {
    return {
      streakCount: 0,
      lastCompletedDate: null,
    };
  }

  if (dateDifference <= 1) {
    return {
      streakCount: Math.max(0, streakCount),
      lastCompletedDate,
    };
  }

  return {
    streakCount: 0,
    lastCompletedDate: null,
  };
}

function getNextStreakProgress(
  streakCount: number,
  lastCompletedDate: string | null,
  completedDateKey: string,
) {
  if (lastCompletedDate === completedDateKey) {
    return {
      streakCount: Math.max(1, streakCount),
      lastCompletedDate: completedDateKey,
    };
  }

  if (!lastCompletedDate) {
    return {
      streakCount: 1,
      lastCompletedDate: completedDateKey,
    };
  }

  const dateDifference = getDateDifferenceInDays(
    lastCompletedDate,
    completedDateKey,
  );

  if (dateDifference === 1) {
    return {
      streakCount: Math.max(1, streakCount) + 1,
      lastCompletedDate: completedDateKey,
    };
  }

  return {
    streakCount: 1,
    lastCompletedDate: completedDateKey,
  };
}

function getRankTitleForXp(xp: number) {
  return (
    rankThresholds.find(threshold => xp >= threshold.minimumXp)?.title ??
    'Novice'
  );
}

function createHeroProgress(
  xp: number,
  streakCount = 0,
  lastCompletedDate: string | null = null,
) {
  const normalizedStreak = normalizeStreakProgress(
    streakCount,
    lastCompletedDate,
  );

  return {
    xp,
    rankTitle: getRankTitleForXp(xp),
    streakCount: normalizedStreak.streakCount,
    lastCompletedDate: normalizedStreak.lastCompletedDate,
  };
}

function getProgressStats(
  quests: Array<{ status: string }>,
) {
  const totalCompleted = quests.filter(quest => quest.status === 'Completed').length;

  return {
    totalCompleted,
  };
}

function getUnlockedAchievementIds({
  hero,
  quests,
  existingUnlockedAchievementIds = [],
}: {
  hero: typeof defaultRemoteGameState.hero;
  quests: typeof defaultRemoteGameState.quests;
  existingUnlockedAchievementIds?: string[];
}) {
  const stats = getProgressStats(quests);
  const unlockedAchievementIds = new Set(existingUnlockedAchievementIds);

  achievementIds.forEach(achievementId => {
    const shouldUnlock =
      (achievementId === 'first-quest' && quests.length >= 1) ||
      (achievementId === 'quest-finisher' && stats.totalCompleted >= 1) ||
      (achievementId === 'rising-hero' && hero.xp >= 50) ||
      (achievementId === 'streak-keeper' && hero.streakCount >= 3) ||
      (achievementId === 'quest-master' && stats.totalCompleted >= 10);

    if (shouldUnlock) {
      unlockedAchievementIds.add(achievementId);
    }
  });

  return achievementIds.filter(achievementId =>
    unlockedAchievementIds.has(achievementId),
  );
}

function getDailySuggestionsForState(
  quests: typeof defaultRemoteGameState.quests,
  dateKey: string,
) {
  const existingQuestTitles = new Set(
    quests.map(quest => quest.title.trim().toLowerCase()),
  );
  const startingIndex = Number(dateKey.replace(/-/g, '')) % suggestionTemplates.length;
  const suggestions: Array<{
    title: string;
    difficulty: string;
    category: string;
  }> = [];

  for (let offset = 0; offset < suggestionTemplates.length; offset += 1) {
    const suggestion =
      suggestionTemplates[(startingIndex + offset) % suggestionTemplates.length];
    const normalizedTitle = suggestion.title.trim().toLowerCase();

    if (existingQuestTitles.has(normalizedTitle)) {
      continue;
    }

    suggestions.push({ ...suggestion });

    if (suggestions.length === 3) {
      break;
    }
  }

  return suggestions;
}

function buildRealmCodexResponse() {
  const suggestionDateKey = getDateKey();
  const realmSeed = `0x${Number(suggestionDateKey.replace(/-/g, '')).toString(16).toUpperCase()}`;

  return {
    kicker: 'Realm Codex',
    title: "The Weaver's Codex",
    subtitle:
      'A live readout of the backend state currently shaping Quest Forge inside the app.',
    heartbeatLabel: 'Sanctum Heartbeat',
    heartbeatStatus: 'Stable',
    syncLatencyMs:
      32 + mockBackendState.quests.length * 4 + mockRemoteAppConfig.configVersion,
    summarySectionTitle: 'Realm Summary',
    summarySectionIntro:
      'This screen is backed by live server data so the app can reveal system state without another client rewrite.',
    featureFlagsSectionTitle: 'Active Realm Flags',
    featureFlagsSectionIntro:
      'Each flag shows which surfaces the backend currently exposes inside the player app.',
    modulesSectionTitle: 'Connected Modules',
    modulesSectionIntro:
      'These are the current app surfaces and systems wired into the active backend flow.',
    configVersion: mockRemoteAppConfig.configVersion,
    realmSeed,
    activeTheme: mockBackendState.themeMode === 'dark' ? 'Dark Mode' : 'Light Mode',
    activeSort: mockBackendState.sortOption,
    questCount: mockBackendState.quests.length,
    suggestionSeed: suggestionDateKey,
    featureFlags: [
      {
        id: 'realm-sync-card',
        label: 'Realm Sync Panel',
        status: mockRemoteAppConfig.featureFlags.showRealmSyncCard
          ? 'Enabled'
          : 'Hidden',
      },
      {
        id: 'suggestion-section',
        label: 'Suggestion Feed',
        status: mockRemoteAppConfig.featureFlags.showSuggestionSection
          ? 'Enabled'
          : 'Hidden',
      },
      {
        id: 'filter-section',
        label: 'Search And Filter',
        status: mockRemoteAppConfig.featureFlags.showFilterSection
          ? 'Enabled'
          : 'Hidden',
      },
      {
        id: 'achievement-section',
        label: 'Achievement Ledger',
        status: mockRemoteAppConfig.featureFlags.showAchievementSection
          ? 'Enabled'
          : 'Hidden',
      },
      {
        id: 'add-quest-screen',
        label: 'Add Quest Screen',
        status: mockRemoteAppConfig.featureFlags.showAddQuestScreen
          ? 'Enabled'
          : 'Hidden',
      },
      {
        id: 'progress-screen',
        label: 'Progress Screen',
        status: mockRemoteAppConfig.featureFlags.showProgressScreen
          ? 'Enabled'
          : 'Hidden',
      },
      {
        id: 'realm-codex-screen',
        label: 'Realm Codex Screen',
        status: mockRemoteAppConfig.featureFlags.showRealmCodexScreen
          ? 'Enabled'
          : 'Hidden',
      },
    ],
    modules: [
      {
        id: 'quest-board',
        name: 'Quest Board',
        description: 'Primary mission board and daily task surface.',
        status: 'Live',
      },
      {
        id: 'add-quest',
        name: 'Add Quest',
        description: 'Dedicated quest creation and editing flow.',
        status: mockRemoteAppConfig.featureFlags.showAddQuestScreen
          ? 'Live'
          : 'Dormant',
      },
      {
        id: 'hero-archive',
        name: 'Hero Archive',
        description: 'Progress summary and hero record ledger.',
        status: mockRemoteAppConfig.featureFlags.showProgressScreen
          ? 'Live'
          : 'Dormant',
      },
      {
        id: 'suggestion-feed',
        name: 'Suggestion Feed',
        description: 'Backend-issued daily quest recommendations.',
        status: mockRemoteAppConfig.featureFlags.showSuggestionSection
          ? 'Live'
          : 'Dormant',
      },
      {
        id: 'realm-codex',
        name: 'Realm Codex',
        description: 'Backend-driven realm status and module telemetry.',
        status: mockRemoteAppConfig.featureFlags.showRealmCodexScreen
          ? 'Live'
          : 'Dormant',
      },
      {
        id: 'realm-sync',
        name: 'Realm Sync',
        description: 'Pulls the latest backend copy into the running app.',
        status: mockRemoteAppConfig.featureFlags.showRealmSyncCard
          ? 'Live'
          : 'Dormant',
      },
    ],
  };
}

function normalizeGameState(gameState: typeof defaultRemoteGameState) {
  const quests = gameState.quests.map(quest => ({
    ...quest,
    xpReward:
      completionXpByDifficulty[
        quest.difficulty as keyof typeof completionXpByDifficulty
      ],
  }));
  const hero = createHeroProgress(
    typeof gameState.hero?.xp === 'number'
      ? gameState.hero.xp
      : quests
          .filter(quest => quest.status === 'Completed')
          .reduce((totalXp, quest) => totalXp + quest.xpReward, 0),
    gameState.hero?.streakCount,
    gameState.hero?.lastCompletedDate ?? null,
  );

  return {
    hero,
    quests,
    themeMode: gameState.themeMode === 'light' ? 'light' : 'dark',
    sortOption: gameState.sortOption,
    unlockedAchievementIds: getUnlockedAchievementIds({
      hero,
      quests,
      existingUnlockedAchievementIds: gameState.unlockedAchievementIds,
    }),
  };
}

function getLastSavedGameState() {
  return cloneState(mockBackendState);
}

const flushMicrotasks = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

async function renderHydratedApp() {
  let tree: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });

  await ReactTestRenderer.act(async () => {
    await flushMicrotasks();
  });

  mockFetchRemoteAppConfig.mockClear();
  mockSaveRemoteGameState.mockClear();
  mockCreateRemoteQuest.mockClear();
  mockUpdateRemoteQuest.mockClear();
  mockDeleteRemoteQuest.mockClear();
  mockCompleteRemoteQuest.mockClear();
  mockFetchRemoteDailySuggestions.mockClear();
  mockFetchRemoteRealmCodex.mockClear();
  mockUpdateRemoteTheme.mockClear();
  mockUpdateRemoteSortOption.mockClear();

  return tree!;
}

beforeEach(() => {
  mockBackendState = cloneState(defaultRemoteGameState);
  mockRemoteAppConfig = cloneState(defaultRemoteAppConfig);
  mockAsyncStorage.getItem.mockReset();
  mockAsyncStorage.setItem.mockReset();
  mockFetchRemoteAppConfig.mockReset();
  mockFetchRemoteGameState.mockReset();
  mockSaveRemoteGameState.mockReset();
  mockCreateRemoteQuest.mockReset();
  mockUpdateRemoteQuest.mockReset();
  mockDeleteRemoteQuest.mockReset();
  mockCompleteRemoteQuest.mockReset();
  mockFetchRemoteDailySuggestions.mockReset();
  mockFetchRemoteRealmCodex.mockReset();
  mockUpdateRemoteTheme.mockReset();
  mockUpdateRemoteSortOption.mockReset();
  mockAsyncStorage.getItem.mockResolvedValue(null);
  mockAsyncStorage.setItem.mockResolvedValue(undefined);
  mockFetchRemoteAppConfig.mockImplementation(async () =>
    cloneState(mockRemoteAppConfig),
  );
  mockFetchRemoteDailySuggestions.mockImplementation(async () => ({
    suggestionDateKey: getDateKey(),
    suggestions: getDailySuggestionsForState(mockBackendState.quests, getDateKey()),
  }));
  mockFetchRemoteRealmCodex.mockImplementation(async () =>
    buildRealmCodexResponse(),
  );
  mockFetchRemoteGameState.mockImplementation(async () => {
    mockBackendState = normalizeGameState(mockBackendState);

    return cloneState(mockBackendState);
  });
  mockSaveRemoteGameState.mockImplementation(async (nextGameState: typeof defaultRemoteGameState) => {
    mockBackendState = normalizeGameState(nextGameState);

    return cloneState(mockBackendState);
  });
  mockCreateRemoteQuest.mockImplementation(
    async (questDraft: { title: string; difficulty: string; category: string }) => {
      const nextQuest = {
        id: `quest-${Date.now()}-test`,
        title: questDraft.title.trim(),
        difficulty: questDraft.difficulty,
        xpReward:
          completionXpByDifficulty[
            questDraft.difficulty as keyof typeof completionXpByDifficulty
          ],
        status: 'Ready',
        category: questDraft.category,
        createdAt: Date.now(),
      };

      mockBackendState = normalizeGameState({
        ...mockBackendState,
        quests: [nextQuest, ...mockBackendState.quests],
        unlockedAchievementIds: getUnlockedAchievementIds({
          hero: mockBackendState.hero,
          quests: [nextQuest, ...mockBackendState.quests],
          existingUnlockedAchievementIds: mockBackendState.unlockedAchievementIds,
        }),
      });

      return { gameState: cloneState(mockBackendState) };
    },
  );
  mockUpdateRemoteQuest.mockImplementation(
    async (
      questId: string,
      questDraft: { title: string; difficulty: string; category: string },
    ) => {
      const nextQuests = mockBackendState.quests.map(quest =>
        quest.id === questId
          ? {
              ...quest,
              title: questDraft.title.trim(),
              difficulty: questDraft.difficulty,
              category: questDraft.category,
              xpReward:
                completionXpByDifficulty[
                  questDraft.difficulty as keyof typeof completionXpByDifficulty
                ],
            }
          : quest,
      );

      mockBackendState = normalizeGameState({
        ...mockBackendState,
        quests: nextQuests,
        unlockedAchievementIds: getUnlockedAchievementIds({
          hero: mockBackendState.hero,
          quests: nextQuests,
          existingUnlockedAchievementIds: mockBackendState.unlockedAchievementIds,
        }),
      });

      return { gameState: cloneState(mockBackendState) };
    },
  );
  mockDeleteRemoteQuest.mockImplementation(async (questId: string) => {
    const nextQuests = mockBackendState.quests.filter(
      quest => quest.id !== questId,
    );

    mockBackendState = normalizeGameState({
      ...mockBackendState,
      quests: nextQuests,
      unlockedAchievementIds: getUnlockedAchievementIds({
        hero: mockBackendState.hero,
        quests: nextQuests,
        existingUnlockedAchievementIds: mockBackendState.unlockedAchievementIds,
      }),
    });

    return { gameState: cloneState(mockBackendState) };
  });
  mockCompleteRemoteQuest.mockImplementation(async (questId: string) => {
    const questToComplete = mockBackendState.quests.find(
      quest => quest.id === questId,
    );

    if (!questToComplete || questToComplete.status === 'Completed') {
      return {
        gameState: cloneState(mockBackendState),
        completionFeedback: null,
      };
    }

    const xpGained =
      completionXpByDifficulty[
        questToComplete.difficulty as keyof typeof completionXpByDifficulty
      ];
    const updatedStreak = getNextStreakProgress(
      mockBackendState.hero.streakCount,
      mockBackendState.hero.lastCompletedDate,
      getDateKey(),
    );
    const nextHero = createHeroProgress(
      mockBackendState.hero.xp + xpGained,
      updatedStreak.streakCount,
      updatedStreak.lastCompletedDate,
    );
    const nextQuests = mockBackendState.quests.map(quest =>
      quest.id === questId ? { ...quest, status: 'Completed' } : quest,
    );

    mockBackendState = normalizeGameState({
      ...mockBackendState,
      hero: nextHero,
      quests: nextQuests,
      unlockedAchievementIds: getUnlockedAchievementIds({
        hero: nextHero,
        quests: nextQuests,
        existingUnlockedAchievementIds: mockBackendState.unlockedAchievementIds,
      }),
    });

    return {
      gameState: cloneState(mockBackendState),
      completionFeedback: {
        questTitle: questToComplete.title,
        xpGained,
      },
    };
  });
  mockUpdateRemoteTheme.mockImplementation(async (themeMode: 'dark' | 'light') => {
    mockBackendState = normalizeGameState({
      ...mockBackendState,
      themeMode,
    });

    return { gameState: cloneState(mockBackendState) };
  });
  mockUpdateRemoteSortOption.mockImplementation(async (sortOption: string) => {
    mockBackendState = normalizeGameState({
      ...mockBackendState,
      sortOption,
    });

    return { gameState: cloneState(mockBackendState) };
  });
});

test('loads persisted game state from AsyncStorage', async () => {
  mockAsyncStorage.getItem.mockImplementation(async (key: string) => {
    if (key === GAME_STATE_STORAGE_KEY) {
      return JSON.stringify({
        hero: {
          xp: 55,
          rankTitle: 'Knight',
        },
        quests: [],
        themeMode: 'light',
      });
    }

    return null;
  });

  const storedGameState = await loadStoredGameState();

  expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(GAME_STATE_STORAGE_KEY);
  expect(storedGameState).toEqual({
    hero: {
      xp: 55,
      rankTitle: 'Knight',
    },
    quests: [],
    themeMode: 'light',
  });
});

test('loads legacy quests when old persistence exists', async () => {
  mockAsyncStorage.getItem.mockImplementation(async (key: string) => {
    if (key === LEGACY_QUESTS_STORAGE_KEY) {
      return JSON.stringify([
        {
          title: 'Legacy Quest',
          difficulty: 'Easy',
          xpReward: 10,
          status: 'Ready',
          category: 'Side Quest',
        },
      ]);
    }

    return null;
  });

  const storedQuests = await loadLegacyStoredQuests();

  expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(
    LEGACY_QUESTS_STORAGE_KEY,
  );
  expect(storedQuests).toEqual([
    {
      title: 'Legacy Quest',
      difficulty: 'Easy',
      xpReward: 10,
      status: 'Ready',
      category: 'Side Quest',
    },
  ]);
});

test('shows a retry state when the backend is unavailable', async () => {
  mockFetchRemoteGameState.mockRejectedValueOnce(new Error('offline'));

  let tree: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });

  await ReactTestRenderer.act(async () => {
    await flushMicrotasks();
  });

  let root = tree!.root;

  expect(
    root.findAll(node => node.props.children === 'Quest Forge API Offline')
      .length,
  ).toBeGreaterThan(0);

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'retry-backend-connection' }).props.onPress();
    await flushMicrotasks();
  });

  root = tree!.root;

  expect(
    root.findAll(node => node.props.children === 'Open Add Quest').length,
  ).toBeGreaterThan(0);
}, 15000);

test('loads backend-driven board copy and refreshes it inside the app', async () => {
  const tree = await renderHydratedApp();
  let root = tree.root;
  let initialRender = JSON.stringify(tree.toJSON());

  expect(
    root.findAll(node => node.props.children === 'Daily Quest Log').length,
  ).toBeGreaterThan(0);
  expect(
    root.findAll(node => node.props.children === 'Daily Suggestions').length,
  ).toBeGreaterThan(0);
  expect(
    root.findAll(node => node.props.children === 'Realm Sync').length,
  ).toBeGreaterThan(0);
  expect(initialRender).toContain(
    'Refresh this screen to pull the latest board copy from the backend.',
  );

  mockRemoteAppConfig = {
    ...mockRemoteAppConfig,
    configVersion: 2,
    boardKicker: 'Festival Quest Board',
    heroEyebrow: 'Seasonal Hero Snapshot',
    suggestionSectionTitle: 'Festival Suggestions',
    mainQuestSectionTitle: 'Guild Trials',
    realmSyncMessage:
      'A new backend copy is ready. Refresh the board to apply it.',
  };

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'refresh-app-config' }).props.onPress();
    await flushMicrotasks();
  });

  root = tree.root;
  const refreshedRender = JSON.stringify(tree.toJSON());

  expect(
    root.findAll(node => node.props.children === 'Festival Quest Board').length,
  ).toBeGreaterThan(0);
  expect(
    root.findAll(node => node.props.children === 'Seasonal Hero Snapshot').length,
  ).toBeGreaterThan(0);
  expect(
    root.findAll(node => node.props.children === 'Festival Suggestions').length,
  ).toBeGreaterThan(0);
  expect(
    root.findAll(node => node.props.children === 'Guild Trials').length,
  ).toBeGreaterThan(0);
  expect(refreshedRender).toContain(
    'A new backend copy is ready. Refresh the board to apply it.',
  );
  expect(mockFetchRemoteAppConfig).toHaveBeenCalled();
});

test('loads backend-driven progress copy after realm sync refresh', async () => {
  const tree = await renderHydratedApp();
  let root = tree.root;

  mockRemoteAppConfig = {
    ...mockRemoteAppConfig,
    configVersion: 3,
    progressKicker: 'Hall Of Echoes',
    progressTitle: 'Realm Progress Ledger',
    progressSubtitle:
      'The backend now controls how this progress screen speaks to the player.',
    progressHeroEyebrow: 'Live Realm Progress',
    progressSectionTitle: 'Guild Totals',
    progressSectionIntro:
      'These summary cards now come with backend-controlled section copy.',
    achievementSectionTitle: 'Sigils Of Renown',
    achievementSectionIntro:
      'Badge guidance can also shift through backend config updates.',
  };

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'refresh-app-config' }).props.onPress();
    await flushMicrotasks();
  });

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'navigate-to-progress-screen' }).props.onPress();
  });

  root = tree.root;
  const progressRender = JSON.stringify(tree.toJSON());

  expect(
    root.findAll(node => node.props.children === 'Hall Of Echoes').length,
  ).toBeGreaterThan(0);
  expect(
    root.findAll(node => node.props.children === 'Realm Progress Ledger').length,
  ).toBeGreaterThan(0);
  expect(
    root.findAll(node => node.props.children === 'Live Realm Progress').length,
  ).toBeGreaterThan(0);
  expect(
    root.findAll(node => node.props.children === 'Guild Totals').length,
  ).toBeGreaterThan(0);
  expect(
    root.findAll(node => node.props.children === 'Sigils Of Renown').length,
  ).toBeGreaterThan(0);
  expect(progressRender).toContain(
    'The backend now controls how this progress screen speaks to the player.',
  );
  expect(progressRender).toContain(
    'Badge guidance can also shift through backend config updates.',
  );
});

test('backend feature flags can hide configured sections after a realm refresh', async () => {
  const tree = await renderHydratedApp();
  let root = tree.root;

  mockRemoteAppConfig = {
    ...mockRemoteAppConfig,
    configVersion: 4,
    featureFlags: {
      ...mockRemoteAppConfig.featureFlags,
      showRealmSyncCard: false,
      showSuggestionSection: false,
      showFilterSection: false,
      showAchievementSection: false,
      showAddQuestScreen: false,
      showProgressScreen: false,
      showRealmCodexScreen: false,
    },
  };

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'refresh-app-config' }).props.onPress();
    await flushMicrotasks();
  });

  root = tree.root;

  expect(
    root.findAll(node => node.props.children === 'Realm Sync').length,
  ).toBe(0);
  expect(
    root.findAll(node => node.props.children === 'Daily Suggestions').length,
  ).toBe(0);
  expect(
    root.findAll(node => node.props.children === 'Search And Filter').length,
  ).toBe(0);
  expect(root.findAllByProps({ testID: 'navigate-to-add-quest' }).length).toBe(
    0,
  );
  expect(
    root.findAllByProps({ testID: 'navigate-to-progress-screen' }).length,
  ).toBe(0);
  expect(
    root.findAllByProps({ testID: 'navigate-to-realm-codex' }).length,
  ).toBe(0);
  expect(root.findAll(node => node.props.children === 'Achievements').length).toBe(
    0,
  );
});

test('opens the Stitch-generated Realm Codex screen with backend summary data', async () => {
  const tree = await renderHydratedApp();
  let root = tree.root;

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'navigate-to-realm-codex' }).props.onPress();
    await flushMicrotasks();
  });

  root = tree.root;
  const codexRender = JSON.stringify(tree.toJSON());

  expect(mockFetchRemoteRealmCodex).toHaveBeenCalled();
  expect(
    root.findAll(node => node.props.children === "The Weaver's Codex").length,
  ).toBeGreaterThan(0);
  expect(
    root.findAll(node => node.props.children === 'Realm Summary').length,
  ).toBeGreaterThan(0);
  expect(
    root.findAll(node => node.props.children === 'Active Realm Flags').length,
  ).toBeGreaterThan(0);
  expect(
    root.findAll(node => node.props.children === 'Connected Modules').length,
  ).toBeGreaterThan(0);
  expect(codexRender).toContain('"Quest Board"');
  expect(codexRender).toContain('"Suggestion Feed"');
  expect(codexRender).toContain('"Refresh Codex"');
});

test('completing a quest awards XP, updates rank, and saves remote game state', async () => {
  const tree = await renderHydratedApp();

  let root = tree.root;
  const initialRender = JSON.stringify(tree.toJSON());

  expect(initialRender).toContain('"Novice"');

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'complete-quest-quest-1' }).props.onPress();
    await flushMicrotasks();
  });

  root = tree.root;
  const completedRender = JSON.stringify(tree.toJSON());
  const lastSavedGameState = getLastSavedGameState();

  expect(
    root.findByProps({ testID: 'completion-feedback-banner' }),
  ).toBeTruthy();
  expect(completedRender).toContain('"Knight"');
  expect(completedRender).toContain('"60"');
  expect(completedRender).toContain('"Quest Complete"');
  expect(completedRender).toContain('"Defeat the Laundry Dragon"');
  expect(() =>
    root.findByProps({ testID: 'complete-quest-quest-1' }),
  ).toThrow();
  expect(lastSavedGameState.hero.xp).toBe(60);
  expect(lastSavedGameState.hero.rankTitle).toBe('Knight');
  expect(lastSavedGameState.hero.streakCount).toBe(1);
});

test('search and filters work together on the quest board', async () => {
  const tree = await renderHydratedApp();
  let root = tree.root;

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'quest-search-input' }).props.onChangeText(
      'brew',
    );
  });

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'difficulty-filter-medium' }).props.onPress();
    root.findByProps({ testID: 'category-filter-side-quest' }).props.onPress();
    root.findByProps({ testID: 'status-filter-active' }).props.onPress();
  });

  root = tree.root;

  expect(
    root.findAll(node => node.props.children === 'Brew a Focus Potion').length,
  ).toBeGreaterThan(0);
  expect(
    root.findAll(
      node => node.props.children === 'Defeat the Laundry Dragon',
    ).length,
  ).toBe(0);
  expect(
    root.findAll(
      node => node.props.children === 'Sharpen the Study Blade',
    ).length,
  ).toBe(0);
});

test('sorting works with the current search and filter flow and persists selection', async () => {
  mockBackendState = {
    hero: {
      xp: 0,
      rankTitle: 'Novice',
      streakCount: 0,
      lastCompletedDate: null,
    },
    quests: [
      {
        id: 'quest-a',
        title: 'Zephyr Trial',
        difficulty: 'Medium',
        xpReward: 20,
        status: 'Ready',
        category: 'Side Quest',
        createdAt: 3,
      },
      {
        id: 'quest-b',
        title: 'Arcane Brew',
        difficulty: 'Easy',
        xpReward: 10,
        status: 'In Progress',
        category: 'Side Quest',
        createdAt: 1,
      },
      {
        id: 'quest-c',
        title: 'Mystic Notes',
        difficulty: 'Hard',
        xpReward: 35,
        status: 'Ready',
        category: 'Side Quest',
        createdAt: 2,
      },
    ],
    themeMode: 'dark',
    unlockedAchievementIds: ['first-quest'],
    sortOption: 'Newest first',
  };

  const tree = await renderHydratedApp();
  let root = tree.root;

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'quest-search-input' }).props.onChangeText('r');
  });

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'category-filter-side-quest' }).props.onPress();
    root.findByProps({ testID: 'status-filter-active' }).props.onPress();
    root.findByProps({ testID: 'sort-option-title-a-z' }).props.onPress();
    await flushMicrotasks();
  });

  root = tree.root;
  const sortedRender = JSON.stringify(tree.toJSON());
  const arcaneIndex = sortedRender.indexOf('Arcane Brew');
  const zephyrIndex = sortedRender.indexOf('Zephyr Trial');
  const lastSavedGameState = getLastSavedGameState();

  expect(arcaneIndex).toBeGreaterThan(-1);
  expect(zephyrIndex).toBeGreaterThan(-1);
  expect(arcaneIndex).toBeLessThan(zephyrIndex);
  expect(lastSavedGameState.sortOption).toBe('Title A-Z');
});

test('daily suggestions come from the backend feed and refresh after adding one', async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-04-14T09:00:00'));

  try {
    const tree = await renderHydratedApp();
    let root = tree.root;
    const initialRender = JSON.stringify(tree.toJSON());

    expect(initialRender).toContain('"Daily Suggestions"');
    expect(initialRender).toContain('"Forge a Weekly Master Plan"');

    await ReactTestRenderer.act(async () => {
      root.findByProps({ testID: 'add-suggested-quest-0' }).props.onPress();
      await flushMicrotasks();
    });

    root = tree.root;
    const updatedRender = JSON.stringify(tree.toJSON());
    const lastSavedGameState = getLastSavedGameState();

    expect(mockFetchRemoteDailySuggestions).toHaveBeenCalled();

    expect(updatedRender).toContain('"Protect the Evening Wind-Down"');
    expect(
      lastSavedGameState.quests.some(
        (quest: { title: string }) =>
          quest.title === 'Forge a Weekly Master Plan',
      ),
    ).toBe(true);
  } finally {
    jest.useRealTimers();
  }
});

test('theme toggle switches modes and persists the selected theme remotely', async () => {
  const tree = await renderHydratedApp();
  let root = tree.root;

  expect(
    root.findAll(node => node.props.children === '☀').length,
  ).toBeGreaterThan(0);
  expect(root.findByProps({ testID: 'theme-toggle-button' }).props.accessibilityLabel).toBe(
    'Switch to Light Mode',
  );

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'theme-toggle-button' }).props.onPress();
    await flushMicrotasks();
  });

  root = tree.root;
  const lastSavedGameState = getLastSavedGameState();

  expect(
    root.findAll(node => node.props.children === '☾').length,
  ).toBeGreaterThan(0);
  expect(root.findByProps({ testID: 'theme-toggle-button' }).props.accessibilityLabel).toBe(
    'Switch to Dark Mode',
  );
  expect(lastSavedGameState.themeMode).toBe('light');
});

test('progress screen shows derived hero and quest summary stats', async () => {
  const tree = await renderHydratedApp();
  let root = tree.root;

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'navigate-to-progress-screen' }).props.onPress();
  });

  root = tree.root;
  const progressRender = JSON.stringify(tree.toJSON());

  expect(
    root.findAll(node => node.props.children === 'Hero Summary').length,
  ).toBeGreaterThan(0);
  expect(progressRender).toContain('"Rank Title: "');
  expect(progressRender).toContain('"Novice"');
  expect(
    root.findAll(node => node.props.children === 'Total Quests Created').length,
  ).toBeGreaterThan(0);
  expect(root.findAll(node => node.props.children === '3').length).toBeGreaterThan(0);
  expect(
    root.findAll(node => node.props.children === 'Achievements').length,
  ).toBeGreaterThan(0);
  expect(
    root.findAll(node => node.props.children === 'First Quest').length,
  ).toBeGreaterThan(0);
  expect(
    root.findAll(node => node.props.children === 'Unlocked').length,
  ).toBeGreaterThan(0);
});

test('editing a quest updates its details and persists the changes remotely', async () => {
  const tree = await renderHydratedApp();
  let root = tree.root;

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'edit-quest-quest-2' }).props.onPress();
  });

  root = tree.root;

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'quest-title-input' }).props.onChangeText(
      'Brew an Archmage Focus Potion',
    );
  });

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'difficulty-option-hard' }).props.onPress();
    root.findByProps({ testID: 'category-option-main-quest' }).props.onPress();
  });

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'save-quest-button' }).props.onPress();
    await flushMicrotasks();
  });

  root = tree.root;
  const lastSavedGameState = getLastSavedGameState();

  expect(
    root.findAll(
      node => node.props.children === 'Brew an Archmage Focus Potion',
    ).length,
  ).toBeGreaterThan(0);
  expect(
    lastSavedGameState.quests.some(
      (quest: { title: string; difficulty: string; category: string }) =>
        quest.title === 'Brew an Archmage Focus Potion' &&
        quest.difficulty === 'Hard' &&
        quest.category === 'Main Quest',
    ),
  ).toBe(true);
});

test('completing a quest unlocks achievement badges and persists them remotely', async () => {
  const tree = await renderHydratedApp();
  let root = tree.root;

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'complete-quest-quest-1' }).props.onPress();
    await flushMicrotasks();
  });

  let lastSavedGameState = getLastSavedGameState();

  expect(lastSavedGameState.unlockedAchievementIds).toContain('rising-hero');
  expect(lastSavedGameState.unlockedAchievementIds).toContain('quest-finisher');

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'navigate-to-progress-screen' }).props.onPress();
  });

  root = tree.root;

  expect(
    root.findAll(node => node.props.children === 'Rising Hero').length,
  ).toBeGreaterThan(0);
});

test('deleting a quest from the edit screen removes it and persists the update remotely', async () => {
  const tree = await renderHydratedApp();
  let root = tree.root;

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'edit-quest-quest-2' }).props.onPress();
  });

  root = tree.root;

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'delete-quest-button' }).props.onPress();
    await flushMicrotasks();
  });

  root = tree.root;
  const lastSavedGameState = getLastSavedGameState();

  expect(
    root.findAll(node => node.props.children === 'Brew a Focus Potion').length,
  ).toBe(0);
  expect(
    lastSavedGameState.quests.some((quest: { id: string }) => quest.id === 'quest-2'),
  ).toBe(false);
});

test('completing multiple quests on the same day only increases the streak once', async () => {
  const tree = await renderHydratedApp();
  let root = tree.root;

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'complete-quest-quest-1' }).props.onPress();
    await flushMicrotasks();
  });

  root = tree.root;

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'complete-quest-quest-2' }).props.onPress();
    await flushMicrotasks();
  });

  expect(getLastSavedGameState().hero.streakCount).toBe(1);
});

test('streak resets on load after a missed day from backend data', async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-04-03T09:00:00'));

  mockBackendState = {
    hero: {
      xp: 35,
      rankTitle: 'Adventurer',
      streakCount: 3,
      lastCompletedDate: '2026-04-01',
    },
    quests: [],
    themeMode: 'dark',
    unlockedAchievementIds: [],
    sortOption: 'Newest first',
  };

  try {
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<App />);
    });

    await ReactTestRenderer.act(async () => {
      await flushMicrotasks();
    });

    const lastSavedGameState = getLastSavedGameState();

    expect(lastSavedGameState.hero.streakCount).toBe(0);
    expect(lastSavedGameState.hero.lastCompletedDate).toBeNull();
  } finally {
    jest.useRealTimers();
  }
});

test('completing a quest on the next day increases the streak', async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-04-02T09:00:00'));

  mockBackendState = {
    hero: {
      xp: 10,
      rankTitle: 'Novice',
      streakCount: 1,
      lastCompletedDate: '2026-04-01',
    },
    quests: [
      {
        id: 'quest-next-day',
        title: 'Train at Dawn',
        difficulty: 'Easy',
        xpReward: 10,
        status: 'Ready',
        category: 'Side Quest',
        createdAt: 4,
      },
    ],
    themeMode: 'dark',
    unlockedAchievementIds: ['first-quest'],
    sortOption: 'Newest first',
  };

  try {
    const tree = await renderHydratedApp();
    const root = tree.root;

    await ReactTestRenderer.act(async () => {
      root
        .findByProps({ testID: 'complete-quest-quest-next-day' })
        .props.onPress();
      await flushMicrotasks();
    });

    const lastSavedGameState = getLastSavedGameState();

    expect(lastSavedGameState.hero.streakCount).toBe(2);
    expect(lastSavedGameState.hero.lastCompletedDate).toBe('2026-04-02');
  } finally {
    jest.useRealTimers();
  }
});




















