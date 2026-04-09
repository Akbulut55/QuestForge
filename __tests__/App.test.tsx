/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Alert } from 'react-native';

jest.mock('react-native-safe-area-context', () => {
  const mockReact = require('react');
  const { View } = require('react-native');

  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) =>
      mockReact.createElement(View, null, children),
    SafeAreaView: ({
      children,
      style,
    }: {
      children: React.ReactNode;
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
  createRemoteQuestPoolTemplate: jest.fn(),
  deleteRemoteQuest: jest.fn(),
  failRemoteQuest: jest.fn(),
  fetchRemoteAppConfig: jest.fn(),
  fetchRemoteDailySuggestions: jest.fn(),
  fetchRemoteGameState: jest.fn(),
  fetchRemoteQuestDetails: jest.fn(),
  fetchRemoteQuestPool: jest.fn(),
  fetchRemoteRealmCodex: jest.fn(),
  fetchRemoteThemeSanctum: jest.fn(),
  resetRemoteProgress: jest.fn(),
  resetRemoteQuestPool: jest.fn(),
  saveRemoteGameState: jest.fn(),
  startRemoteQuest: jest.fn(),
  updateRemoteQuest: jest.fn(),
  updateRemoteQuestPoolTemplate: jest.fn(),
  updateRemoteSortOption: jest.fn(),
  updateRemoteTheme: jest.fn(),
  updateRemoteThemePack: jest.fn(),
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
  createRemoteQuestPoolTemplate,
  deleteRemoteQuest,
  failRemoteQuest,
  fetchRemoteAppConfig,
  fetchRemoteDailySuggestions,
  fetchRemoteGameState,
  fetchRemoteQuestDetails,
  fetchRemoteQuestPool,
  fetchRemoteRealmCodex,
  fetchRemoteThemeSanctum,
  resetRemoteProgress,
  resetRemoteQuestPool,
  saveRemoteGameState,
  startRemoteQuest,
  updateRemoteQuest,
  updateRemoteQuestPoolTemplate,
  updateRemoteSortOption,
  updateRemoteTheme,
  updateRemoteThemePack,
} from '../src/api/gameStateApi';

const mockAsyncStorage =
  require('@react-native-async-storage/async-storage').default;
const mockFetchRemoteAppConfig = fetchRemoteAppConfig as jest.Mock;
const mockFetchRemoteGameState = fetchRemoteGameState as jest.Mock;
const mockFetchRemoteQuestDetails = fetchRemoteQuestDetails as jest.Mock;
const mockFetchRemoteDailySuggestions = fetchRemoteDailySuggestions as jest.Mock;
const mockFetchRemoteQuestPool = fetchRemoteQuestPool as jest.Mock;
const mockFetchRemoteRealmCodex = fetchRemoteRealmCodex as jest.Mock;
const mockFetchRemoteThemeSanctum = fetchRemoteThemeSanctum as jest.Mock;
const mockSaveRemoteGameState = saveRemoteGameState as jest.Mock;
const mockCreateRemoteQuest = createRemoteQuest as jest.Mock;
const mockCreateRemoteQuestPoolTemplate = createRemoteQuestPoolTemplate as jest.Mock;
const mockUpdateRemoteQuest = updateRemoteQuest as jest.Mock;
const mockUpdateRemoteQuestPoolTemplate = updateRemoteQuestPoolTemplate as jest.Mock;
const mockDeleteRemoteQuest = deleteRemoteQuest as jest.Mock;
const mockStartRemoteQuest = startRemoteQuest as jest.Mock;
const mockCompleteRemoteQuest = completeRemoteQuest as jest.Mock;
const mockFailRemoteQuest = failRemoteQuest as jest.Mock;
const mockResetRemoteProgress = resetRemoteProgress as jest.Mock;
const mockResetRemoteQuestPool = resetRemoteQuestPool as jest.Mock;
const mockUpdateRemoteTheme = updateRemoteTheme as jest.Mock;
const mockUpdateRemoteSortOption = updateRemoteSortOption as jest.Mock;
const mockUpdateRemoteThemePack = updateRemoteThemePack as jest.Mock;

type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Epic';
type Category = 'Main Quest' | 'Side Quest';
type Status = 'Ready' | 'In Progress' | 'Completed' | 'Failed';
type ThemeMode = 'dark' | 'light';
type ThemePackId = 'ethereal-forge' | 'luminous-paladin' | 'void-drifter';

type TestQuest = {
  id: string;
  title: string;
  description: string;
  tag: string;
  dueDate: string | null;
  startedAt?: string | null;
  difficulty: Difficulty;
  xpReward: number;
  status: Status;
  category: Category;
  completedAt: string | null;
  failedAt: string | null;
  dueSoonReminderAt?: string | null;
  overdueReminderAt?: string | null;
  createdAt: number;
};

type TestGameState = {
  hero: {
    xp: number;
    rankTitle: string;
    streakCount: number;
    lastCompletedDate: string | null;
    activeDateKeys: string[];
  };
  quests: TestQuest[];
  themeMode: ThemeMode;
  themePackId: ThemePackId;
  unlockedAchievementIds: string[];
  sortOption: string;
};

type SuggestedQuest = {
  title: string;
  description: string;
  tag: string;
  dueDate?: string | null;
  difficulty: Difficulty;
  category: Category;
};

type QuestPoolTemplate = SuggestedQuest & {
  id: string;
};

const completionXpByDifficulty: Record<Difficulty, number> = {
  Easy: 10,
  Medium: 20,
  Hard: 35,
  Epic: 50,
};

const rankThresholds = [
  { minimumXp: 2100, title: 'Ascendant' },
  { minimumXp: 1560, title: 'Mythic' },
  { minimumXp: 1160, title: 'Legend' },
  { minimumXp: 820, title: 'Warden' },
  { minimumXp: 540, title: 'Champion' },
  { minimumXp: 320, title: 'Knight' },
  { minimumXp: 150, title: 'Adventurer' },
  { minimumXp: 60, title: 'Apprentice' },
  { minimumXp: 0, title: 'Novice' },
] as const;

const defaultSuggestionPool: QuestPoolTemplate[] = [
  {
    id: 'template-study-runes',
    title: 'Study the Ancient Runes',
    description: 'Review one focused topic and write down the clearest takeaway.',
    tag: 'Study',
    difficulty: 'Medium',
    category: 'Side Quest',
  },
  {
    id: 'template-clean-forge',
    title: 'Clean the Forge',
    description: 'Reset one room or desk so tomorrow starts with less friction.',
    tag: 'Chores',
    difficulty: 'Easy',
    category: 'Side Quest',
  },
  {
    id: 'template-send-report',
    title: 'Send the Guild Report',
    description: 'Finish the update a teammate or manager is waiting on.',
    tag: 'Work',
    difficulty: 'Hard',
    category: 'Main Quest',
  },
];

const defaultRemoteAppConfig = {
  configVersion: 30,
  boardKicker: 'Daily Quest Log',
  boardSubtitle: 'Turn your everyday tasks into a progression path worth chasing.',
  heroEyebrow: 'Hero Overview',
  boardHeroTitlePrefix: 'Rank Title',
  boardHeroInsight: 'Keep the momentum moving.',
  realmSyncMessage: 'Sync your realm.',
  suggestionSectionTitle: 'Daily Suggestions',
  addQuestSectionTitle: 'Guild Hub',
  filterSectionTitle: 'Search And Filter',
  mainQuestSectionTitle: 'Main Quest',
  sideQuestSectionTitle: 'Side Quests',
  completedQuestSectionTitle: 'Completed Quests',
  questSectionOrder: ['main', 'side', 'completed'],
  progressKicker: 'Profile',
  progressTitle: 'Hero Summary',
  progressSubtitle: 'Track your progress.',
  progressHeroEyebrow: 'Current Progress',
  progressSectionTitle: 'Quest Progress',
  progressSectionIntro: 'Review your progress.',
  achievementSectionTitle: 'Achievements',
  achievementSectionIntro: 'Milestones unlock as you play.',
  featureFlags: {
    showRealmSyncCard: false,
    showSuggestionSection: true,
    showFilterSection: true,
    showAchievementSection: true,
    showAddQuestScreen: true,
    showProgressScreen: true,
    showRealmCodexScreen: true,
    showThemeSanctumScreen: true,
  },
};

const cloneState = <T,>(value: T) => JSON.parse(JSON.stringify(value)) as T;

function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getRankTitleForXp(xp: number) {
  return (
    rankThresholds.find(threshold => xp >= threshold.minimumXp)?.title ??
    'Novice'
  );
}

function normalizeActiveDateKeys(activeDateKeys: string[]) {
  return Array.from(new Set(activeDateKeys.filter(Boolean))).sort();
}

function createHeroProgress({
  xp,
  streakCount,
  lastCompletedDate,
  activeDateKeys,
}: {
  xp: number;
  streakCount: number;
  lastCompletedDate: string | null;
  activeDateKeys: string[];
}) {
  return {
    xp,
    rankTitle: getRankTitleForXp(xp),
    streakCount,
    lastCompletedDate,
    activeDateKeys: normalizeActiveDateKeys(activeDateKeys),
  };
}

const todayKey = getDateKey();
const defaultRemoteGameState: TestGameState = {
  hero: createHeroProgress({
    xp: 10,
    streakCount: 1,
    lastCompletedDate: todayKey,
    activeDateKeys: [todayKey],
  }),
  quests: [
    {
      id: 'quest-1',
      title: 'Defeat the Laundry Dragon',
      description:
        'Clear the laundry pile, sort the essentials, and leave the guild hall ready for the next cycle.',
      tag: 'Chores',
      dueDate: null,
      difficulty: 'Epic',
      xpReward: 50,
      status: 'In Progress',
      category: 'Main Quest',
      completedAt: null,
      failedAt: null,
      createdAt: 1,
    },
    {
      id: 'quest-2',
      title: 'Brew a Focus Potion',
      description:
        'Prepare your desk and notes so the next study session begins with less friction.',
      tag: 'Study',
      dueDate: null,
      difficulty: 'Medium',
      xpReward: 20,
      status: 'Ready',
      category: 'Side Quest',
      completedAt: null,
      failedAt: null,
      createdAt: 2,
    },
    {
      id: 'quest-3',
      title: 'Sharpen the Study Blade',
      description:
        'Review one core topic and capture the single insight worth keeping.',
      tag: 'Study',
      dueDate: null,
      difficulty: 'Easy',
      xpReward: 10,
      status: 'Completed',
      category: 'Side Quest',
      completedAt: todayKey,
      failedAt: null,
      createdAt: 3,
    },
  ],
  themeMode: 'dark',
  themePackId: 'ethereal-forge',
  unlockedAchievementIds: ['first-quest', 'quest-finisher'],
  sortOption: 'Newest first',
};

let mockBackendState = cloneState(defaultRemoteGameState);
let mockRemoteAppConfig = cloneState(defaultRemoteAppConfig);
let mockDailySuggestions: SuggestedQuest[] | null = null;
let mockQuestPool = cloneState(defaultSuggestionPool);
let alertSpy: jest.SpyInstance;

function normalizeState(gameState: TestGameState): TestGameState {
  const normalizedQuests = gameState.quests.map(quest => {
    const xpReward = completionXpByDifficulty[quest.difficulty];

    return {
      ...quest,
      description: quest.description.trim(),
      tag: quest.tag.trim() || 'General',
      dueDate: quest.dueDate ?? null,
      xpReward,
      completedAt:
        quest.status === 'Completed' ? quest.completedAt ?? getDateKey() : null,
      failedAt:
        quest.status === 'Failed' ? quest.failedAt ?? getDateKey() : null,
    };
  });
  const completedDates = normalizedQuests
    .map(quest =>
      quest.status === 'Completed'
        ? quest.completedAt
        : quest.status === 'Failed'
          ? quest.failedAt
          : null,
    )
    .filter((dateKey): dateKey is string => dateKey !== null);
  const activeDateKeys = normalizeActiveDateKeys([
    ...gameState.hero.activeDateKeys,
    ...completedDates,
  ]);
  const lastCompletedDate =
    gameState.hero.lastCompletedDate ?? activeDateKeys[activeDateKeys.length - 1] ?? null;

  return {
    hero: createHeroProgress({
      xp: gameState.hero.xp,
      streakCount: gameState.hero.streakCount,
      lastCompletedDate,
      activeDateKeys,
    }),
    quests: normalizedQuests,
    themeMode: gameState.themeMode,
    themePackId: gameState.themePackId,
    unlockedAchievementIds: [...gameState.unlockedAchievementIds],
    sortOption: gameState.sortOption,
  };
}

function getDailySuggestionsForState(quests: TestQuest[]) {
  const existingQuestTitles = new Set(
    quests.map(quest => quest.title.trim().toLowerCase()),
  );
  const suggestions = mockDailySuggestions ?? mockQuestPool;

  return suggestions.filter(
    suggestion => !existingQuestTitles.has(suggestion.title.trim().toLowerCase()),
  );
}

function buildQuestDetailsResponse(questId: string) {
  const quest = mockBackendState.quests.find(currentQuest => currentQuest.id === questId);

  if (!quest) {
    throw new Error('Quest not found');
  }

  const isCompleted = quest.status === 'Completed';
  const isFailed = quest.status === 'Failed';
  const isInProgress = quest.status === 'In Progress';

  return {
    kicker: 'Quest Details',
    title: quest.title,
    subtitle: 'Focus one quest at a time and decide what happens next.',
    questId: quest.id,
    statusLabel: quest.status,
    categoryLabel: quest.category,
    tagLabel: quest.tag,
    summaryEyebrow: 'Quest Summary',
    summaryTitle: isCompleted
      ? 'Quest Complete'
      : isFailed
        ? 'Quest Failed'
        : isInProgress
          ? 'Quest In Progress'
          : 'Quest Ready',
    difficultyLabel: quest.difficulty,
    xpRewardLabel: `+${quest.xpReward} XP`,
    ritualProgressLabel: 'Quest Progress',
    ritualProgressPercent: isCompleted || isFailed ? 100 : isInProgress ? 68 : 24,
    progressStatusText: isCompleted
      ? 'This quest already lives in your archive.'
      : isFailed
        ? 'This quest failed and now rests in history.'
        : isInProgress
          ? 'The quest is active and ready to be completed.'
          : 'The quest is ready whenever you want to begin.',
    guidanceTitle: 'Quest Notes',
    guidanceText: quest.description,
    dueDateLabel: quest.dueDate ?? 'No due date',
    dueStateLabel: quest.dueDate ? 'Upcoming' : 'Flexible',
    primaryActionType: isCompleted || isFailed ? 'none' : isInProgress ? 'complete' : 'start',
    primaryActionLabel: isCompleted
      ? 'Quest Complete'
      : isFailed
        ? 'Quest Failed'
        : isInProgress
          ? 'Complete Quest'
          : 'Start Quest',
    tertiaryActionType: isCompleted || isFailed ? 'none' : 'fail',
    tertiaryActionLabel: 'Mark Failed',
    secondaryActionLabel: 'Edit Quest',
    canComplete: isInProgress,
  };
}

function getRenderText(tree: ReactTestRenderer.ReactTestRenderer) {
  return JSON.stringify(tree.toJSON());
}

function flushMicrotasks() {
  return Promise.resolve().then(() => Promise.resolve());
}

async function renderHydratedApp() {
  let tree: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });

  await ReactTestRenderer.act(async () => {
    await flushMicrotasks();
  });

  mockFetchRemoteAppConfig.mockClear();
  mockFetchRemoteGameState.mockClear();
  mockFetchRemoteQuestDetails.mockClear();
  mockFetchRemoteDailySuggestions.mockClear();
  mockFetchRemoteQuestPool.mockClear();
  mockFetchRemoteRealmCodex.mockClear();
  mockFetchRemoteThemeSanctum.mockClear();
  mockSaveRemoteGameState.mockClear();
  mockCreateRemoteQuest.mockClear();
  mockCreateRemoteQuestPoolTemplate.mockClear();
  mockUpdateRemoteQuest.mockClear();
  mockUpdateRemoteQuestPoolTemplate.mockClear();
  mockDeleteRemoteQuest.mockClear();
  mockStartRemoteQuest.mockClear();
  mockCompleteRemoteQuest.mockClear();
  mockFailRemoteQuest.mockClear();
  mockResetRemoteProgress.mockClear();
  mockResetRemoteQuestPool.mockClear();
  mockUpdateRemoteTheme.mockClear();
  mockUpdateRemoteSortOption.mockClear();
  mockUpdateRemoteThemePack.mockClear();

  return tree!;
}

