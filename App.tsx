import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import {
  loadLegacyStoredQuests,
  loadStoredGameState,
} from './src/storage/questStorage';
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
} from './src/api/gameStateApi';

type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Epic';
type Category = 'Main Quest' | 'Side Quest';
type Status = 'Ready' | 'In Progress' | 'Completed';
type ScreenName = 'quest-board' | 'add-quest' | 'progress' | 'realm-codex';
type RankTitle = 'Novice' | 'Adventurer' | 'Knight' | 'Champion';
type QuestBoardSectionKey = 'main' | 'side' | 'completed';
type SortOption =
  | 'Newest first'
  | 'Oldest first'
  | 'Difficulty ascending'
  | 'Difficulty descending'
  | 'Title A-Z';
type AchievementId =
  | 'first-quest'
  | 'quest-finisher'
  | 'rising-hero'
  | 'streak-keeper'
  | 'quest-master';
type DifficultyFilter = 'All' | Difficulty;
type CategoryFilter = 'All' | Category;
type StatusFilter = 'All' | 'Active' | 'Completed';
type ThemeMode = 'dark' | 'light';

type Quest = {
  id: string;
  title: string;
  difficulty: Difficulty;
  xpReward: number;
  status: Status;
  category: Category;
  createdAt: number;
};

type QuestDraft = {
  title: string;
  difficulty: Difficulty;
  category: Category;
};

type SuggestedQuest = QuestDraft;

type HeroProgress = {
  xp: number;
  rankTitle: RankTitle;
  streakCount: number;
  lastCompletedDate: string | null;
};

type GameState = {
  hero: HeroProgress;
  quests: Quest[];
  themeMode: ThemeMode;
  unlockedAchievementIds: AchievementId[];
  sortOption: SortOption;
};

type AppFeatureFlags = {
  showRealmSyncCard: boolean;
  showSuggestionSection: boolean;
  showFilterSection: boolean;
  showAchievementSection: boolean;
  showAddQuestScreen: boolean;
  showProgressScreen: boolean;
  showRealmCodexScreen: boolean;
};

type AppConfig = {
  configVersion: number;
  boardKicker: string;
  boardSubtitle: string;
  heroEyebrow: string;
  boardHeroTitlePrefix: string;
  boardHeroInsight: string;
  realmSyncMessage: string;
  suggestionSectionTitle: string;
  addQuestSectionTitle: string;
  filterSectionTitle: string;
  mainQuestSectionTitle: string;
  sideQuestSectionTitle: string;
  completedQuestSectionTitle: string;
  questSectionOrder: QuestBoardSectionKey[];
  progressKicker: string;
  progressTitle: string;
  progressSubtitle: string;
  progressHeroEyebrow: string;
  progressSectionTitle: string;
  progressSectionIntro: string;
  achievementSectionTitle: string;
  achievementSectionIntro: string;
  featureFlags: AppFeatureFlags;
};

type GameStateResponse = {
  gameState: GameState;
};

type CompleteQuestResponse = GameStateResponse & {
  completionFeedback: CompletionFeedback | null;
};

type ProgressStats = {
  totalCreated: number;
  totalCompleted: number;
  activeCount: number;
  completedCount: number;
};

type DailySuggestionsResponse = {
  suggestionDateKey: string;
  suggestions: SuggestedQuest[];
};

type RealmCodexResponse = {
  kicker: string;
  title: string;
  subtitle: string;
  heartbeatLabel: string;
  heartbeatStatus: string;
  syncLatencyMs: number;
  summarySectionTitle: string;
  summarySectionIntro: string;
  featureFlagsSectionTitle: string;
  featureFlagsSectionIntro: string;
  modulesSectionTitle: string;
  modulesSectionIntro: string;
  configVersion: number;
  realmSeed: string;
  activeTheme: string;
  activeSort: string;
  questCount: number;
  suggestionSeed: string;
  featureFlags: Array<{
    id: string;
    label: string;
    status: string;
  }>;
  modules: Array<{
    id: string;
    name: string;
    description: string;
    status: string;
  }>;
};

type CompletionFeedback = {
  questTitle: string;
  xpGained: number;
};

type AchievementDefinition = {
  id: AchievementId;
  title: string;
  description: string;
};

type ThemePalette = {
  background: string;
  surfaceLow: string;
  surface: string;
  surfaceHigh: string;
  surfaceHighest: string;
  textPrimary: string;
  textMuted: string;
  amber: string;
  amberSoft: string;
  blue: string;
  blueSoft: string;
  success: string;
  ghostBorder: string;
  subtitle: string;
  placeholder: string;
  buttonText: string;
  buttonDisabled: string;
  activeBadgeBackground: string;
  doneBadgeBackground: string;
};

const themes: Record<ThemeMode, ThemePalette> = {
  dark: {
    background: '#0d111f',
    surfaceLow: '#141a31',
    surface: '#1c2544',
    surfaceHigh: '#25315a',
    surfaceHighest: '#304071',
    textPrimary: '#f7f4ef',
    textMuted: '#f1c56c',
    amber: '#ffb703',
    amberSoft: '#ffe08a',
    blue: '#23c8ff',
    blueSoft: '#9be8ff',
    success: '#63e28d',
    ghostBorder: 'rgba(155, 232, 255, 0.16)',
    subtitle: '#b3bfd9',
    placeholder: '#7f8baa',
    buttonText: '#2e1d00',
    buttonDisabled: '#8d701f',
    activeBadgeBackground: 'rgba(255, 183, 3, 0.18)',
    doneBadgeBackground: 'rgba(99, 226, 141, 0.16)',
  },
  light: {
    background: '#fff6e8',
    surfaceLow: '#fff0d9',
    surface: '#fff8ee',
    surfaceHigh: '#ffe2b8',
    surfaceHighest: '#ffd39b',
    textPrimary: '#2d1a0f',
    textMuted: '#a96510',
    amber: '#f4a300',
    amberSoft: '#ffd977',
    blue: '#129ed7',
    blueSoft: '#4dd7ff',
    success: '#269863',
    ghostBorder: 'rgba(244, 163, 0, 0.14)',
    subtitle: '#735d44',
    placeholder: '#a98860',
    buttonText: '#2d1a0f',
    buttonDisabled: '#d2b070',
    activeBadgeBackground: 'rgba(244, 163, 0, 0.12)',
    doneBadgeBackground: 'rgba(38, 152, 99, 0.12)',
  },
};

const difficultyOptions: Difficulty[] = ['Easy', 'Medium', 'Hard', 'Epic'];
const categoryOptions: Category[] = ['Main Quest', 'Side Quest'];
const difficultyFilterOptions: DifficultyFilter[] = [
  'All',
  'Easy',
  'Medium',
  'Hard',
  'Epic',
];
const categoryFilterOptions: CategoryFilter[] = [
  'All',
  'Main Quest',
  'Side Quest',
];
const statusFilterOptions: StatusFilter[] = ['All', 'Active', 'Completed'];
const defaultQuestSectionOrder: QuestBoardSectionKey[] = [
  'main',
  'side',
  'completed',
];
const sortOptions: SortOption[] = [
  'Newest first',
  'Oldest first',
  'Difficulty ascending',
  'Difficulty descending',
  'Title A-Z',
];