beforeEach(() => {
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  mockBackendState = cloneState(defaultRemoteGameState);
  mockRemoteAppConfig = cloneState(defaultRemoteAppConfig);
  mockDailySuggestions = null;
  mockQuestPool = cloneState(defaultSuggestionPool);

  mockAsyncStorage.getItem.mockReset();
  mockAsyncStorage.setItem.mockReset();
  mockAsyncStorage.getItem.mockResolvedValue(null);
  mockAsyncStorage.setItem.mockResolvedValue(undefined);

  mockFetchRemoteAppConfig.mockReset();
  mockFetchRemoteGameState.mockReset();
  mockFetchRemoteQuestDetails.mockReset();
  mockFetchRemoteDailySuggestions.mockReset();
  mockFetchRemoteQuestPool.mockReset();
  mockFetchRemoteRealmCodex.mockReset();
  mockFetchRemoteThemeSanctum.mockReset();
  mockSaveRemoteGameState.mockReset();
  mockCreateRemoteQuest.mockReset();
  mockCreateRemoteQuestPoolTemplate.mockReset();
  mockUpdateRemoteQuest.mockReset();
  mockUpdateRemoteQuestPoolTemplate.mockReset();
  mockDeleteRemoteQuest.mockReset();
  mockStartRemoteQuest.mockReset();
  mockCompleteRemoteQuest.mockReset();
  mockFailRemoteQuest.mockReset();
  mockResetRemoteProgress.mockReset();
  mockResetRemoteQuestPool.mockReset();
  mockUpdateRemoteTheme.mockReset();
  mockUpdateRemoteSortOption.mockReset();
  mockUpdateRemoteThemePack.mockReset();

  mockFetchRemoteAppConfig.mockImplementation(async () =>
    cloneState(mockRemoteAppConfig),
  );
  mockFetchRemoteGameState.mockImplementation(async () =>
    cloneState(normalizeState(mockBackendState)),
  );
  mockFetchRemoteQuestDetails.mockImplementation(async (questId: string) =>
    buildQuestDetailsResponse(questId),
  );
  mockFetchRemoteDailySuggestions.mockImplementation(async () => ({
    suggestionDateKey: getDateKey(),
    suggestions: cloneState(getDailySuggestionsForState(mockBackendState.quests)),
  }));
  mockFetchRemoteQuestPool.mockImplementation(async () => ({
    kicker: 'Quest Pool',
    title: 'Quest Pool',
    subtitle: 'Browse reusable quest templates.',
    searchPlaceholder: 'Search Quests...',
    categories: ['All', 'Chores', 'Study', 'Work'],
    templates: cloneState(mockQuestPool),
  }));
  mockFetchRemoteRealmCodex.mockResolvedValue({
    kicker: 'Realm Codex',
    title: 'Realm Codex',
    subtitle: 'Current realm state.',
    heartbeatLabel: 'Heartbeat',
    heartbeatStatus: 'Stable',
    syncLatencyMs: 42,
    summarySectionTitle: 'Summary',
    summarySectionIntro: 'Summary intro',
    featureFlagsSectionTitle: 'Flags',
    featureFlagsSectionIntro: 'Flags intro',
    modulesSectionTitle: 'Modules',
    modulesSectionIntro: 'Modules intro',
    configVersion: 30,
    realmSeed: '0x30',
    activeTheme: 'Dark',
    activeSort: mockBackendState.sortOption,
    questCount: mockBackendState.quests.length,
    suggestionSeed: getDateKey(),
    featureFlags: [],
    modules: [],
  });
  mockFetchRemoteThemeSanctum.mockResolvedValue({
    kicker: 'Theme Sanctum',
    title: 'Theme Sanctum',
    subtitle: 'Theme summary.',
    activeThemeLabel: 'Ethereal Forge',
    activeModeLabel: 'Dark Alchemist',
    accentEnergyLabel: 'Amber',
    surfaceToneLabel: 'Deep Stone',
    realmNotesLabel: '30.0.0',
    availableEssencesTitle: 'Available Essences',
    availableEssencesIntro: 'Choose a palette.',
    availableThemePacks: [],
  });
  mockSaveRemoteGameState.mockImplementation(async (gameState: TestGameState) => {
    mockBackendState = normalizeState(gameState);

    return cloneState(mockBackendState);
  });
  mockCreateRemoteQuest.mockImplementation(async (questDraft: SuggestedQuest) => {
    const nextQuest: TestQuest = {
      id: `quest-${Date.now()}-test`,
      title: questDraft.title.trim(),
      description: questDraft.description.trim(),
      tag: questDraft.tag,
      dueDate: questDraft.dueDate ?? null,
      difficulty: questDraft.difficulty,
      xpReward: completionXpByDifficulty[questDraft.difficulty],
      status: 'Ready',
      category: questDraft.category,
      completedAt: null,
      failedAt: null,
      createdAt: Date.now(),
    };

    mockBackendState = normalizeState({
      ...mockBackendState,
      quests: [nextQuest, ...mockBackendState.quests],
      unlockedAchievementIds: mockBackendState.unlockedAchievementIds,
    });

    return {
      gameState: cloneState(mockBackendState),
    };
  });
  mockCreateRemoteQuestPoolTemplate.mockImplementation(
    async (templateDraft: SuggestedQuest) => {
      mockQuestPool = [
        {
          id: `template-${Date.now()}-test`,
          ...templateDraft,
        },
        ...mockQuestPool,
      ];

      return {
        kicker: 'Quest Pool',
        title: 'Quest Pool',
        subtitle: 'Browse reusable quest templates.',
        searchPlaceholder: 'Search Quests...',
        categories: ['All', 'Chores', 'Study', 'Work'],
        templates: cloneState(mockQuestPool),
      };
    },
  );
  mockUpdateRemoteQuest.mockImplementation(
    async (questId: string, questDraft: SuggestedQuest) => {
      mockBackendState = normalizeState({
        ...mockBackendState,
        quests: mockBackendState.quests.map(quest =>
          quest.id === questId
            ? {
                ...quest,
                title: questDraft.title.trim(),
                description: questDraft.description.trim(),
                tag: questDraft.tag,
                dueDate: questDraft.dueDate ?? null,
                difficulty: questDraft.difficulty,
                category: questDraft.category,
                xpReward: completionXpByDifficulty[questDraft.difficulty],
              }
            : quest,
        ),
      });

      return {
        gameState: cloneState(mockBackendState),
      };
    },
  );
  mockUpdateRemoteQuestPoolTemplate.mockImplementation(
    async (templateId: string, templateDraft: SuggestedQuest) => {
      const templateIndex = mockQuestPool.findIndex(
        template => template.id === templateId,
      );

      if (templateIndex >= 0) {
        mockQuestPool[templateIndex] = {
          id: templateId,
          ...templateDraft,
        };
      }

      return {
        kicker: 'Quest Pool',
        title: 'Quest Pool',
        subtitle: 'Browse reusable quest templates.',
        searchPlaceholder: 'Search Quests...',
        categories: ['All', 'Chores', 'Study', 'Work'],
        templates: cloneState(mockQuestPool),
      };
    },
  );
  mockDeleteRemoteQuest.mockImplementation(async (questId: string) => {
    mockBackendState = normalizeState({
      ...mockBackendState,
      quests: mockBackendState.quests.filter(quest => quest.id !== questId),
    });

    return {
      gameState: cloneState(mockBackendState),
    };
  });
  mockStartRemoteQuest.mockImplementation(async (questId: string) => {
    mockBackendState = normalizeState({
      ...mockBackendState,
      quests: mockBackendState.quests.map(quest =>
        quest.id === questId && quest.status === 'Ready'
          ? { ...quest, status: 'In Progress' }
          : quest,
      ),
    });

    return {
      gameState: cloneState(mockBackendState),
    };
  });
  mockCompleteRemoteQuest.mockImplementation(async (questId: string) => {
    const questToComplete = mockBackendState.quests.find(quest => quest.id === questId);

    if (!questToComplete || questToComplete.status !== 'In Progress') {
      return {
        gameState: cloneState(mockBackendState),
        completionFeedback: null,
      };
    }

    const today = getDateKey();
    const nextXp = mockBackendState.hero.xp + questToComplete.xpReward;
    const nextActiveDateKeys = normalizeActiveDateKeys([
      ...mockBackendState.hero.activeDateKeys,
      today,
    ]);

    mockBackendState = normalizeState({
      ...mockBackendState,
      hero: createHeroProgress({
        xp: nextXp,
        streakCount:
          mockBackendState.hero.lastCompletedDate === today
            ? Math.max(1, mockBackendState.hero.streakCount)
            : 1,
        lastCompletedDate: today,
        activeDateKeys: nextActiveDateKeys,
      }),
      quests: mockBackendState.quests.map(quest =>
        quest.id === questId
          ? {
              ...quest,
              status: 'Completed',
              completedAt: today,
              failedAt: null,
            }
          : quest,
      ),
    });

    return {
      gameState: cloneState(mockBackendState),
      completionFeedback: {
        questTitle: questToComplete.title,
        xpGained: questToComplete.xpReward,
      },
    };
  });
  mockFailRemoteQuest.mockImplementation(async (questId: string) => {
    const today = getDateKey();

    mockBackendState = normalizeState({
      ...mockBackendState,
      quests: mockBackendState.quests.map(quest =>
        quest.id === questId &&
        (quest.status === 'Ready' || quest.status === 'In Progress')
          ? {
              ...quest,
              status: 'Failed',
              failedAt: today,
              completedAt: null,
            }
          : quest,
      ),
    });

    return {
      gameState: cloneState(mockBackendState),
    };
  });
  mockResetRemoteProgress.mockImplementation(async () => {
    mockBackendState = normalizeState({
      ...mockBackendState,
      hero: createHeroProgress({
        xp: 0,
        streakCount: 0,
        lastCompletedDate: null,
        activeDateKeys: [],
      }),
      quests: [],
      unlockedAchievementIds: [],
    });

    return {
      gameState: cloneState(mockBackendState),
    };
  });
  mockResetRemoteQuestPool.mockImplementation(async () => {
    mockQuestPool = cloneState(defaultSuggestionPool);

    return {
      kicker: 'Quest Pool',
      title: 'Quest Pool',
      subtitle: 'Browse reusable quest templates.',
      searchPlaceholder: 'Search Quests...',
      categories: ['All', 'Chores', 'Study', 'Work'],
      templates: cloneState(mockQuestPool),
    };
  });
  mockUpdateRemoteTheme.mockImplementation(async (themeMode: ThemeMode) => {
    mockBackendState = normalizeState({
      ...mockBackendState,
      themeMode,
    });

    return {
      gameState: cloneState(mockBackendState),
    };
  });
  mockUpdateRemoteSortOption.mockImplementation(async (sortOption: string) => {
    mockBackendState = normalizeState({
      ...mockBackendState,
      sortOption,
    });

    return {
      gameState: cloneState(mockBackendState),
    };
  });
  mockUpdateRemoteThemePack.mockImplementation(async (themePackId: ThemePackId) => {
    mockBackendState = normalizeState({
      ...mockBackendState,
      themePackId,
    });

    return {
      gameState: cloneState(mockBackendState),
    };
  });
});

afterEach(() => {
  alertSpy.mockRestore();
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

  expect(getRenderText(tree!)).toContain('Backend connection required');

  await ReactTestRenderer.act(async () => {
    tree!.root.findByProps({ testID: 'retry-backend-connection' }).props.onPress();
    await flushMicrotasks();
  });

  expect(getRenderText(tree!)).toContain('Quest Forge');
});

test('bottom navigation switches between the primary app screens', async () => {
  const tree = await renderHydratedApp();

  await ReactTestRenderer.act(async () => {
    tree.root.findByProps({ testID: 'bottom-nav-forge' }).props.onPress();
  });

  expect(getRenderText(tree)).toContain('Shape Your Next Quest');

  await ReactTestRenderer.act(async () => {
    tree.root.findByProps({ testID: 'bottom-nav-guild' }).props.onPress();
  });

  expect(getRenderText(tree)).toContain('Guild Hall');

  await ReactTestRenderer.act(async () => {
    tree.root.findByProps({ testID: 'bottom-nav-profile' }).props.onPress();
  });

  expect(getRenderText(tree)).toContain('Quest Progress');

  await ReactTestRenderer.act(async () => {
    tree.root.findByProps({ testID: 'bottom-nav-quests' }).props.onPress();
  });

  expect(getRenderText(tree)).toContain('Daily Suggestions');
});