function createDefaultAppConfig(): AppConfig {
  return {
    configVersion: 1,
    boardKicker: 'Daily Quest Log',
    boardSubtitle:
      'Turn your everyday tasks into a progression path worth chasing.',
    heroEyebrow: 'Hero Overview',
    boardHeroTitlePrefix: 'Rank Title',
    boardHeroInsight:
      'The backend can rotate this hero-card guidance without another mobile rebuild.',
    realmSyncMessage:
      'Refresh this screen to pull the latest board copy from the backend.',
    suggestionSectionTitle: 'Daily Suggestions',
    addQuestSectionTitle: 'Forge New Quest',
    filterSectionTitle: 'Search And Filter',
    mainQuestSectionTitle: 'Main Quest',
    sideQuestSectionTitle: 'Side Quests',
    completedQuestSectionTitle: 'Completed Quests',
    questSectionOrder: defaultQuestSectionOrder,
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
}

const completionXpByDifficulty: Record<Difficulty, number> = {
  Easy: 10,
  Medium: 20,
  Hard: 35,
  Epic: 50,
};

const initialQuests: Quest[] = [
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
];

const suggestionTemplates: SuggestedQuest[] = [
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
];

const achievementDefinitions: AchievementDefinition[] = [
  {
    id: 'first-quest',
    title: 'First Quest',
    description: 'Create the first quest in your log.',
  },
  {
    id: 'quest-finisher',
    title: 'Quest Finisher',
    description: 'Complete your first quest.',
  },
  {
    id: 'rising-hero',
    title: 'Rising Hero',
    description: 'Reach 50 XP.',
  },
  {
    id: 'streak-keeper',
    title: 'Streak Keeper',
    description: 'Reach a 3-day streak.',
  },
  {
    id: 'quest-master',
    title: 'Quest Master',
    description: 'Complete 10 quests.',
  },
];

const rankThresholds: Array<{ minimumXp: number; title: RankTitle }> = [
  { minimumXp: 100, title: 'Champion' },
  { minimumXp: 50, title: 'Knight' },
  { minimumXp: 20, title: 'Adventurer' },
  { minimumXp: 0, title: 'Novice' },
];

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const difficultySortRank: Record<Difficulty, number> = {
  Easy: 1,
  Medium: 2,
  Hard: 3,
  Epic: 4,
};

function createQuestId() {
  return `quest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getRankTitleForXp(xp: number): RankTitle {
  return (
    rankThresholds.find(threshold => xp >= threshold.minimumXp)?.title ??
    'Novice'
  );
}

function getLevelForXp(xp: number) {
  if (xp >= 100) {
    return '04';
  }

  if (xp >= 50) {
    return '03';
  }

  if (xp >= 20) {
    return '02';
  }

  return '01';
}

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

  const todayKey = getDateKey();
  const dateDifference = getDateDifferenceInDays(lastCompletedDate, todayKey);

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


function createHeroProgress(
  xp: number,
  streakCount = 0,
  lastCompletedDate: string | null = null,
): HeroProgress {
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

function calculateCompletedQuestXp(quests: Quest[]) {
  return quests.reduce((totalXp, quest) => {
    if (quest.status !== 'Completed') {
      return totalXp;
    }

    return totalXp + completionXpByDifficulty[quest.difficulty];
  }, 0);
}

function normalizeQuest(quest: Omit<Quest, 'id'> & Partial<Pick<Quest, 'id'>>) {
  const xpReward = completionXpByDifficulty[quest.difficulty];

  return {
    ...quest,
    id: quest.id ?? createQuestId(),
    createdAt: typeof quest.createdAt === 'number' ? quest.createdAt : Date.now(),
    xpReward,
  };
}

function createInitialGameState(): GameState {
  const normalizedQuests = initialQuests.map(normalizeQuest);
  const hero = createHeroProgress(calculateCompletedQuestXp(normalizedQuests));

  return {
    hero,
    quests: normalizedQuests,
    themeMode: 'dark',
    sortOption: 'Newest first',
    unlockedAchievementIds: getUnlockedAchievementIds({
      hero,
      quests: normalizedQuests,
    }),
  };
}

function migrateLegacyQuests(quests: Quest[]): GameState {
  const normalizedQuests = quests.map(normalizeQuest);
  const hero = createHeroProgress(calculateCompletedQuestXp(normalizedQuests));

  return {
    hero,
    quests: normalizedQuests,
    themeMode: 'dark',
    sortOption: 'Newest first',
    unlockedAchievementIds: getUnlockedAchievementIds({
      hero,
      quests: normalizedQuests,
    }),
  };
}

function normalizeStoredGameState(state: GameState): GameState {
  const normalizedQuests = state.quests.map(normalizeQuest);
  const normalizedXp =
    typeof state.hero?.xp === 'number'
      ? state.hero.xp
      : calculateCompletedQuestXp(normalizedQuests);

  const hero = createHeroProgress(
    normalizedXp,
    state.hero?.streakCount,
    state.hero?.lastCompletedDate ?? null,
  );

  return {
    hero,
    quests: normalizedQuests,
    themeMode: state.themeMode === 'light' ? 'light' : 'dark',
    sortOption: sortOptions.includes(state.sortOption)
      ? state.sortOption
      : 'Newest first',
    unlockedAchievementIds: getUnlockedAchievementIds({
      hero,
      quests: normalizedQuests,
      existingUnlockedAchievementIds: state.unlockedAchievementIds ?? [],
    }),
  };
}

function normalizeAppConfigText(
  value: string | undefined,
  fallbackValue: string,
) {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : fallbackValue;
}

function normalizeQuestSectionOrder(
  questSectionOrder: QuestBoardSectionKey[] | undefined,
  fallbackOrder: QuestBoardSectionKey[],
) {
  if (!Array.isArray(questSectionOrder)) {
    return fallbackOrder;
  }

  const normalizedOrder = questSectionOrder.filter(
    (sectionKey): sectionKey is QuestBoardSectionKey =>
      sectionKey === 'main' ||
      sectionKey === 'side' ||
      sectionKey === 'completed',
  );
  const uniqueOrder = normalizedOrder.filter(
    (sectionKey, index) => normalizedOrder.indexOf(sectionKey) === index,
  );

  return uniqueOrder.length === fallbackOrder.length ? uniqueOrder : fallbackOrder;
}

function normalizeRemoteAppConfig(config: AppConfig): AppConfig {
  const fallbackConfig = createDefaultAppConfig();

  return {
    configVersion:
      typeof config?.configVersion === 'number' && config.configVersion > 0
        ? Math.floor(config.configVersion)
        : fallbackConfig.configVersion,
    boardKicker: normalizeAppConfigText(
      config?.boardKicker,
      fallbackConfig.boardKicker,
    ),
    boardSubtitle: normalizeAppConfigText(
      config?.boardSubtitle,
      fallbackConfig.boardSubtitle,
    ),
    heroEyebrow: normalizeAppConfigText(
      config?.heroEyebrow,
      fallbackConfig.heroEyebrow,
    ),
    boardHeroTitlePrefix: normalizeAppConfigText(
      config?.boardHeroTitlePrefix,
      fallbackConfig.boardHeroTitlePrefix,
    ),
    boardHeroInsight: normalizeAppConfigText(
      config?.boardHeroInsight,
      fallbackConfig.boardHeroInsight,
    ),
    realmSyncMessage: normalizeAppConfigText(
      config?.realmSyncMessage,
      fallbackConfig.realmSyncMessage,
    ),
    suggestionSectionTitle: normalizeAppConfigText(
      config?.suggestionSectionTitle,
      fallbackConfig.suggestionSectionTitle,
    ),
    addQuestSectionTitle: normalizeAppConfigText(
      config?.addQuestSectionTitle,
      fallbackConfig.addQuestSectionTitle,
    ),
    filterSectionTitle: normalizeAppConfigText(
      config?.filterSectionTitle,
      fallbackConfig.filterSectionTitle,
    ),
    mainQuestSectionTitle: normalizeAppConfigText(
      config?.mainQuestSectionTitle,
      fallbackConfig.mainQuestSectionTitle,
    ),
    sideQuestSectionTitle: normalizeAppConfigText(
      config?.sideQuestSectionTitle,
      fallbackConfig.sideQuestSectionTitle,
    ),
    completedQuestSectionTitle: normalizeAppConfigText(
      config?.completedQuestSectionTitle,
      fallbackConfig.completedQuestSectionTitle,
    ),
    questSectionOrder: normalizeQuestSectionOrder(
      config?.questSectionOrder,
      fallbackConfig.questSectionOrder,
    ),
    progressKicker: normalizeAppConfigText(
      config?.progressKicker,
      fallbackConfig.progressKicker,
    ),
    progressTitle: normalizeAppConfigText(
      config?.progressTitle,
      fallbackConfig.progressTitle,
    ),
    progressSubtitle: normalizeAppConfigText(
      config?.progressSubtitle,
      fallbackConfig.progressSubtitle,
    ),
    progressHeroEyebrow: normalizeAppConfigText(
      config?.progressHeroEyebrow,
      fallbackConfig.progressHeroEyebrow,
    ),
    progressSectionTitle: normalizeAppConfigText(
      config?.progressSectionTitle,
      fallbackConfig.progressSectionTitle,
    ),
    progressSectionIntro: normalizeAppConfigText(
      config?.progressSectionIntro,
      fallbackConfig.progressSectionIntro,
    ),
    achievementSectionTitle: normalizeAppConfigText(
      config?.achievementSectionTitle,
      fallbackConfig.achievementSectionTitle,
    ),
    achievementSectionIntro: normalizeAppConfigText(
      config?.achievementSectionIntro,
      fallbackConfig.achievementSectionIntro,
    ),
    featureFlags: {
      showRealmSyncCard:
        typeof config?.featureFlags?.showRealmSyncCard === 'boolean'
          ? config.featureFlags.showRealmSyncCard
          : fallbackConfig.featureFlags.showRealmSyncCard,
      showSuggestionSection:
        typeof config?.featureFlags?.showSuggestionSection === 'boolean'
          ? config.featureFlags.showSuggestionSection
          : fallbackConfig.featureFlags.showSuggestionSection,
      showFilterSection:
        typeof config?.featureFlags?.showFilterSection === 'boolean'
          ? config.featureFlags.showFilterSection
          : fallbackConfig.featureFlags.showFilterSection,
      showAchievementSection:
        typeof config?.featureFlags?.showAchievementSection === 'boolean'
          ? config.featureFlags.showAchievementSection
          : fallbackConfig.featureFlags.showAchievementSection,
      showAddQuestScreen:
        typeof config?.featureFlags?.showAddQuestScreen === 'boolean'
          ? config.featureFlags.showAddQuestScreen
          : fallbackConfig.featureFlags.showAddQuestScreen,
      showProgressScreen:
        typeof config?.featureFlags?.showProgressScreen === 'boolean'
          ? config.featureFlags.showProgressScreen
          : fallbackConfig.featureFlags.showProgressScreen,
      showRealmCodexScreen:
        typeof config?.featureFlags?.showRealmCodexScreen === 'boolean'
          ? config.featureFlags.showRealmCodexScreen
          : fallbackConfig.featureFlags.showRealmCodexScreen,
    },
  };
}

function isScreenAllowed(
  screenName: ScreenName,
  appConfig: AppConfig,
) {
  if (screenName === 'add-quest') {
    return appConfig.featureFlags.showAddQuestScreen;
  }

  if (screenName === 'progress') {
    return appConfig.featureFlags.showProgressScreen;
  }

  if (screenName === 'realm-codex') {
    return appConfig.featureFlags.showRealmCodexScreen;
  }

  return true;
}

function areGameStatesEqual(leftState: GameState, rightState: GameState) {
  return JSON.stringify(leftState) === JSON.stringify(rightState);
}

function getLocalMigrationState({
  storedGameState,
  legacyQuests,
}: {
  storedGameState: GameState | null;
  legacyQuests: Quest[] | null;
}) {
  if (storedGameState !== null) {
    return normalizeStoredGameState(storedGameState);
  }

  if (legacyQuests !== null) {
    return migrateLegacyQuests(legacyQuests);
  }

  return null;
}

function shouldMigrateLocalState(
  remoteGameState: GameState,
  localGameState: GameState | null,
) {
  if (localGameState === null) {
    return false;
  }

  const defaultGameState = createInitialGameState();

  return (
    areGameStatesEqual(remoteGameState, defaultGameState) &&
    !areGameStatesEqual(localGameState, defaultGameState)
  );
}

function questMatchesFilters({
  quest,
  searchQuery,
  selectedCategoryFilter,
  selectedDifficultyFilter,
  selectedStatusFilter,
}: {
  quest: Quest;
  searchQuery: string;
  selectedCategoryFilter: CategoryFilter;
  selectedDifficultyFilter: DifficultyFilter;
  selectedStatusFilter: StatusFilter;
}) {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matchesSearch =
    normalizedQuery.length === 0 ||
    quest.title.toLowerCase().includes(normalizedQuery);
  const matchesDifficulty =
    selectedDifficultyFilter === 'All' ||
    quest.difficulty === selectedDifficultyFilter;
  const matchesCategory =
    selectedCategoryFilter === 'All' || quest.category === selectedCategoryFilter;
  const matchesStatus =
    selectedStatusFilter === 'All' ||
    (selectedStatusFilter === 'Completed' && quest.status === 'Completed') ||
    (selectedStatusFilter === 'Active' && quest.status !== 'Completed');

  return matchesSearch && matchesDifficulty && matchesCategory && matchesStatus;
}

function getProgressStats(quests: Quest[]): ProgressStats {
  const totalCompleted = quests.filter(quest => quest.status === 'Completed').length;

  return {
    totalCreated: quests.length,
    totalCompleted,
    activeCount: quests.length - totalCompleted,
    completedCount: totalCompleted,
  };
}

function shouldUnlockAchievement({
  achievementId,
  hero,
  quests,
  stats,
}: {
  achievementId: AchievementId;
  hero: HeroProgress;
  quests: Quest[];
  stats: ProgressStats;
}) {
  switch (achievementId) {
    case 'first-quest':
      return quests.length >= 1;
    case 'quest-finisher':
      return stats.totalCompleted >= 1;
    case 'rising-hero':
      return hero.xp >= 50;
    case 'streak-keeper':
      return hero.streakCount >= 3;
    case 'quest-master':
      return stats.totalCompleted >= 10;
    default:
      return false;
  }
}

function getUnlockedAchievementIds({
  hero,
  quests,
  existingUnlockedAchievementIds = [],
}: {
  hero: HeroProgress;
  quests: Quest[];
  existingUnlockedAchievementIds?: AchievementId[];
}) {
  const stats = getProgressStats(quests);
  const unlockedAchievementIds = new Set<AchievementId>(
    existingUnlockedAchievementIds,
  );

  achievementDefinitions.forEach(achievement => {
    if (
      shouldUnlockAchievement({
        achievementId: achievement.id,
        hero,
        quests,
        stats,
      })
    ) {
      unlockedAchievementIds.add(achievement.id);
    }
  });

  return achievementDefinitions
    .map(achievement => achievement.id)
    .filter(achievementId => unlockedAchievementIds.has(achievementId));
}

function sortQuests(quests: Quest[], sortOption: SortOption) {
  const sortedQuests = [...quests];

  sortedQuests.sort((leftQuest, rightQuest) => {
    switch (sortOption) {
      case 'Oldest first':
        return leftQuest.createdAt - rightQuest.createdAt;
      case 'Difficulty ascending':
        return (
          difficultySortRank[leftQuest.difficulty] -
            difficultySortRank[rightQuest.difficulty] ||
          leftQuest.title.localeCompare(rightQuest.title)
        );
      case 'Difficulty descending':
        return (
          difficultySortRank[rightQuest.difficulty] -
            difficultySortRank[leftQuest.difficulty] ||
          leftQuest.title.localeCompare(rightQuest.title)
        );
      case 'Title A-Z':
        return leftQuest.title.localeCompare(rightQuest.title);
      case 'Newest first':
      default:
        return rightQuest.createdAt - leftQuest.createdAt;
    }
  });

  return sortedQuests;
}

function getDailySuggestions(dateKey: string, quests: Quest[]) {
  const existingQuestTitles = new Set(
    quests.map(quest => quest.title.trim().toLowerCase()),
  );
  const startingIndex =
    Number(dateKey.replace(/-/g, '')) % suggestionTemplates.length;
  const suggestions: SuggestedQuest[] = [];

  for (let offset = 0; offset < suggestionTemplates.length; offset += 1) {
    const suggestion =
      suggestionTemplates[(startingIndex + offset) % suggestionTemplates.length];
    const normalizedTitle = suggestion.title.trim().toLowerCase();

    if (existingQuestTitles.has(normalizedTitle)) {
      continue;
    }

    suggestions.push(suggestion);

    if (suggestions.length === 3) {
      break;
    }
  }

  return suggestions;
}

function HeroStat({
  label,
  value,
  accentStyle,
  styles,
}: {
  label: string;
  value: string;
  accentStyle?: object;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.heroStat}>
      <Text style={styles.heroStatLabel}>{label}</Text>
      <Text style={[styles.heroStatValue, accentStyle]}>{value}</Text>
    </View>
  );
}

function ProgressMetric({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.progressMetricCard}>
      <Text style={styles.progressMetricLabel}>{label}</Text>
      <Text style={styles.progressMetricValue}>{value}</Text>
    </View>
  );
}

function AchievementBadge({
  achievement,
  isUnlocked,
  styles,
}: {
  achievement: AchievementDefinition;
  isUnlocked: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View
      style={[
        styles.achievementCard,
        isUnlocked
          ? styles.achievementCardUnlocked
          : styles.achievementCardLocked,
      ]}>
      <Text
        style={[
          styles.achievementTitle,
          isUnlocked
            ? styles.achievementTitleUnlocked
            : styles.achievementTitleLocked,
        ]}>
        {achievement.title}
      </Text>
      <Text
        style={[
          styles.achievementDescription,
          isUnlocked
            ? styles.achievementDescriptionUnlocked
            : styles.achievementDescriptionLocked,
        ]}>
        {achievement.description}
      </Text>
      <Text
        style={[
          styles.achievementStatus,
          isUnlocked
            ? styles.achievementStatusUnlocked
            : styles.achievementStatusLocked,
        ]}>
        {isUnlocked ? 'Unlocked' : 'Locked'}
      </Text>
    </View>
  );
}

function SectionPicker({
  label,
  options,
  selectedValue,
  onSelect,
  styles,
  testIdPrefix,
}: {
  label: string;
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  styles: ReturnType<typeof createStyles>;
  testIdPrefix: string;
}) {
  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      <View style={styles.optionRow}>
        {options.map(option => {
          const isSelected = option === selectedValue;

          return (
            <Pressable
              key={option}
              onPress={() => onSelect(option)}
              style={[
                styles.optionChip,
                isSelected && styles.optionChipSelected,
              ]}
              testID={`${testIdPrefix}-${option.replace(/\s+/g, '-').toLowerCase()}`}>
              <Text
                style={[
                  styles.optionChipText,
                  isSelected && styles.optionChipTextSelected,
                ]}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ThemeToggle({
  styles,
  themeMode,
  onToggleTheme,
}: {
  styles: ReturnType<typeof createStyles>;
  themeMode: ThemeMode;
  onToggleTheme: () => void;
}) {
  const nextThemeLabel =
    themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  const nextThemeIcon = themeMode === 'dark' ? '☀' : '☾';

  return (
    <Pressable
      accessibilityLabel={nextThemeLabel}
      accessibilityRole="button"
      onPress={onToggleTheme}
      style={styles.themeToggleButton}
      testID="theme-toggle-button">
      <Text style={styles.themeToggleText}>{nextThemeIcon}</Text>
    </Pressable>
  );
}

function QuestCard({
  quest,
  styles,
  onComplete,
  onEdit,
}: {
  quest: Quest;
  styles: ReturnType<typeof createStyles>;
  onComplete?: (questId: string) => void;
  onEdit?: (questId: string) => void;
}) {
  const isComplete = quest.status === 'Completed';

  return (
    <View style={[styles.questCard, isComplete && styles.questCardCompleted]}>
      <View style={styles.questHeaderRow}>
        <Text style={styles.questTitle}>{quest.title}</Text>
        <View
          style={[
            styles.statusBadge,
            isComplete ? styles.statusBadgeDone : styles.statusBadgeActive,
          ]}>
          <Text
            style={[
              styles.statusBadgeText,
              isComplete && styles.statusBadgeTextDone,
            ]}>
            {quest.status}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaPill}>
          <Text style={styles.metaLabel}>Difficulty</Text>
          <Text style={styles.metaValue}>{quest.difficulty}</Text>
        </View>
        <View style={[styles.metaPill, styles.metaPillHighlight]}>
          <Text style={styles.metaLabel}>XP Reward</Text>
          <Text style={[styles.metaValue, styles.metaValueHighlight]}>
            +{quest.xpReward}
          </Text>
        </View>
      </View>

      {!isComplete && onComplete ? (
        <Pressable
          onPress={() => onComplete(quest.id)}
          style={styles.completeButton}
          testID={`complete-quest-${quest.id}`}>
          <Text style={styles.completeButtonText}>Mark Completed</Text>
        </Pressable>
      ) : null}

      {onEdit ? (
        <Pressable
          onPress={() => onEdit(quest.id)}
          style={styles.cardSecondaryButton}
          testID={`edit-quest-${quest.id}`}>
          <Text style={styles.cardSecondaryButtonText}>Edit Quest</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function QuestBoardScreen({
  appConfig,
  hero,
  quests,
  dailySuggestionDateKey,
  dailySuggestions,
  selectedSortOption,
  styles,
  themeMode,
  onRefreshAppConfig,
  onToggleTheme,
  onAddSuggestedQuest,
  onCompleteQuest,
  onEditQuest,
  onNavigateToAddQuest,
  onNavigateToProgress,
  onNavigateToRealmCodex,
  onSelectSortOption,
  completionFeedback,
  isRefreshingAppConfig,
}: {
  appConfig: AppConfig;
  hero: HeroProgress;
  quests: Quest[];
  dailySuggestionDateKey: string;
  dailySuggestions: SuggestedQuest[];
  selectedSortOption: SortOption;
  styles: ReturnType<typeof createStyles>;
  themeMode: ThemeMode;
  onRefreshAppConfig: () => void;
  onToggleTheme: () => void;
  onAddSuggestedQuest: (suggestion: SuggestedQuest) => void;
  onCompleteQuest: (questId: string) => void;
  onEditQuest: (questId: string) => void;
  onNavigateToAddQuest: () => void;
  onNavigateToProgress: () => void;
  onNavigateToRealmCodex: () => void;
  onSelectSortOption: (sortOption: SortOption) => void;
  completionFeedback: CompletionFeedback | null;
  isRefreshingAppConfig: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] =
    useState<DifficultyFilter>('All');
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<CategoryFilter>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<StatusFilter>('All');
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const feedbackTranslateY = useRef(new Animated.Value(-12)).current;

  useEffect(() => {
    if (!completionFeedback) {
      return;
    }

    feedbackOpacity.setValue(0);
    feedbackTranslateY.setValue(-12);

    Animated.parallel([
      Animated.timing(feedbackOpacity, {
        duration: 240,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(feedbackTranslateY, {
        damping: 14,
        stiffness: 190,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  }, [completionFeedback, feedbackOpacity, feedbackTranslateY]);

  const visibleQuests = sortQuests(
    quests.filter(quest =>
      questMatchesFilters({
        quest,
        searchQuery,
        selectedCategoryFilter,
        selectedDifficultyFilter,
        selectedStatusFilter,
      }),
    ),
    selectedSortOption,
  );

  const mainQuests = visibleQuests.filter(
    quest => quest.category === 'Main Quest' && quest.status !== 'Completed',
  );
  const sideQuests = visibleQuests.filter(
    quest => quest.category === 'Side Quest' && quest.status !== 'Completed',
  );
  const completedQuests = visibleQuests.filter(
    quest => quest.status === 'Completed',
  );
  const hasVisibleQuests = visibleQuests.length > 0;
  const questSections = appConfig.questSectionOrder.map(sectionKey => {
    if (sectionKey === 'main') {
      return {
        key: 'main',
        title: appConfig.mainQuestSectionTitle,
        quests: mainQuests,
      };
    }

    if (sectionKey === 'side') {
      return {
        key: 'side',
        title: appConfig.sideQuestSectionTitle,
        quests: sideQuests,
      };
    }

    return {
      key: 'completed',
      title: appConfig.completedQuestSectionTitle,
      quests: completedQuests,
    };
  });

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.kicker}>{appConfig.boardKicker}</Text>
          <Text style={styles.title}>Quest Forge</Text>
        </View>
        <ThemeToggle
          onToggleTheme={onToggleTheme}
          styles={styles}
          themeMode={themeMode}
        />
      </View>

      <Text style={styles.subtitle}>{appConfig.boardSubtitle}</Text>

      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroEyebrow}>{appConfig.heroEyebrow}</Text>
            <Text style={styles.heroTitle}>
              {appConfig.boardHeroTitlePrefix}: {hero.rankTitle}
            </Text>
          </View>
          <View style={styles.heroOrb} />
        </View>

        <View style={styles.heroStatsRow}>
          <HeroStat
            accentStyle={styles.levelAccent}
            label="Level"
            styles={styles}
            value={getLevelForXp(hero.xp)}
          />
          <HeroStat
            accentStyle={styles.xpAccent}
            label="XP"
            styles={styles}
            value={`${hero.xp}`}
          />
          <HeroStat
            accentStyle={styles.streakAccent}
            label="Streak"
            styles={styles}
            value={`${hero.streakCount}d`}
          />
        </View>
        <Text style={styles.heroSupportText}>{appConfig.boardHeroInsight}</Text>
      </View>

      {completionFeedback ? (
        <Animated.View
          style={[
            styles.completionBanner,
            {
              opacity: feedbackOpacity,
              transform: [{ translateY: feedbackTranslateY }],
            },
          ]}
          testID="completion-feedback-banner">
          <Text style={styles.completionBannerKicker}>Quest Complete</Text>
          <Text style={styles.completionBannerTitle}>
            {completionFeedback.questTitle}
          </Text>
          <Text style={styles.completionBannerText}>
            +{completionFeedback.xpGained} XP gained
          </Text>
        </Animated.View>
      ) : null}

      {appConfig.featureFlags.showRealmSyncCard ? (
        <View style={styles.boardActionCard} testID="realm-sync-card">
          <Text style={styles.sectionTitle}>Realm Sync</Text>
          <Text style={styles.formIntro}>
            Config v{appConfig.configVersion}. {appConfig.realmSyncMessage}
          </Text>
          <Pressable
            onPress={onRefreshAppConfig}
            style={styles.secondaryActionButton}
            testID="refresh-app-config">
            <Text style={styles.secondaryActionText}>
              {isRefreshingAppConfig ? 'Syncing Realm...' : 'Refresh Realm Copy'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {appConfig.featureFlags.showSuggestionSection ? (
        <View style={styles.boardActionCard}>
          <Text style={styles.sectionTitle}>{appConfig.suggestionSectionTitle}</Text>
          <Text style={styles.formIntro}>
            Fresh quest ideas now come from a backend-generated daily feed so the
            board can change without another mobile rebuild.
          </Text>
          <Text style={styles.formHint}>Realm seed: {dailySuggestionDateKey}</Text>

          {dailySuggestions.length > 0 ? (
            dailySuggestions.map((suggestion, index) => (
              <View
                key={`${suggestion.title}-${index}`}
                style={styles.suggestionCard}
                testID={`daily-suggestion-card-${index}`}>
                <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                <View style={styles.metaRow}>
                  <View style={styles.metaPill}>
                    <Text style={styles.metaLabel}>Difficulty</Text>
                    <Text style={styles.metaValue}>{suggestion.difficulty}</Text>
                  </View>
                  <View style={styles.metaPill}>
                    <Text style={styles.metaLabel}>Category</Text>
                    <Text style={styles.metaValue}>{suggestion.category}</Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => onAddSuggestedQuest(suggestion)}
                  style={styles.cardSecondaryButton}
                  testID={`add-suggested-quest-${index}`}>
                  <Text style={styles.cardSecondaryButtonText}>
                    Add Suggested Quest
                  </Text>
                </Pressable>
              </View>
            ))
          ) : (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateTitle}>No fresh suggestions today</Text>
              <Text style={styles.emptyStateText}>
                Your current quest log already covers the local suggestion pool.
              </Text>
            </View>
          )}
        </View>
      ) : null}


      <View style={styles.boardActionCard}>
        <Text style={styles.sectionTitle}>{appConfig.addQuestSectionTitle}</Text>
        <Text style={styles.formIntro}>
          Open the dedicated Add Quest screen to create a new mission for your
          quest log.
        </Text>
        {appConfig.featureFlags.showAddQuestScreen ? (
          <Pressable
            onPress={onNavigateToAddQuest}
            style={styles.primaryActionButton}
            testID="navigate-to-add-quest">
            <Text style={styles.primaryActionText}>Open Add Quest</Text>
          </Pressable>
        ) : null}
        {appConfig.featureFlags.showProgressScreen ? (
          <Pressable
            onPress={onNavigateToProgress}
            style={styles.secondaryActionButton}
            testID="navigate-to-progress-screen">
            <Text style={styles.secondaryActionText}>Open Progress</Text>
          </Pressable>
        ) : null}
        {appConfig.featureFlags.showRealmCodexScreen ? (
          <Pressable
            onPress={onNavigateToRealmCodex}
            style={styles.secondaryActionButton}
            testID="navigate-to-realm-codex">
            <Text style={styles.secondaryActionText}>Open Realm Codex</Text>
          </Pressable>
        ) : null}
      </View>

      {appConfig.featureFlags.showFilterSection ? (
        <View style={styles.filterCard}>
          <Text style={styles.sectionTitle}>{appConfig.filterSectionTitle}</Text>
          <Text style={styles.formIntro}>
            Narrow the board by title, difficulty, category, and completion
            status.
          </Text>

          <View style={styles.formField}>
            <Text style={styles.formLabel}>Search By Title</Text>
            <TextInput
              onChangeText={setSearchQuery}
              placeholder="Search quests"
              placeholderTextColor={styles.themePlaceholder.color}
              style={styles.titleInput}
              testID="quest-search-input"
              value={searchQuery}
            />
          </View>

          <SectionPicker
            label="Difficulty Filter"
            onSelect={value =>
              setSelectedDifficultyFilter(value as DifficultyFilter)
            }
            options={difficultyFilterOptions}
            selectedValue={selectedDifficultyFilter}
            styles={styles}
            testIdPrefix="difficulty-filter"
          />

          <SectionPicker
            label="Category Filter"
            onSelect={value => setSelectedCategoryFilter(value as CategoryFilter)}
            options={categoryFilterOptions}
            selectedValue={selectedCategoryFilter}
            styles={styles}
            testIdPrefix="category-filter"
          />

          <SectionPicker
            label="Status Filter"
            onSelect={value => setSelectedStatusFilter(value as StatusFilter)}
            options={statusFilterOptions}
            selectedValue={selectedStatusFilter}
            styles={styles}
            testIdPrefix="status-filter"
          />

          <SectionPicker
            label="Sort Quests"
            onSelect={value => onSelectSortOption(value as SortOption)}
            options={sortOptions}
            selectedValue={selectedSortOption}
            styles={styles}
            testIdPrefix="sort-option"
          />
        </View>
      ) : null}

      {!hasVisibleQuests ? (
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateTitle}>No quests match your filters</Text>
          <Text style={styles.emptyStateText}>
            Try a different search or reset one of the filter chips.
          </Text>
        </View>
      ) : null}

      {questSections.map(section => (
        <View key={section.key} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.quests.map(quest => (
            <QuestCard
              key={quest.id}
              onComplete={
                section.key === 'completed' ? undefined : onCompleteQuest
              }
              onEdit={
                appConfig.featureFlags.showAddQuestScreen ? onEditQuest : undefined
              }
              quest={quest}
              styles={styles}
            />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

function ProgressScreen({
  appConfig,
  hero,
  quests,
  unlockedAchievementIds,
  onBack,
  onToggleTheme,
  styles,
  themeMode,
}: {
  appConfig: AppConfig;
  hero: HeroProgress;
  quests: Quest[];
  unlockedAchievementIds: AchievementId[];
  onBack: () => void;
  onToggleTheme: () => void;
  styles: ReturnType<typeof createStyles>;
  themeMode: ThemeMode;
}) {
  const stats = getProgressStats(quests);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <View style={styles.screenHeader}>
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          testID="back-from-progress-screen">
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.screenLabel}>Quest Board</Text>
        <ThemeToggle
          onToggleTheme={onToggleTheme}
          styles={styles}
          themeMode={themeMode}
        />
      </View>

      <Text style={styles.kicker}>{appConfig.progressKicker}</Text>
      <Text style={styles.title}>{appConfig.progressTitle}</Text>
      <Text style={styles.subtitle}>{appConfig.progressSubtitle}</Text>

      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroEyebrow}>{appConfig.progressHeroEyebrow}</Text>
            <Text style={styles.heroTitle}>Rank Title: {hero.rankTitle}</Text>
          </View>
          <View style={styles.heroOrb} />
        </View>

        <View style={styles.heroStatsRow}>
          <HeroStat
            accentStyle={styles.levelAccent}
            label="Level"
            styles={styles}
            value={getLevelForXp(hero.xp)}
          />
          <HeroStat
            accentStyle={styles.xpAccent}
            label="XP"
            styles={styles}
            value={`${hero.xp}`}
          />
          <HeroStat
            accentStyle={styles.streakAccent}
            label="Streak"
            styles={styles}
            value={`${hero.streakCount}d`}
          />
        </View>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>{appConfig.progressSectionTitle}</Text>
        <Text style={styles.formIntro}>{appConfig.progressSectionIntro}</Text>

        <View style={styles.progressGrid}>
          <ProgressMetric
            label="Total Quests Created"
            styles={styles}
            value={`${stats.totalCreated}`}
          />
          <ProgressMetric
            label="Total Quests Completed"
            styles={styles}
            value={`${stats.totalCompleted}`}
          />
          <ProgressMetric
            label="Active Quests"
            styles={styles}
            value={`${stats.activeCount}`}
          />
          <ProgressMetric
            label="Completed Quests"
            styles={styles}
            value={`${stats.completedCount}`}
          />
          <ProgressMetric
            label="Current Streak"
            styles={styles}
            value={`${hero.streakCount} days`}
          />
        </View>
      </View>

      {appConfig.featureFlags.showAchievementSection ? (
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>{appConfig.achievementSectionTitle}</Text>
          <Text style={styles.formIntro}>{appConfig.achievementSectionIntro}</Text>

          <View style={styles.achievementGrid}>
            {achievementDefinitions.map(achievement => (
              <AchievementBadge
                achievement={achievement}
                isUnlocked={unlockedAchievementIds.includes(achievement.id)}
                key={achievement.id}
                styles={styles}
              />
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

function RealmCodexScreen({
  isRefreshingRealmCodex,
  onBack,
  onRefresh,
  onToggleTheme,
  realmCodex,
  styles,
  themeMode,
}: {
  isRefreshingRealmCodex: boolean;
  onBack: () => void;
  onRefresh: () => void;
  onToggleTheme: () => void;
  realmCodex: RealmCodexResponse;
  styles: ReturnType<typeof createStyles>;
  themeMode: ThemeMode;
}) {
  const isEnabledStatus = (status: string) =>
    status === 'Enabled' || status === 'Live' || status === 'Stable';

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <View style={styles.screenHeader}>
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          testID="back-from-realm-codex">
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.screenLabel}>Quest Board</Text>
        <ThemeToggle
          onToggleTheme={onToggleTheme}
          styles={styles}
          themeMode={themeMode}
        />
      </View>

      <Text style={styles.kicker}>{realmCodex.kicker}</Text>
      <Text style={styles.title}>{realmCodex.title}</Text>
      <Text style={styles.subtitle}>{realmCodex.subtitle}</Text>

      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroEyebrow}>{realmCodex.heartbeatLabel}</Text>
            <Text style={styles.heroTitle}>{realmCodex.heartbeatStatus}</Text>
          </View>
          <View style={styles.heroOrb} />
        </View>

        <View style={styles.heroStatsRow}>
          <HeroStat
            accentStyle={styles.xpAccent}
            label="Latency"
            styles={styles}
            value={`${realmCodex.syncLatencyMs}ms`}
          />
          <HeroStat
            accentStyle={styles.levelAccent}
            label="Config"
            styles={styles}
            value={`v${realmCodex.configVersion}`}
          />
          <HeroStat
            accentStyle={styles.streakAccent}
            label="Quests"
            styles={styles}
            value={`${realmCodex.questCount}`}
          />
        </View>

        <Pressable
          onPress={onRefresh}
          style={styles.secondaryActionButton}
          testID="refresh-realm-codex">
          <Text style={styles.secondaryActionText}>
            {isRefreshingRealmCodex ? 'Refreshing Codex...' : 'Refresh Codex'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>{realmCodex.summarySectionTitle}</Text>
        <Text style={styles.formIntro}>{realmCodex.summarySectionIntro}</Text>

        <View style={styles.progressGrid}>
          <ProgressMetric
            label="Realm Seed"
            styles={styles}
            value={realmCodex.realmSeed}
          />
          <ProgressMetric
            label="Theme"
            styles={styles}
            value={realmCodex.activeTheme}
          />
          <ProgressMetric
            label="Sort Order"
            styles={styles}
            value={realmCodex.activeSort}
          />
          <ProgressMetric
            label="Suggestion Seed"
            styles={styles}
            value={realmCodex.suggestionSeed}
          />
        </View>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>{realmCodex.featureFlagsSectionTitle}</Text>
        <Text style={styles.formIntro}>{realmCodex.featureFlagsSectionIntro}</Text>

        {realmCodex.featureFlags.map(flag => {
          const isEnabled = isEnabledStatus(flag.status);

          return (
            <View key={flag.id} style={styles.suggestionCard}>
              <View style={styles.questHeaderRow}>
                <Text style={styles.suggestionTitle}>{flag.label}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    isEnabled ? styles.statusBadgeDone : styles.statusBadgeActive,
                  ]}>
                  <Text
                    style={[
                      styles.statusBadgeText,
                      isEnabled ? styles.statusBadgeTextDone : null,
                    ]}>
                    {flag.status}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>{realmCodex.modulesSectionTitle}</Text>
        <Text style={styles.formIntro}>{realmCodex.modulesSectionIntro}</Text>

        {realmCodex.modules.map(module => {
          const isEnabled = isEnabledStatus(module.status);

          return (
            <View key={module.id} style={styles.suggestionCard}>
              <View style={styles.questHeaderRow}>
                <Text style={styles.suggestionTitle}>{module.name}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    isEnabled ? styles.statusBadgeDone : styles.statusBadgeActive,
                  ]}>
                  <Text
                    style={[
                      styles.statusBadgeText,
                      isEnabled ? styles.statusBadgeTextDone : null,
                    ]}>
                    {module.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.formHint}>{module.description}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function AddQuestScreen({
  onBack,
  onSave,
  onDelete,
  questToEdit,
  onToggleTheme,
  styles,
  themeMode,
}: {
  onBack: () => void;
  onSave: (questDraft: QuestDraft) => void;
  onDelete: (questId: string) => void;
  questToEdit: Quest | null;
  onToggleTheme: () => void;
  styles: ReturnType<typeof createStyles>;
  themeMode: ThemeMode;
}) {
  const isEditing = questToEdit !== null;
  const [questTitle, setQuestTitle] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty>('Easy');
  const [selectedCategory, setSelectedCategory] =
    useState<Category>('Side Quest');

  useEffect(() => {
    if (questToEdit) {
      setQuestTitle(questToEdit.title);
      setSelectedDifficulty(questToEdit.difficulty);
      setSelectedCategory(questToEdit.category);
      return;
    }

    setQuestTitle('');
    setSelectedDifficulty('Easy');
    setSelectedCategory('Side Quest');
  }, [questToEdit]);

  const canSaveQuest = questTitle.trim().length > 0;

  const handleSaveQuest = () => {
    const title = questTitle.trim();

    if (!title) {
      return;
    }

    onSave({
      title,
      difficulty: selectedDifficulty,
      category: selectedCategory,
    });
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <View style={styles.screenHeader}>
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          testID="back-to-quest-board">
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.screenLabel}>Quest Board</Text>
        <ThemeToggle
          onToggleTheme={onToggleTheme}
          styles={styles}
          themeMode={themeMode}
        />
      </View>

      <Text style={styles.kicker}>{isEditing ? 'Edit Quest' : 'Add Quest'}</Text>
      <Text style={styles.title}>
        {isEditing ? 'Refine Quest Details' : 'Forge New Quest'}
      </Text>
      <Text style={styles.subtitle}>
        {isEditing
          ? 'Update the quest and send the changes back to the Quest Board instantly.'
          : 'Create a new mission and send it back to the Quest Board instantly.'}
      </Text>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Quest Details</Text>
        <Text style={styles.formIntro}>
          {isEditing
            ? 'Keep this screen focused on updating one existing quest at a time.'
            : 'Keep this screen focused on creating one new quest at a time.'}
        </Text>

        {questToEdit?.status === 'Completed' ? (
          <Text style={styles.formHint}>
            Completed quest edits only update the saved details. Earned XP and
            streak history stay as they are.
          </Text>
        ) : null}

        <View style={styles.formField}>
          <Text style={styles.formLabel}>Quest Title</Text>
          <TextInput
            onChangeText={setQuestTitle}
            placeholder="Enter a new quest title"
            placeholderTextColor={styles.themePlaceholder.color}
            style={styles.titleInput}
            testID="quest-title-input"
            value={questTitle}
          />
        </View>

        <SectionPicker
          label="Difficulty"
          onSelect={value => setSelectedDifficulty(value as Difficulty)}
          options={difficultyOptions}
          selectedValue={selectedDifficulty}
          styles={styles}
          testIdPrefix="difficulty-option"
        />

        <SectionPicker
          label="Category"
          onSelect={value => setSelectedCategory(value as Category)}
          options={categoryOptions}
          selectedValue={selectedCategory}
          styles={styles}
          testIdPrefix="category-option"
        />

        <Pressable
          disabled={!canSaveQuest}
          onPress={handleSaveQuest}
          style={[
            styles.saveButton,
            !canSaveQuest && styles.saveButtonDisabled,
          ]}
          testID="save-quest-button">
          <Text style={styles.saveButtonText}>
            {isEditing ? 'Save Changes' : 'Save Quest'}
          </Text>
        </Pressable>

        {questToEdit ? (
          <Pressable
            onPress={() => onDelete(questToEdit.id)}
            style={styles.deleteButton}
            testID="delete-quest-button">
            <Text style={styles.deleteButtonText}>Delete Quest</Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

function App() {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState);
  const [appConfig, setAppConfig] = useState<AppConfig>(createDefaultAppConfig);
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('quest-board');
  const [isHydrated, setIsHydrated] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [backendRetryCount, setBackendRetryCount] = useState(0);
  const [completionFeedback, setCompletionFeedback] =
    useState<CompletionFeedback | null>(null);
  const [editingQuestId, setEditingQuestId] = useState<string | null>(null);
  const [isRefreshingAppConfig, setIsRefreshingAppConfig] = useState(false);
  const [realmCodex, setRealmCodex] = useState<RealmCodexResponse | null>(null);
  const [isRefreshingRealmCodex, setIsRefreshingRealmCodex] = useState(false);
  const [dailySuggestions, setDailySuggestions] = useState<SuggestedQuest[]>(
    () => getDailySuggestions(getDateKey(), initialQuests.map(normalizeQuest)),
  );
  const [dailySuggestionDateKey, setDailySuggestionDateKey] = useState(
    getDateKey(),
  );

  const currentTheme = themes[gameState.themeMode];
  const styles = createStyles(currentTheme);
  const questToEdit =
    editingQuestId === null
      ? null
      : gameState.quests.find(quest => quest.id === editingQuestId) ?? null;

  const backendUnavailableMessage =
    'Backend connection required. Start `npm run backend` and retry.';

  const applyRemoteGameState = (nextGameState: GameState) => {
    const normalizedGameState = normalizeStoredGameState(nextGameState);

    setGameState(normalizedGameState);

    return normalizedGameState;
  };

  const applyRemoteAppConfig = (nextAppConfig: AppConfig) => {
    const normalizedAppConfig = normalizeRemoteAppConfig(nextAppConfig);

    setAppConfig(normalizedAppConfig);

    return normalizedAppConfig;
  };

  const applyRemoteDailySuggestions = (
    nextDailySuggestions: DailySuggestionsResponse,
  ) => {
    setDailySuggestionDateKey(nextDailySuggestions.suggestionDateKey);
    setDailySuggestions(nextDailySuggestions.suggestions);

    return nextDailySuggestions;
  };

  const applyRemoteRealmCodex = (nextRealmCodex: RealmCodexResponse) => {
    setRealmCodex(nextRealmCodex);

    return nextRealmCodex;
  };

  const refreshRemoteDailySuggestions = async () => {
    const nextDailySuggestions =
      await fetchRemoteDailySuggestions<DailySuggestionsResponse>();

    applyRemoteDailySuggestions(nextDailySuggestions);

    return nextDailySuggestions;
  };

  const refreshRemoteRealmCodex = async () => {
    const nextRealmCodex = await fetchRemoteRealmCodex<RealmCodexResponse>();

    applyRemoteRealmCodex(nextRealmCodex);

    return nextRealmCodex;
  };

  const runGameStateRequest = async <T extends GameStateResponse>(
    request: () => Promise<T>,
  ) => {
    try {
      setBackendError(null);
      const response = await request();

      applyRemoteGameState(response.gameState);
      if (currentScreen === 'realm-codex') {
        await refreshRemoteRealmCodex();
      }

      return response;
    } catch {
      setBackendError(backendUnavailableMessage);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const hydrateGameState = async () => {
      setIsHydrated(false);
      setBackendError(null);

      try {
        const [remoteGameStateResponse, remoteAppConfigResponse, remoteDailySuggestionsResponse] =
          await Promise.all([
            fetchRemoteGameState<GameState>(),
            fetchRemoteAppConfig<AppConfig>(),
            fetchRemoteDailySuggestions<DailySuggestionsResponse>(),
          ]);
        const remoteGameState = normalizeStoredGameState(
          remoteGameStateResponse,
        );
        const remoteAppConfig = normalizeRemoteAppConfig(
          remoteAppConfigResponse,
        );
        const storedGameState = await loadStoredGameState<GameState>();
        const legacyQuests = storedGameState
          ? null
          : await loadLegacyStoredQuests<Quest>();
        const localMigrationState = getLocalMigrationState({
          storedGameState,
          legacyQuests,
        });
        const nextGameState = shouldMigrateLocalState(
          remoteGameState,
          localMigrationState,
        )
          ? (localMigrationState as GameState)
          : remoteGameState;

        if (shouldMigrateLocalState(remoteGameState, localMigrationState)) {
          await saveRemoteGameState(nextGameState);
        }

        if (!isMounted) {
          return;
        }

        applyRemoteGameState(nextGameState);
        applyRemoteAppConfig(remoteAppConfig);
        applyRemoteDailySuggestions(remoteDailySuggestionsResponse);
      } catch {
        if (!isMounted) {
          return;
        }

        setBackendError(backendUnavailableMessage);
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    };

    hydrateGameState();

    return () => {
      isMounted = false;
    };
  }, [backendRetryCount]);

  useEffect(() => {
    if (isScreenAllowed(currentScreen, appConfig)) {
      return;
    }

    setCurrentScreen('quest-board');
    setEditingQuestId(null);
  }, [appConfig, currentScreen]);

  const returnToBoard = () => {
    setEditingQuestId(null);
    setCurrentScreen('quest-board');
  };

  const handleSaveQuest = async (questDraft: QuestDraft) => {
    const response = questToEdit
      ? await runGameStateRequest(() =>
          updateRemoteQuest<QuestDraft, GameStateResponse>(
            questToEdit.id,
            questDraft,
          ),
        )
      : await runGameStateRequest(() =>
          createRemoteQuest<QuestDraft, GameStateResponse>(questDraft),
        );

    if (response) {
      await refreshRemoteDailySuggestions();
      returnToBoard();
    }
  };

  const handleAddSuggestedQuest = async (suggestion: SuggestedQuest) => {
    const response = await runGameStateRequest(() =>
      createRemoteQuest<SuggestedQuest, GameStateResponse>(suggestion),
    );

    if (response) {
      await refreshRemoteDailySuggestions();
    }
  };

  const handleDeleteQuest = async (questId: string) => {
    const response = await runGameStateRequest(() =>
      deleteRemoteQuest<GameStateResponse>(questId),
    );

    if (response) {
      await refreshRemoteDailySuggestions();
      returnToBoard();
    }
  };

  const handleCompleteQuest = async (questId: string) => {
    const response = await runGameStateRequest(() =>
      completeRemoteQuest<CompleteQuestResponse>(questId),
    );

    if (response?.completionFeedback) {
      setCompletionFeedback(response.completionFeedback);
    }
  };

  const handleToggleTheme = async () => {
    const nextThemeMode: ThemeMode =
      gameState.themeMode === 'dark' ? 'light' : 'dark';

    await runGameStateRequest(() =>
      updateRemoteTheme<ThemeMode, GameStateResponse>(nextThemeMode),
    );
  };

  const handleSelectSortOption = async (sortOption: SortOption) => {
    await runGameStateRequest(() =>
      updateRemoteSortOption<SortOption, GameStateResponse>(sortOption),
    );
  };

  const handleOpenAddQuest = () => {
    if (!appConfig.featureFlags.showAddQuestScreen) {
      return;
    }

    setEditingQuestId(null);
    setCurrentScreen('add-quest');
  };

  const handleOpenProgress = () => {
    if (!appConfig.featureFlags.showProgressScreen) {
      return;
    }

    setCurrentScreen('progress');
  };

  const handleOpenRealmCodex = async () => {
    if (!appConfig.featureFlags.showRealmCodexScreen) {
      return;
    }

    setCurrentScreen('realm-codex');
    setIsRefreshingRealmCodex(true);

    try {
      setBackendError(null);
      await refreshRemoteRealmCodex();
    } catch {
      setBackendError(backendUnavailableMessage);
      setCurrentScreen('quest-board');
    } finally {
      setIsRefreshingRealmCodex(false);
    }
  };

  const handleRefreshRealmCodex = async () => {
    setIsRefreshingRealmCodex(true);

    try {
      setBackendError(null);
      await refreshRemoteRealmCodex();
    } catch {
      setBackendError(backendUnavailableMessage);
    } finally {
      setIsRefreshingRealmCodex(false);
    }
  };

  const handleRefreshAppConfig = async () => {
    setIsRefreshingAppConfig(true);

    try {
      setBackendError(null);
      const [nextGameState, nextAppConfig, nextDailySuggestions] = await Promise.all([
        fetchRemoteGameState<GameState>(),
        fetchRemoteAppConfig<AppConfig>(),
        fetchRemoteDailySuggestions<DailySuggestionsResponse>(),
      ]);

      applyRemoteGameState(nextGameState);
      applyRemoteAppConfig(nextAppConfig);
      applyRemoteDailySuggestions(nextDailySuggestions);
      if (currentScreen === 'realm-codex') {
        await refreshRemoteRealmCodex();
      }
    } catch {
      setBackendError(backendUnavailableMessage);
    } finally {
      setIsRefreshingAppConfig(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <View pointerEvents="none" style={styles.backgroundDecor}>
          <View style={styles.backgroundOrbPrimary} />
          <View style={styles.backgroundOrbSecondary} />
          <View style={styles.backgroundOrbTertiary} />
        </View>
        <View style={styles.contentFrame}>
          <StatusBar
            backgroundColor={currentTheme.background}
            barStyle={
              gameState.themeMode === 'dark' ? 'light-content' : 'dark-content'
            }
          />
          {!isHydrated ? (
            <View style={styles.loadingState}>
              <Text style={styles.loadingKicker}>Restoring Quest Log</Text>
              <Text style={styles.loadingTitle}>Quest Forge</Text>
            </View>
          ) : backendError ? (
            <View style={styles.loadingState}>
              <View style={styles.connectionStateCard}>
                <Text style={styles.loadingKicker}>Backend Required</Text>
                <Text style={styles.connectionStateTitle}>
                  Quest Forge API Offline
                </Text>
                <Text style={styles.connectionStateText}>{backendError}</Text>
                <Pressable
                  onPress={() => setBackendRetryCount(count => count + 1)}
                  style={styles.primaryActionButton}
                  testID="retry-backend-connection">
                  <Text style={styles.primaryActionText}>Retry Connection</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              {currentScreen === 'quest-board' ? (
                <QuestBoardScreen
                  appConfig={appConfig}
                  completionFeedback={completionFeedback}
                  dailySuggestionDateKey={dailySuggestionDateKey}
                  dailySuggestions={dailySuggestions}
                  hero={gameState.hero}
                  isRefreshingAppConfig={isRefreshingAppConfig}
                  onAddSuggestedQuest={handleAddSuggestedQuest}
                  onCompleteQuest={handleCompleteQuest}
                onEditQuest={questId => {
                  setEditingQuestId(questId);
                  setCurrentScreen('add-quest');
                }}
                onNavigateToAddQuest={handleOpenAddQuest}
                onNavigateToProgress={handleOpenProgress}
                onNavigateToRealmCodex={handleOpenRealmCodex}
                  onRefreshAppConfig={handleRefreshAppConfig}
                  onSelectSortOption={handleSelectSortOption}
                  onToggleTheme={handleToggleTheme}
                  quests={gameState.quests}
                  selectedSortOption={gameState.sortOption}
                  styles={styles}
                  themeMode={gameState.themeMode}
                />
              ) : currentScreen === 'progress' ? (
                <ProgressScreen
                  appConfig={appConfig}
                  hero={gameState.hero}
                  onBack={() => setCurrentScreen('quest-board')}
                  onToggleTheme={handleToggleTheme}
                  quests={gameState.quests}
                  styles={styles}
                  themeMode={gameState.themeMode}
                  unlockedAchievementIds={gameState.unlockedAchievementIds}
                />
              ) : currentScreen === 'realm-codex' ? (
                realmCodex ? (
                  <RealmCodexScreen
                    isRefreshingRealmCodex={isRefreshingRealmCodex}
                    onBack={() => setCurrentScreen('quest-board')}
                    onRefresh={handleRefreshRealmCodex}
                    onToggleTheme={handleToggleTheme}
                    realmCodex={realmCodex}
                    styles={styles}
                    themeMode={gameState.themeMode}
                  />
                ) : (
                  <View style={styles.loadingState}>
                    <Text style={styles.loadingKicker}>Opening Realm Codex</Text>
                    <Text style={styles.loadingTitle}>Quest Forge</Text>
                  </View>
                )
              ) : (
                <AddQuestScreen
                  onBack={returnToBoard}
                  onDelete={handleDeleteQuest}
                  onSave={handleSaveQuest}
                  onToggleTheme={handleToggleTheme}
                  questToEdit={questToEdit}
                  styles={styles}
                  themeMode={gameState.themeMode}
                />
              )}
            </>
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function createStyles(theme: ThemePalette) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
      position: 'relative',
    },
    backgroundDecor: {
      ...StyleSheet.absoluteFillObject,
      overflow: 'hidden',
    },
    backgroundOrbPrimary: {
      backgroundColor: `${theme.blue}1f`,
      borderRadius: 220,
      height: 220,
      position: 'absolute',
      right: -56,
      top: -48,
      width: 220,
    },
    backgroundOrbSecondary: {
      backgroundColor: `${theme.amber}20`,
      borderRadius: 180,
      height: 180,
      left: -64,
      position: 'absolute',
      top: 164,
      width: 180,
    },
    backgroundOrbTertiary: {
      backgroundColor: `${theme.success}16`,
      borderRadius: 210,
      bottom: -84,
      height: 210,
      position: 'absolute',
      right: -72,
      width: 210,
    },
    contentFrame: {
      flex: 1,
      zIndex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 42,
    },
    loadingState: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    connectionStateCard: {
      backgroundColor: theme.surface,
      borderColor: theme.ghostBorder,
      borderRadius: 24,
      borderWidth: 1,
      maxWidth: 360,
      padding: 24,
      shadowColor: theme.blue,
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.16,
      shadowRadius: 28,
      width: '100%',
    },
    loadingKicker: {
      color: theme.textMuted,
      fontSize: 12,
      letterSpacing: 2,
      marginBottom: 10,
      textTransform: 'uppercase',
    },
    loadingTitle: {
      color: theme.textPrimary,
      fontSize: 30,
      fontWeight: '700',
      letterSpacing: -0.8,
    },
    connectionStateTitle: {
      color: theme.textPrimary,
      fontSize: 26,
      fontWeight: '700',
      letterSpacing: -0.6,
      marginBottom: 10,
    },
    connectionStateText: {
      color: theme.subtitle,
      fontSize: 15,
      lineHeight: 22,
    },
    topBar: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
    },
    screenHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    themeToggleButton: {
      alignItems: 'center',
      backgroundColor: `${theme.blue}18`,
      borderColor: `${theme.blue}52`,
      borderRadius: 999,
      borderWidth: 1,
      height: 44,
      justifyContent: 'center',
      shadowColor: theme.blue,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.18,
      shadowRadius: 18,
      width: 44,
    },
    themeToggleText: {
      color: theme.blueSoft,
      fontSize: 20,
      fontWeight: '800',
    },
    backButton: {
      backgroundColor: `${theme.surfaceHigh}ee`,
      borderColor: theme.ghostBorder,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    backButtonText: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '700',
    },
    screenLabel: {
      alignSelf: 'flex-start',
      backgroundColor: `${theme.blue}14`,
      borderRadius: 999,
      color: theme.blueSoft,
      fontSize: 12,
      letterSpacing: 1.4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      textTransform: 'uppercase',
    },
    kicker: {
      alignSelf: 'flex-start',
      backgroundColor: `${theme.amber}18`,
      borderRadius: 999,
      color: theme.textMuted,
      fontSize: 13,
      letterSpacing: 2,
      marginBottom: 8,
      overflow: 'hidden',
      paddingHorizontal: 12,
      paddingVertical: 6,
      textTransform: 'uppercase',
    },
    title: {
      color: theme.textPrimary,
      fontSize: 38,
      fontWeight: '700',
      letterSpacing: -1,
    },
    subtitle: {
      color: theme.subtitle,
      fontSize: 15,
      lineHeight: 22,
      marginTop: 10,
      maxWidth: 340,
    },
    heroCard: {
      backgroundColor: theme.surface,
      borderColor: `${theme.amber}32`,
      borderRadius: 24,
      borderWidth: 1,
      marginTop: 24,
      overflow: 'hidden',
      padding: 20,
      shadowColor: theme.blue,
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.18,
      shadowRadius: 30,
    },
    heroHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    heroEyebrow: {
      color: theme.textMuted,
      fontSize: 12,
      letterSpacing: 1.4,
      marginBottom: 6,
      textTransform: 'uppercase',
    },
    heroTitle: {
      color: theme.textPrimary,
      fontSize: 22,
      fontWeight: '700',
      maxWidth: 220,
    },
    heroOrb: {
      backgroundColor: theme.blue,
      borderRadius: 24,
      height: 24,
      shadowColor: theme.blue,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.42,
      shadowRadius: 16,
      width: 24,
    },
    heroStatsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 22,
    },
    heroStat: {
      backgroundColor: `${theme.surfaceHigh}f2`,
      borderRadius: 18,
      flexGrow: 1,
      flexBasis: '30%',
      borderWidth: 1,
      borderColor: theme.ghostBorder,
      paddingHorizontal: 14,
      paddingVertical: 16,
    },
    heroStatLabel: {
      color: theme.textMuted,
      fontSize: 12,
      marginBottom: 6,
      textTransform: 'uppercase',
    },
    heroStatValue: {
      color: theme.textPrimary,
      fontSize: 22,
      fontWeight: '700',
    },
    heroSupportText: {
      color: theme.subtitle,
      fontSize: 14,
      lineHeight: 21,
      marginTop: 18,
    },
    levelAccent: {
      color: theme.amberSoft,
    },
    xpAccent: {
      color: theme.blueSoft,
      fontSize: 20,
    },
    streakAccent: {
      color: theme.success,
      fontSize: 20,
    },
    boardActionCard: {
      backgroundColor: theme.surface,
      borderColor: theme.ghostBorder,
      borderRadius: 24,
      borderWidth: 1,
      marginTop: 28,
      padding: 20,
      shadowColor: theme.amber,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    },
    suggestionCard: {
      backgroundColor: theme.surfaceLow,
      borderColor: theme.ghostBorder,
      borderRadius: 20,
      borderWidth: 1,
      marginTop: 12,
      padding: 16,
      shadowColor: theme.blue,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
    },
    suggestionTitle: {
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: '700',
      lineHeight: 24,
    },
    completionBanner: {
      backgroundColor: `${theme.success}18`,
      borderColor: theme.success,
      borderRadius: 24,
      borderWidth: 1,
      marginTop: 18,
      paddingHorizontal: 18,
      paddingVertical: 16,
      shadowColor: theme.success,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.18,
      shadowRadius: 18,
    },
    completionBannerKicker: {
      color: theme.success,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1.4,
      marginBottom: 6,
      textTransform: 'uppercase',
    },
    completionBannerTitle: {
      color: theme.textPrimary,
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 6,
    },
    completionBannerText: {
      color: theme.blueSoft,
      fontSize: 14,
      fontWeight: '700',
    },
    filterCard: {
      backgroundColor: theme.surface,
      borderColor: theme.ghostBorder,
      borderRadius: 24,
      borderWidth: 1,
      marginTop: 20,
      padding: 20,
      shadowColor: theme.blue,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.1,
      shadowRadius: 22,
    },
    primaryActionButton: {
      alignItems: 'center',
      backgroundColor: theme.amber,
      borderColor: `${theme.amberSoft}80`,
      borderRadius: 18,
      borderWidth: 1,
      marginTop: 10,
      paddingHorizontal: 18,
      paddingVertical: 16,
      shadowColor: theme.amber,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.24,
      shadowRadius: 18,
    },
    primaryActionText: {
      color: theme.buttonText,
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 0.4,
    },
    secondaryActionButton: {
      alignItems: 'center',
      backgroundColor: `${theme.blue}18`,
      borderColor: `${theme.blue}45`,
      borderRadius: 18,
      borderWidth: 1,
      marginTop: 12,
      paddingHorizontal: 18,
      paddingVertical: 16,
      shadowColor: theme.blue,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    },
    secondaryActionText: {
      color: theme.blueSoft,
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    formCard: {
      backgroundColor: theme.surface,
      borderColor: theme.ghostBorder,
      borderRadius: 24,
      borderWidth: 1,
      marginTop: 28,
      padding: 20,
      shadowColor: theme.amber,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.1,
      shadowRadius: 24,
    },
    formIntro: {
      color: theme.subtitle,
      fontSize: 14,
      lineHeight: 21,
      marginBottom: 18,
      marginTop: -4,
    },
    formHint: {
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 20,
      marginTop: -4,
    },
    formField: {
      marginTop: 14,
    },
    formLabel: {
      color: theme.textMuted,
      fontSize: 12,
      letterSpacing: 1.2,
      marginBottom: 10,
      textTransform: 'uppercase',
    },
    titleInput: {
      backgroundColor: theme.surfaceLow,
      borderColor: theme.ghostBorder,
      borderRadius: 18,
      borderWidth: 1,
      color: theme.textPrimary,
      fontSize: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    themePlaceholder: {
      color: theme.placeholder,
    },
    optionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    optionChip: {
      backgroundColor: theme.surfaceLow,
      borderColor: theme.ghostBorder,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    optionChipSelected: {
      backgroundColor: `${theme.blue}1b`,
      borderColor: `${theme.blue}4d`,
    },
    optionChipText: {
      color: theme.textMuted,
      fontSize: 14,
      fontWeight: '600',
    },
    optionChipTextSelected: {
      color: theme.blueSoft,
    },
    saveButton: {
      alignItems: 'center',
      backgroundColor: theme.amber,
      borderColor: `${theme.amberSoft}80`,
      borderRadius: 18,
      borderWidth: 1,
      marginTop: 22,
      paddingHorizontal: 18,
      paddingVertical: 16,
      shadowColor: theme.amber,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.24,
      shadowRadius: 18,
    },
    saveButtonDisabled: {
      backgroundColor: theme.buttonDisabled,
      opacity: 0.55,
    },
    saveButtonText: {
      color: theme.buttonText,
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 0.4,
    },
    section: {
      marginTop: 28,
    },
    emptyStateCard: {
      backgroundColor: theme.surfaceLow,
      borderColor: theme.ghostBorder,
      borderRadius: 22,
      borderWidth: 1,
      marginTop: 28,
      padding: 18,
      shadowColor: theme.blue,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
    },
    emptyStateTitle: {
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 8,
    },
    emptyStateText: {
      color: theme.subtitle,
      fontSize: 14,
      lineHeight: 21,
    },
    sectionTitle: {
      color: theme.textPrimary,
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 14,
    },
    questCard: {
      backgroundColor: theme.surfaceLow,
      borderColor: theme.ghostBorder,
      borderRadius: 22,
      borderWidth: 1,
      marginBottom: 14,
      padding: 18,
      shadowColor: theme.blue,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
    },
    questCardCompleted: {
      backgroundColor: `${theme.success}12`,
      borderColor: `${theme.success}35`,
    },
    questHeaderRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
    },
    questTitle: {
      color: theme.textPrimary,
      flex: 1,
      fontSize: 18,
      fontWeight: '700',
      lineHeight: 24,
    },
    statusBadge: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    statusBadgeActive: {
      backgroundColor: `${theme.amber}22`,
    },
    statusBadgeDone: {
      backgroundColor: `${theme.success}20`,
    },
    statusBadgeText: {
      color: theme.amberSoft,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    statusBadgeTextDone: {
      color: theme.success,
    },
    metaRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
    metaPill: {
      backgroundColor: `${theme.surfaceHigh}f2`,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.ghostBorder,
      flex: 1,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    metaPillHighlight: {
      backgroundColor: `${theme.blue}1f`,
      borderColor: `${theme.blue}48`,
    },
    metaLabel: {
      color: theme.textMuted,
      fontSize: 11,
      marginBottom: 4,
      textTransform: 'uppercase',
    },
    metaValue: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: '600',
    },
    metaValueHighlight: {
      color: theme.blueSoft,
    },
    completeButton: {
      alignItems: 'center',
      backgroundColor: `${theme.blue}18`,
      borderColor: `${theme.blue}48`,
      borderRadius: 16,
      borderWidth: 1,
      marginTop: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    completeButtonText: {
      color: theme.blueSoft,
      fontSize: 14,
      fontWeight: '700',
    },
    cardSecondaryButton: {
      alignItems: 'center',
      backgroundColor: `${theme.surfaceHigh}ee`,
      borderColor: theme.ghostBorder,
      borderRadius: 16,
      borderWidth: 1,
      marginTop: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    cardSecondaryButtonText: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '700',
    },
    deleteButton: {
      alignItems: 'center',
      backgroundColor: theme.doneBadgeBackground,
      borderColor: theme.success,
      borderRadius: 18,
      borderWidth: 1,
      marginTop: 12,
      paddingHorizontal: 18,
      paddingVertical: 16,
    },
    deleteButtonText: {
      color: theme.success,
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
    progressGrid: {
      gap: 12,
      marginTop: 8,
    },
    progressMetricCard: {
      backgroundColor: theme.surfaceLow,
      borderColor: theme.ghostBorder,
      borderRadius: 20,
      borderWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 16,
      shadowColor: theme.amber,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
    },
    progressMetricLabel: {
      color: theme.textMuted,
      fontSize: 12,
      letterSpacing: 1,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    progressMetricValue: {
      color: theme.textPrimary,
      fontSize: 24,
      fontWeight: '700',
    },
    achievementGrid: {
      gap: 12,
      marginTop: 8,
    },
    achievementCard: {
      borderRadius: 20,
      borderWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    achievementCardUnlocked: {
      backgroundColor: theme.activeBadgeBackground,
      borderColor: theme.amber,
    },
    achievementCardLocked: {
      backgroundColor: theme.surfaceLow,
      borderColor: theme.ghostBorder,
    },
    achievementTitle: {
      fontSize: 17,
      fontWeight: '700',
      marginBottom: 6,
    },
    achievementTitleUnlocked: {
      color: theme.textPrimary,
    },
    achievementTitleLocked: {
      color: theme.textMuted,
    },
    achievementDescription: {
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 10,
    },
    achievementDescriptionUnlocked: {
      color: theme.subtitle,
    },
    achievementDescriptionLocked: {
      color: theme.placeholder,
    },
    achievementStatus: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1.1,
      textTransform: 'uppercase',
    },
    achievementStatusUnlocked: {
      color: theme.amberSoft,
    },
    achievementStatusLocked: {
      color: theme.textMuted,
    },
  });
}

export default App;