test('collapses quest sections and opens realm tools from profile', async () => {
  const tree = await renderHydratedApp();

  expect(getRenderText(tree)).toContain('Defeat the Laundry Dragon');

  await ReactTestRenderer.act(async () => {
    tree.root.findByProps({ testID: 'toggle-board-section-main' }).props.onPress();
  });

  expect(getRenderText(tree)).not.toContain('Defeat the Laundry Dragon');

  await ReactTestRenderer.act(async () => {
    tree.root.findByProps({ testID: 'toggle-board-section-main' }).props.onPress();
  });

  expect(getRenderText(tree)).toContain('Defeat the Laundry Dragon');

  await ReactTestRenderer.act(async () => {
    tree.root.findByProps({ testID: 'bottom-nav-profile' }).props.onPress();
  });

  await ReactTestRenderer.act(async () => {
    tree.root
      .findByProps({ testID: 'navigate-to-realm-codex-from-progress' })
      .props.onPress();
    await flushMicrotasks();
  });

  expect(getRenderText(tree)).toContain('Realm Codex');

  await ReactTestRenderer.act(async () => {
    tree.root.findByProps({ testID: 'bottom-nav-profile' }).props.onPress();
  });

  await ReactTestRenderer.act(async () => {
    tree.root
      .findByProps({ testID: 'navigate-to-theme-sanctum-from-progress' })
      .props.onPress();
    await flushMicrotasks();
  });

  expect(getRenderText(tree)).toContain('Theme Sanctum');
});

test('shows richer daily suggestions with descriptions and tags and can add one to the board', async () => {
  mockDailySuggestions = [
    {
      title: 'Forge a Study Sprint',
      description: 'Plan one short study block with a clear start and finish line.',
      tag: 'Study',
      difficulty: 'Medium',
      category: 'Side Quest',
    },
    {
      title: 'Reset the Kitchen Keep',
      description: 'Clean one shared space so the next task starts easier.',
      tag: 'Chores',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
  ];

  const tree = await renderHydratedApp();

  await ReactTestRenderer.act(async () => {
    tree.root.findByProps({ testID: 'toggle-suggestions-panel' }).props.onPress();
  });

  expect(getRenderText(tree)).toContain('Forge a Study Sprint');
  expect(getRenderText(tree)).toContain(
    'Plan one short study block with a clear start and finish line.',
  );
  expect(getRenderText(tree)).toContain('Study');

  await ReactTestRenderer.act(async () => {
    tree.root.findByProps({ testID: 'add-suggested-quest-0' }).props.onPress();
    await flushMicrotasks();
  });

  expect(mockCreateRemoteQuest).toHaveBeenCalled();
  expect(getRenderText(tree)).toContain('Forge a Study Sprint');
});

test('keeps search and filter controls collapsible and filters active quests in place', async () => {
  const tree = await renderHydratedApp();

  expect(tree.root.findAllByProps({ testID: 'quest-search-input' })).toHaveLength(0);

  await ReactTestRenderer.act(async () => {
    tree.root.findByProps({ testID: 'toggle-filter-panel' }).props.onPress();
  });

  expect(
    tree.root.findAllByProps({ testID: 'quest-search-input' }).length,
  ).toBeGreaterThan(0);

  await ReactTestRenderer.act(async () => {
    tree.root.findByProps({ testID: 'quest-search-input' }).props.onChangeText('study');
  });

  const filteredRender = getRenderText(tree);

  expect(filteredRender).toContain('Brew a Focus Potion');
  expect(filteredRender).not.toContain('Defeat the Laundry Dragon');
  expect(filteredRender).not.toContain('Completed Quests');

  await ReactTestRenderer.act(async () => {
    tree.root.findByProps({ testID: 'reset-filter-panel' }).props.onPress();
    await flushMicrotasks();
  });

  expect(tree.root.findByProps({ testID: 'quest-search-input' }).props.value).toBe('');
  expect(getRenderText(tree)).toContain('Defeat the Laundry Dragon');
});

test('opens quest details by tapping the quest card and archives failed quests in history', async () => {
  const tree = await renderHydratedApp();

  await ReactTestRenderer.act(async () => {
    tree.root.findByProps({ testID: 'open-quest-details-quest-1' }).props.onPress();
    await flushMicrotasks();
  });

  expect(getRenderText(tree)).toContain('Quest Details');
  expect(getRenderText(tree)).toContain('Chores');

  await ReactTestRenderer.act(async () => {
    tree.root.findByProps({ testID: 'fail-quest-from-details' }).props.onPress();
    await flushMicrotasks();
  });

  await ReactTestRenderer.act(async () => {
    tree.root.findByProps({ testID: 'toggle-guild-hub-panel' }).props.onPress();
  });

  await ReactTestRenderer.act(async () => {
    tree.root
      .findByProps({ testID: 'navigate-to-history-screen' })
      .props.onPress();
  });

  await ReactTestRenderer.act(async () => {
    tree.root.findByProps({ testID: 'history-status-filter-failed' }).props.onPress();
  });

  expect(
    tree.root.findAllByProps({ testID: 'history-quest-quest-1' }).length,
  ).toBeGreaterThan(0);
  expect(getRenderText(tree)).toContain('Defeat the Laundry Dragon');
  expect(mockFailRemoteQuest).toHaveBeenCalledWith('quest-1');
});

test('shows a personalized profile, opens the streak calendar, and preserves streak history', async () => {
  const tree = await renderHydratedApp();
  const currentMonthLabel = new Date().toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
  });
  const nextMonthLabel = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    1,
  ).toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  await ReactTestRenderer.act(async () => {
    tree.root.findByProps({ testID: 'hero-overview-button' }).props.onPress();
  });

  expect(getRenderText(tree)).toContain('Best streak: ');
  expect(getRenderText(tree)).toContain('Study');
  expect(getRenderText(tree)).toContain('Rank Progress');

  await ReactTestRenderer.act(async () => {
    tree.root
      .findByProps({ testID: 'navigate-to-streak-screen-from-progress' })
      .props.onPress();
  });

  const streakRender = getRenderText(tree);

  expect(streakRender).toContain('Streak Calendar');
  expect(streakRender).toContain('Active Momentum');
  expect(streakRender).toContain(currentMonthLabel);

  await ReactTestRenderer.act(async () => {
    tree.root
      .findByProps({ testID: 'streak-calendar-next-month' })
      .props.onPress();
  });

  expect(getRenderText(tree)).toContain(nextMonthLabel);
});

test('opens the quest pool and adds templates as main or side quests', async () => {
  const tree = await renderHydratedApp();

  await ReactTestRenderer.act(async () => {
    tree.root.findByProps({ testID: 'toggle-guild-hub-panel' }).props.onPress();
  });

  await ReactTestRenderer.act(async () => {
    tree.root.findByProps({ testID: 'navigate-to-quest-pool-screen' }).props.onPress();
    await flushMicrotasks();
  });

  expect(getRenderText(tree)).toContain('Quest Pool');
  expect(getRenderText(tree)).toContain('Study the Ancient Runes');

  await ReactTestRenderer.act(async () => {
    tree.root.findByProps({ testID: 'add-quest-pool-main-0' }).props.onPress();
    await flushMicrotasks();
  });

  expect(mockCreateRemoteQuest).toHaveBeenLastCalledWith(
    expect.objectContaining({
      title: 'Study the Ancient Runes',
      category: 'Main Quest',
    }),
  );
});

test('can reset the journey and clear quest progress, history, and achievements', async () => {
  const tree = await renderHydratedApp();

  await ReactTestRenderer.act(async () => {
    tree.root.findByProps({ testID: 'toggle-guild-hub-panel' }).props.onPress();
  });

  await ReactTestRenderer.act(async () => {
    tree.root.findByProps({ testID: 'navigate-to-progress-screen' }).props.onPress();
  });

  await ReactTestRenderer.act(async () => {
    tree.root.findByProps({ testID: 'reset-progress-button' }).props.onPress();
  });

  expect(alertSpy).toHaveBeenCalledWith(
    'Reset Journey?',
    expect.stringContaining('This will clear your quests'),
    expect.any(Array),
  );

  const buttons = alertSpy.mock.calls[0]?.[2] as
    | Array<{ text?: string; onPress?: () => void }>
    | undefined;
  const confirmResetButton = buttons?.find(
    button => button.text === 'Reset Everything',
  );

  await ReactTestRenderer.act(async () => {
    confirmResetButton?.onPress?.();
    await flushMicrotasks();
  });

  expect(mockResetRemoteProgress).toHaveBeenCalled();
  expect(getRenderText(tree)).toContain('No quests match your filters');

  await ReactTestRenderer.act(async () => {
    tree.root.findByProps({ testID: 'toggle-guild-hub-panel' }).props.onPress();
  });

  await ReactTestRenderer.act(async () => {
    tree.root
      .findByProps({ testID: 'navigate-to-history-screen' })
      .props.onPress();
  });

  expect(getRenderText(tree)).toContain('No quests in this archive view');
});
