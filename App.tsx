import React, { useEffect, useEffectEvent, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  AppState,
  type AppStateStatus,
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
  failRemoteQuest,
  fetchRemoteAppConfig,
  fetchRemoteDailySuggestions,
  fetchRemoteGameState,
  fetchRemoteQuestDetails,
  fetchRemoteQuestPool,
  fetchRemoteRealmCodex,
  fetchRemoteThemeSanctum,
  resetRemoteProgress,
  saveRemoteGameState,
  startRemoteQuest,
  updateRemoteQuest,
  updateRemoteSortOption,
  updateRemoteTheme,
  updateRemoteThemePack,
} from './src/api/gameStateApi';
import { sendQuestReminderNotification } from './src/notifications/questNotifications';

type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Epic';
type Category = 'Main Quest' | 'Side Quest';
type Status = 'Ready' | 'In Progress' | 'Completed' | 'Failed';
type ScreenName =
  | 'quest-board'
  | 'add-quest'
  | 'progress'
  | 'history'
  | 'streak'
  | 'quest-pool'
  | 'realm-codex'
  | 'theme-sanctum'
  | 'quest-details';
type RankTitle = string;
type QuestTag = string;
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
type StatusFilter = 'All' | 'Ready' | 'In Progress';
type HistoryPeriodFilter = 'Day' | 'Month' | 'Year';
type HistoryStatusFilter = 'All' | 'Completed' | 'Failed';
type ThemeMode = 'dark' | 'light';
type ThemePackId = 'ethereal-forge' | 'luminous-paladin' | 'void-drifter';

type Quest = {
  id: string;
  title: string;
  description: string;
  tag: QuestTag;
  dueDate: string | null;
  difficulty: Difficulty;
  xpReward: number;
  status: Status;
  category: Category;
  completedAt: string | null;
  failedAt: string | null;
  dueSoonReminderAt: string | null;
  overdueReminderAt: string | null;
  createdAt: number;
};

type QuestDraft = {
  title: string;
  description?: string;
  tag?: QuestTag;
  dueDate?: string | null;
  difficulty: Difficulty;
  category: Category;
};

type SuggestedQuest = QuestDraft;

type HeroProgress = {
  xp: number;
  rankTitle: RankTitle;
  streakCount: number;
  lastCompletedDate: string | null;
  activeDateKeys: string[];
};

type GameState = {
  hero: HeroProgress;
  quests: Quest[];
  themeMode: ThemeMode;
  themePackId: ThemePackId;
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
  showThemeSanctumScreen: boolean;
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
  totalFailed: number;
  activeCount: number;
  completedCount: number;
};

type DailySuggestionsResponse = {
  suggestionDateKey: string;
  suggestions: SuggestedQuest[];
};

type QuestPoolResponse = {
  kicker: string;
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  categories: string[];
  templates: SuggestedQuest[];
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

type ThemeSanctumResponse = {
  kicker: string;
  title: string;
  subtitle: string;
  activeThemeLabel: string;
  activeModeLabel: string;
  accentEnergyLabel: string;
  surfaceToneLabel: string;
  realmNotesLabel: string;
  availableEssencesTitle: string;
  availableEssencesIntro: string;
  availableThemePacks: Array<{
    id: ThemePackId;
    name: string;
    description: string;
    accentEnergy: string;
    surfaceTone: string;
    statusLabel: string;
  }>;
};

type QuestDetailsResponse = {
  kicker: string;
  title: string;
  subtitle: string;
  questId: string;
  statusLabel: Status;
  categoryLabel: Category;
  tagLabel: QuestTag;
  summaryEyebrow: string;
  summaryTitle: string;
  difficultyLabel: Difficulty;
  xpRewardLabel: string;
  ritualProgressLabel: string;
  ritualProgressPercent: number;
  progressStatusText: string;
  guidanceTitle: string;
  guidanceText: string;
  dueDateLabel: string;
  dueStateLabel: string;
  primaryActionType: 'start' | 'complete' | 'none';
  primaryActionLabel: string;
  tertiaryActionType: 'fail' | 'none';
  tertiaryActionLabel: string;
  secondaryActionLabel: string;
  canComplete: boolean;
};

type CompletionFeedback = {
  questTitle: string;
  xpGained: number;
};

type ReminderPrompt = {
  questId: string;
  title: string;
  dueLabel: string;
  dueStateLabel: string;
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

const luminousPaladinThemes: Record<ThemeMode, ThemePalette> = {
  dark: {
    background: '#181116',
    surfaceLow: '#261820',
    surface: '#32202b',
    surfaceHigh: '#432835',
    surfaceHighest: '#573547',
    textPrimary: '#fff5ef',
    textMuted: '#ffcd6d',
    amber: '#ffc145',
    amberSoft: '#ffe3a6',
    blue: '#ff7f6a',
    blueSoft: '#ffb4a8',
    success: '#87e0a2',
    ghostBorder: 'rgba(255, 180, 168, 0.16)',
    subtitle: '#d7b9c0',
    placeholder: '#a7868f',
    buttonText: '#351d00',
    buttonDisabled: '#9e7f39',
    activeBadgeBackground: 'rgba(255, 193, 69, 0.18)',
    doneBadgeBackground: 'rgba(135, 224, 162, 0.16)',
  },
  light: {
    background: '#fff4ef',
    surfaceLow: '#ffe6da',
    surface: '#fff8f3',
    surfaceHigh: '#ffd3bf',
    surfaceHighest: '#ffc1a6',
    textPrimary: '#341c14',
    textMuted: '#b3681e',
    amber: '#f5ab2f',
    amberSoft: '#ffd98e',
    blue: '#ea6b56',
    blueSoft: '#ffb39d',
    success: '#2c9f67',
    ghostBorder: 'rgba(234, 107, 86, 0.14)',
    subtitle: '#8a6657',
    placeholder: '#b38773',
    buttonText: '#341c14',
    buttonDisabled: '#d8ae75',
    activeBadgeBackground: 'rgba(245, 171, 47, 0.12)',
    doneBadgeBackground: 'rgba(44, 159, 103, 0.12)',
  },
};

const voidDrifterThemes: Record<ThemeMode, ThemePalette> = {
  dark: {
    background: '#08111f',
    surfaceLow: '#0d1d31',
    surface: '#122541',
    surfaceHigh: '#1b3458',
    surfaceHighest: '#274772',
    textPrimary: '#eefbff',
    textMuted: '#7ae7d0',
    amber: '#3fe0b5',
    amberSoft: '#9af6de',
    blue: '#57c7ff',
    blueSoft: '#aee9ff',
    success: '#8de07b',
    ghostBorder: 'rgba(87, 199, 255, 0.16)',
    subtitle: '#aac8d9',
    placeholder: '#7893a5',
    buttonText: '#03251b',
    buttonDisabled: '#4c9d84',
    activeBadgeBackground: 'rgba(63, 224, 181, 0.18)',
    doneBadgeBackground: 'rgba(141, 224, 123, 0.16)',
  },
  light: {
    background: '#ecfbff',
    surfaceLow: '#d9f5fb',
    surface: '#f5fdff',
    surfaceHigh: '#bfeff8',
    surfaceHighest: '#9de3f0',
    textPrimary: '#102433',
    textMuted: '#0c8c79',
    amber: '#22c6a0',
    amberSoft: '#7ce9d2',
    blue: '#2da9e2',
    blueSoft: '#87dcff',
    success: '#4cae5f',
    ghostBorder: 'rgba(45, 169, 226, 0.14)',
    subtitle: '#517181',
    placeholder: '#7d9aa8',
    buttonText: '#102433',
    buttonDisabled: '#7dc1b0',
    activeBadgeBackground: 'rgba(34, 198, 160, 0.12)',
    doneBadgeBackground: 'rgba(76, 174, 95, 0.12)',
  },
};

function normalizeThemePackId(themePackId: string | undefined): ThemePackId {
  if (themePackId === 'luminous-paladin' || themePackId === 'void-drifter') {
    return themePackId;
  }

  return 'ethereal-forge';
}

function getThemePalette(
  themeMode: ThemeMode,
  themePackId: ThemePackId,
): ThemePalette {
  if (themePackId === 'luminous-paladin') {
    return luminousPaladinThemes[themeMode];
  }

  if (themePackId === 'void-drifter') {
    return voidDrifterThemes[themeMode];
  }

  return themes[themeMode];
}
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
const statusFilterOptions: StatusFilter[] = ['All', 'Ready', 'In Progress'];
const historyPeriodOptions: HistoryPeriodFilter[] = ['Day', 'Month', 'Year'];
const historyStatusOptions: HistoryStatusFilter[] = [
  'All',
  'Completed',
  'Failed',
];
const questTagOptions: QuestTag[] = [
  'General',
  'Chores',
  'Work',
  'Study',
  'Health',
  'Fitness',
  'Errands',
  'Home',
  'Focus',
  'Planning',
  'Creative',
  'Finance',
  'Social',
  'Admin',
  'Self Care',
];
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
    boardHeroInsight: 'Your next rank is earned one quest at a time.',
    realmSyncMessage: 'Sync the board to refresh today’s realm updates.',
    suggestionSectionTitle: 'Daily Suggestions',
    addQuestSectionTitle: 'Guild Hub',
    filterSectionTitle: 'Search And Filter',
    mainQuestSectionTitle: 'Main Quest',
    sideQuestSectionTitle: 'Side Quests',
    completedQuestSectionTitle: 'Completed Quests',
    questSectionOrder: defaultQuestSectionOrder,
    progressKicker: 'Profile',
    progressTitle: 'Hero Summary',
    progressSubtitle:
      'See how your quests, streaks, and ranks are shaping your legend.',
    progressHeroEyebrow: 'Current Progress',
    progressSectionTitle: 'Quest Progress',
    progressSectionIntro:
      'Review your totals, streaks, and milestones in one place.',
    achievementSectionTitle: 'Achievements',
    achievementSectionIntro: 'Badges unlock as your legend grows.',
    featureFlags: {
      showRealmSyncCard: true,
      showSuggestionSection: true,
      showFilterSection: true,
      showAchievementSection: true,
      showAddQuestScreen: true,
      showProgressScreen: true,
      showRealmCodexScreen: true,
      showThemeSanctumScreen: true,
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
    description:
      'Clear the laundry pile, sort the essentials, and leave the guild hall ready for the next work cycle.',
    tag: 'Chores',
    dueDate: null,
    difficulty: 'Epic',
    xpReward: 50,
    status: 'In Progress',
    category: 'Main Quest',
    completedAt: null,
    failedAt: null,
    dueSoonReminderAt: null,
    overdueReminderAt: null,
    createdAt: 1,
  },
  {
    id: 'quest-2',
    title: 'Brew a Focus Potion',
    description:
      'Prepare your desk, water, and playlist so the next study session begins with less resistance.',
    tag: 'Study',
    dueDate: null,
    difficulty: 'Medium',
    xpReward: 20,
    status: 'Ready',
    category: 'Side Quest',
    completedAt: null,
    failedAt: null,
    dueSoonReminderAt: null,
    overdueReminderAt: null,
    createdAt: 2,
  },
  {
    id: 'quest-3',
    title: 'Sharpen the Study Blade',
    description:
      'Review one core topic and write down the sharpest insight before you close the session.',
    tag: 'Study',
    dueDate: null,
    difficulty: 'Easy',
    xpReward: 10,
    status: 'Completed',
    category: 'Side Quest',
    completedAt: getDateKey(),
    failedAt: null,
    dueSoonReminderAt: null,
    overdueReminderAt: null,
    createdAt: 3,
  },
];

const suggestionTemplates: SuggestedQuest[] = [
  {
    title: 'Refill the Mana Flask',
    description:
      'Refill your water bottle and reset your desk before the next focus session begins.',
    tag: 'Health',
    difficulty: 'Easy',
    category: 'Side Quest',
    dueDate: null,
  },
  {
    title: 'Map the Day Ahead',
    description:
      'Sketch the top priorities for today so the main quest line stays clear.',
    tag: 'Planning',
    difficulty: 'Easy',
    category: 'Main Quest',
    dueDate: null,
  },
  {
    title: 'Train the Focus Familiar',
    description:
      'Silence distractions and prepare one clean work block with a single outcome.',
    tag: 'Focus',
    difficulty: 'Medium',
    category: 'Side Quest',
    dueDate: null,
  },
  {
    title: 'Polish the Guild Resume',
    description:
      'Improve one practical part of your portfolio, CV, or professional profile.',
    tag: 'Work',
    difficulty: 'Medium',
    category: 'Main Quest',
    dueDate: null,
  },
  {
    title: 'Clear the Inbox Cavern',
    description:
      'Answer or archive the messages that keep pulling your attention away.',
    tag: 'Admin',
    difficulty: 'Hard',
    category: 'Main Quest',
    dueDate: null,
  },
  {
    title: 'Raid the Laundry Keep',
    description:
      'Wash, dry, and fold one full load before the pile grows stronger.',
    tag: 'Chores',
    difficulty: 'Hard',
    category: 'Side Quest',
    dueDate: null,
  },
  {
    title: 'Forge a Weekly Master Plan',
    description:
      'Lay out your week with deadlines, recovery time, and one stretch goal.',
    tag: 'Planning',
    difficulty: 'Epic',
    category: 'Main Quest',
    dueDate: null,
  },
  {
    title: 'Protect the Evening Wind-Down',
    description:
      'Create a calm finish to the day so tomorrow begins with more energy.',
    tag: 'Self Care',
    difficulty: 'Easy',
    category: 'Side Quest',
    dueDate: null,
  },
  {
    title: 'Restore the Study Desk',
    description:
      'Reset your workspace so the next session starts clean and focused.',
    tag: 'Study',
    difficulty: 'Easy',
    category: 'Side Quest',
    dueDate: null,
  },
  {
    title: 'Collect the Expense Receipts',
    description:
      'Gather the finance trail before admin tasks become a bigger boss fight.',
    tag: 'Finance',
    difficulty: 'Medium',
    category: 'Side Quest',
    dueDate: null,
  },
  {
    title: 'Deliver the Guild Check-In',
    description:
      'Send the update your teammate, client, or manager is waiting on.',
    tag: 'Work',
    difficulty: 'Medium',
    category: 'Main Quest',
    dueDate: null,
  },
  {
    title: 'Lift the Iron Sigils',
    description:
      'Complete a short workout or movement ritual to keep momentum alive.',
    tag: 'Fitness',
    difficulty: 'Hard',
    category: 'Side Quest',
    dueDate: null,
  },
  {
    title: 'Prepare the Market Run',
    description:
      'Handle the errands that unblock the rest of the week.',
    tag: 'Errands',
    difficulty: 'Medium',
    category: 'Side Quest',
    dueDate: null,
  },
  {
    title: 'Shape a Creative Relic',
    description:
      'Make visible progress on a design, sketch, draft, or passion project.',
    tag: 'Creative',
    difficulty: 'Hard',
    category: 'Main Quest',
    dueDate: null,
  },
  {
    title: 'Sprint Through the Study Trial',
    description:
      'Give yourself one intense study burst and close the loop before the window slips away.',
    tag: 'Study',
    difficulty: 'Medium',
    category: 'Side Quest',
    dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    title: 'Ship the Guild Update',
    description:
      'Finish the work update while the context is still hot and send it before the timer runs out.',
    tag: 'Work',
    difficulty: 'Hard',
    category: 'Main Quest',
    dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
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
  { minimumXp: 2100, title: 'Ascendant' },
  { minimumXp: 1560, title: 'Mythic' },
  { minimumXp: 1160, title: 'Legend' },
  { minimumXp: 820, title: 'Warden' },
  { minimumXp: 540, title: 'Champion' },
  { minimumXp: 320, title: 'Knight' },
  { minimumXp: 150, title: 'Adventurer' },
  { minimumXp: 60, title: 'Apprentice' },
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
  const rankIndex = rankThresholds.findIndex(threshold => xp >= threshold.minimumXp);
  const normalizedRankIndex =
    rankIndex === -1 ? rankThresholds.length - 1 : rankThresholds.length - rankIndex;

  return `${normalizedRankIndex}`.padStart(2, '0');
}

function getRankProgress(xp: number) {
  const orderedThresholds = [...rankThresholds].sort(
    (leftRank, rightRank) => leftRank.minimumXp - rightRank.minimumXp,
  );
  const currentRank =
    [...orderedThresholds]
      .reverse()
      .find(rankThreshold => xp >= rankThreshold.minimumXp) ??
    orderedThresholds[0];
  const currentRankIndex = orderedThresholds.findIndex(
    rankThreshold => rankThreshold.title === currentRank.title,
  );
  const nextRank = orderedThresholds[currentRankIndex + 1] ?? null;

  if (!nextRank) {
    return {
      currentRankTitle: currentRank.title,
      nextRankTitle: currentRank.title,
      progressPercent: 100,
      progressText: 'You have reached the highest known rank.',
    };
  }

  const span = nextRank.minimumXp - currentRank.minimumXp;
  const progressPercent = Math.min(
    100,
    Math.max(0, ((xp - currentRank.minimumXp) / span) * 100),
  );
  const xpRemaining = Math.max(0, nextRank.minimumXp - xp);

  return {
    currentRankTitle: currentRank.title,
    nextRankTitle: nextRank.title,
    progressPercent,
    progressText: `${xpRemaining} XP to ${nextRank.title}`,
  };
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

function normalizeDueDate(dueDate: string | null | undefined) {
  if (typeof dueDate !== 'string') {
    return null;
  }

  const trimmedDueDate = dueDate.trim();

  if (parseDateKey(trimmedDueDate)) {
    return trimmedDueDate;
  }

  const parsedDueMoment = new Date(trimmedDueDate);

  return Number.isNaN(parsedDueMoment.getTime())
    ? null
    : parsedDueMoment.toISOString();
}

function normalizeResolvedDate(resolvedDate: string | null | undefined) {
  return normalizeDueDate(resolvedDate);
}

function parseDueMoment(dueDate: string | null | undefined) {
  const normalizedDueDate = normalizeDueDate(dueDate);

  if (!normalizedDueDate) {
    return null;
  }

  if (parseDateKey(normalizedDueDate)) {
    return {
      isDateOnly: true,
      date: parseDateKey(normalizedDueDate) as Date,
      value: normalizedDueDate,
    };
  }

  return {
    isDateOnly: false,
    date: new Date(normalizedDueDate),
    value: normalizedDueDate,
  };
}

function formatDueDateLabel(dueDate: string | null | undefined) {
  const dueMoment = parseDueMoment(dueDate);

  if (!dueMoment) {
    return 'No due date';
  }

  if (dueMoment.isDateOnly) {
    return dueMoment.value;
  }

  return dueMoment.date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getQuestDueStateLabel(
  quest: Pick<Quest, 'status' | 'dueDate'>,
  todayKey = getDateKey(),
) {
  const dueMoment = parseDueMoment(quest.dueDate);

  if (!dueMoment) {
    return 'Flexible';
  }

  if (quest.status === 'Completed') {
    return 'Completed';
  }

  if (quest.status === 'Failed') {
    return 'Failed';
  }

  if (dueMoment.isDateOnly) {
    const dateDifference = getDateDifferenceInDays(todayKey, dueMoment.value);

    if (dateDifference === null) {
      return 'Flexible';
    }

    if (dateDifference < 0) {
      return 'Overdue';
    }

    if (dateDifference === 0) {
      return 'Due Today';
    }

    return 'Upcoming';
  }

  const dueTimeDifferenceMs = dueMoment.date.getTime() - Date.now();

  if (dueTimeDifferenceMs < 0) {
    return 'Overdue';
  }

  if (dueTimeDifferenceMs <= 2 * 60 * 60 * 1000) {
    return 'Due Soon';
  }

  if (getDateKey(dueMoment.date) === todayKey) {
    return 'Due Today';
  }

  return 'Upcoming';
}

function getQuestDueDetails(quest: Pick<Quest, 'status' | 'dueDate'>) {
  const dueStateLabel = getQuestDueStateLabel(quest);

  return {
    dueDateLabel: formatDueDateLabel(quest.dueDate),
    dueStateLabel,
    isUrgent:
      dueStateLabel === 'Due Soon' ||
      dueStateLabel === 'Due Today' ||
      dueStateLabel === 'Overdue',
    isOverdue: dueStateLabel === 'Overdue',
    isDueSoon: dueStateLabel === 'Due Soon',
  };
}

function shouldSendDueSoonReminder(quest: Quest) {
  const dueDetails = getQuestDueDetails(quest);

  return (
    quest.status === 'In Progress' &&
    quest.dueDate !== null &&
    dueDetails.isDueSoon &&
    quest.dueSoonReminderAt !== quest.dueDate
  );
}

function shouldSendOverdueReminder(quest: Quest) {
  const dueDetails = getQuestDueDetails(quest);

  return (
    quest.status === 'In Progress' &&
    quest.dueDate !== null &&
    dueDetails.isOverdue &&
    quest.overdueReminderAt !== quest.dueDate
  );
}

function getQuestResolvedDate(quest: Pick<Quest, 'status' | 'completedAt' | 'failedAt'>) {
  if (quest.status === 'Completed') {
    return normalizeResolvedDate(quest.completedAt);
  }

  if (quest.status === 'Failed') {
    return normalizeResolvedDate(quest.failedAt);
  }

  return null;
}

function normalizeActiveDateKeys(activeDateKeys: string[] | null | undefined) {
  if (!Array.isArray(activeDateKeys)) {
    return [];
  }

  return Array.from(
    new Set(
      activeDateKeys
        .map(activeDateKey => normalizeResolvedDate(activeDateKey))
        .filter((activeDateKey): activeDateKey is string => activeDateKey !== null),
    ),
  ).sort();
}

function getBestStreak(activeDateKeys: string[]) {
  if (activeDateKeys.length === 0) {
    return 0;
  }

  let bestStreak = 1;
  let currentStreak = 1;

  for (let index = 1; index < activeDateKeys.length; index += 1) {
    const previousDateKey = activeDateKeys[index - 1];
    const currentDateKey = activeDateKeys[index];
    const dateDifference = getDateDifferenceInDays(previousDateKey, currentDateKey);

    if (dateDifference === 1) {
      currentStreak += 1;
      bestStreak = Math.max(bestStreak, currentStreak);
      continue;
    }

    currentStreak = 1;
  }

  return bestStreak;
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
  activeDateKeys: string[] = [],
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
    activeDateKeys: normalizeActiveDateKeys(activeDateKeys),
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
  const normalizedStatus: Status =
    quest.status === 'Completed' ||
    quest.status === 'In Progress' ||
    quest.status === 'Failed'
      ? quest.status
      : 'Ready';
  const completedAt =
    normalizedStatus === 'Completed'
      ? normalizeResolvedDate(quest.completedAt) ?? getDateKey()
      : null;
  const failedAt =
    normalizedStatus === 'Failed'
      ? normalizeResolvedDate(quest.failedAt) ?? getDateKey()
      : null;

  return {
    ...quest,
    id: quest.id ?? createQuestId(),
    description:
      typeof quest.description === 'string' ? quest.description.trim() : '',
    tag:
      typeof quest.tag === 'string' && quest.tag.trim().length > 0
        ? quest.tag.trim()
        : 'General',
    dueDate: normalizeDueDate(quest.dueDate),
    status: normalizedStatus,
    completedAt,
    failedAt,
    dueSoonReminderAt:
      typeof quest.dueSoonReminderAt === 'string' &&
      quest.dueSoonReminderAt.trim().length > 0
        ? quest.dueSoonReminderAt.trim()
        : null,
    overdueReminderAt:
      typeof quest.overdueReminderAt === 'string' &&
      quest.overdueReminderAt.trim().length > 0
        ? quest.overdueReminderAt.trim()
        : null,
    createdAt: typeof quest.createdAt === 'number' ? quest.createdAt : Date.now(),
    xpReward,
  };
}

function createInitialGameState(): GameState {
  const normalizedQuests = initialQuests.map(normalizeQuest);
  const hero = createHeroProgress(
    calculateCompletedQuestXp(normalizedQuests),
    0,
    null,
    normalizedQuests
      .map(quest => getQuestResolvedDate(quest))
      .filter((activeDateKey): activeDateKey is string => activeDateKey !== null),
  );

  return {
    hero,
    quests: normalizedQuests,
    themeMode: 'dark',
    themePackId: 'ethereal-forge',
    sortOption: 'Newest first',
    unlockedAchievementIds: getUnlockedAchievementIds({
      hero,
      quests: normalizedQuests,
    }),
  };
}

function migrateLegacyQuests(quests: Quest[]): GameState {
  const normalizedQuests = quests.map(normalizeQuest);
  const hero = createHeroProgress(
    calculateCompletedQuestXp(normalizedQuests),
    0,
    null,
    normalizedQuests
      .map(quest => getQuestResolvedDate(quest))
      .filter((activeDateKey): activeDateKey is string => activeDateKey !== null),
  );

  return {
    hero,
    quests: normalizedQuests,
    themeMode: 'dark',
    themePackId: 'ethereal-forge',
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
    state.hero?.activeDateKeys ??
      normalizedQuests
        .map(quest => getQuestResolvedDate(quest))
        .filter((activeDateKey): activeDateKey is string => activeDateKey !== null),
  );

  return {
    hero,
    quests: normalizedQuests,
    themeMode: state.themeMode === 'light' ? 'light' : 'dark',
    themePackId: normalizeThemePackId((state as GameState & { themePackId?: string }).themePackId),
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
      showThemeSanctumScreen:
        typeof config?.featureFlags?.showThemeSanctumScreen === 'boolean'
          ? config.featureFlags.showThemeSanctumScreen
          : fallbackConfig.featureFlags.showThemeSanctumScreen,
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

  if (screenName === 'theme-sanctum') {
    return appConfig.featureFlags.showThemeSanctumScreen;
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
    quest.title.toLowerCase().includes(normalizedQuery) ||
    quest.description.toLowerCase().includes(normalizedQuery) ||
    quest.tag.toLowerCase().includes(normalizedQuery);
  const matchesDifficulty =
    selectedDifficultyFilter === 'All' ||
    quest.difficulty === selectedDifficultyFilter;
  const matchesCategory =
    selectedCategoryFilter === 'All' || quest.category === selectedCategoryFilter;
  const matchesStatus =
    selectedStatusFilter === 'All' ||
    quest.status === selectedStatusFilter;

  return matchesSearch && matchesDifficulty && matchesCategory && matchesStatus;
}

function getProgressStats(quests: Quest[]): ProgressStats {
  const totalCompleted = quests.filter(quest => quest.status === 'Completed').length;
  const totalFailed = quests.filter(quest => quest.status === 'Failed').length;
  const activeCount = quests.filter(
    quest => quest.status === 'Ready' || quest.status === 'In Progress',
  ).length;

  return {
    totalCreated: quests.length,
    totalCompleted,
    totalFailed,
    activeCount,
    completedCount: totalCompleted,
  };
}

function getQuestPrimaryActionLabel(status: Status) {
  if (status === 'Completed' || status === 'Failed') {
    return 'Ritual Complete';
  }

  if (status === 'In Progress') {
    return 'Mark Completed';
  }

  return 'Start Quest';
}

function matchesHistoryPeriod(
  resolvedDate: string | null,
  historyPeriodFilter: HistoryPeriodFilter,
  todayKey = getDateKey(),
) {
  if (!resolvedDate) {
    return false;
  }

  const todayDate = parseDateKey(todayKey);
  const resolvedDay = parseDateKey(resolvedDate);

  if (!todayDate || !resolvedDay) {
    return false;
  }

  if (historyPeriodFilter === 'Day') {
    return resolvedDate === todayKey;
  }

  if (historyPeriodFilter === 'Month') {
    return (
      resolvedDay.getFullYear() === todayDate.getFullYear() &&
      resolvedDay.getMonth() === todayDate.getMonth()
    );
  }

  return resolvedDay.getFullYear() === todayDate.getFullYear();
}

function getFavoriteTag(quests: Quest[]) {
  const tagCounts = quests.reduce<Record<string, number>>((counts, quest) => {
    counts[quest.tag] = (counts[quest.tag] ?? 0) + 1;

    return counts;
  }, {});
  const [favoriteTag] = Object.entries(tagCounts).sort((leftEntry, rightEntry) => {
    if (rightEntry[1] !== leftEntry[1]) {
      return rightEntry[1] - leftEntry[1];
    }

    return leftEntry[0].localeCompare(rightEntry[0]);
  })[0] ?? ['General', 0];

  return favoriteTag;
}

function sortHistoryQuests(quests: Quest[]) {
  return [...quests].sort((leftQuest, rightQuest) => {
    const leftResolvedDate = getQuestResolvedDate(leftQuest) ?? '';
    const rightResolvedDate = getQuestResolvedDate(rightQuest) ?? '';

    if (leftResolvedDate !== rightResolvedDate) {
      return rightResolvedDate.localeCompare(leftResolvedDate);
    }

    return rightQuest.createdAt - leftQuest.createdAt;
  });
}

function buildCalendarDays(
  activeDateKeys: string[],
  referenceDate = new Date(),
) {
  const year = referenceDate.getFullYear();
  const monthIndex = referenceDate.getMonth();
  const firstOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leadingEmptyDays = firstOfMonth.getDay();
  const activeDateSet = new Set(activeDateKeys);
  const todayKey = getDateKey(referenceDate);
  const calendarDays: Array<
    | null
    | {
        dayNumber: number;
        dateKey: string;
        isActive: boolean;
        isToday: boolean;
      }
  > = [];

  for (let index = 0; index < leadingEmptyDays; index += 1) {
    calendarDays.push(null);
  }

  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber += 1) {
    const dateKey = getDateKey(new Date(year, monthIndex, dayNumber));

    calendarDays.push({
      dayNumber,
      dateKey,
      isActive: activeDateSet.has(dateKey),
      isToday: dateKey === todayKey,
    });
  }

  return calendarDays;
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
  onPress,
  testID,
}: {
  label: string;
  value: string;
  accentStyle?: object;
  styles: ReturnType<typeof createStyles>;
  onPress?: () => void;
  testID?: string;
}) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={[styles.heroStat, styles.heroStatInteractive]}
        testID={testID}>
        <Text style={styles.heroStatLabel}>{label}</Text>
        <Text style={[styles.heroStatValue, accentStyle]}>{value}</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.heroStat} testID={testID}>
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

function ReminderPromptOverlay({
  reminderPrompt,
  onComplete,
  onDismiss,
  onViewQuest,
  styles,
}: {
  reminderPrompt: ReminderPrompt;
  onComplete: (questId: string) => void;
  onDismiss: () => void;
  onViewQuest: (questId: string) => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.reminderOverlay} testID="quest-reminder-overlay">
      <Pressable onPress={onDismiss} style={styles.reminderOverlayBackdrop} />
      <View style={styles.reminderCard}>
        <Text style={styles.kicker}>Quest Reminder</Text>
        <Text style={styles.sectionTitle}>{reminderPrompt.title}</Text>
        <Text style={styles.formIntro}>
          This quest is now {reminderPrompt.dueStateLabel.toLowerCase()}.
          {` `}Did you complete it?
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <Text style={styles.metaLabel}>Deadline</Text>
            <Text style={styles.metaValue}>{reminderPrompt.dueLabel}</Text>
          </View>
          <View style={[styles.metaPill, styles.metaPillHighlight]}>
            <Text style={styles.metaLabel}>Status Check</Text>
            <Text style={[styles.metaValue, styles.metaValueHighlight]}>
              {reminderPrompt.dueStateLabel}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => onComplete(reminderPrompt.questId)}
          style={styles.primaryActionButton}
          testID="reminder-complete-quest">
          <Text style={styles.primaryActionText}>Mark Complete</Text>
        </Pressable>
        <Pressable
          onPress={() => onViewQuest(reminderPrompt.questId)}
          style={styles.secondaryActionButton}
          testID="reminder-view-quest">
          <Text style={styles.secondaryActionText}>View Quest</Text>
        </Pressable>
        <Pressable
          onPress={onDismiss}
          style={styles.cardSecondaryButton}
          testID="reminder-dismiss-quest">
          <Text style={styles.cardSecondaryButtonText}>Still Working</Text>
        </Pressable>
      </View>
    </View>
  );
}

function QuestCard({
  quest,
  isExpanded,
  styles,
  onPrimaryAction,
  onEdit,
  onOpenDetails,
  onToggleExpand,
}: {
  quest: Quest;
  isExpanded: boolean;
  styles: ReturnType<typeof createStyles>;
  onPrimaryAction?: (questId: string) => void;
  onEdit?: (questId: string) => void;
  onOpenDetails?: (questId: string) => void;
  onToggleExpand?: (questId: string) => void;
}) {
  const isResolved =
    quest.status === 'Completed' || quest.status === 'Failed';
  const dueDetails = getQuestDueDetails(quest);

  return (
    <Pressable
      onPress={onOpenDetails ? () => onOpenDetails(quest.id) : undefined}
      style={[
        styles.questCard,
        isResolved && styles.questCardCompleted,
        dueDetails.isDueSoon && styles.questCardDueSoon,
        dueDetails.isOverdue && styles.questCardOverdue,
      ]}
      testID={`open-quest-details-${quest.id}`}>
      <View style={styles.questHeaderRow}>
        <Text style={styles.questTitle}>{quest.title}</Text>
        <View style={styles.questHeaderActions}>
          <View
            style={[
              styles.statusBadge,
              isResolved ? styles.statusBadgeDone : styles.statusBadgeActive,
            ]}>
            <Text
              style={[
                styles.statusBadgeText,
                isResolved && styles.statusBadgeTextDone,
              ]}>
              {quest.status}
            </Text>
          </View>
          {onToggleExpand ? (
            <Pressable
              onPress={event => {
                event.stopPropagation();
                onToggleExpand(quest.id);
              }}
              style={styles.expandChevronButton}
              testID={`toggle-quest-expand-${quest.id}`}>
              <Text style={styles.expandChevronIcon}>
                {isExpanded ? '▴' : '▾'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaPill}>
          <Text style={styles.metaLabel}>Due Date</Text>
          <Text style={styles.metaValue}>{dueDetails.dueDateLabel}</Text>
        </View>
        <View
          style={[
            styles.metaPill,
            dueDetails.isUrgent ? styles.metaPillHighlight : null,
          ]}>
          <Text style={styles.metaLabel}>Timeline</Text>
          <Text
            style={[
              styles.metaValue,
              dueDetails.isUrgent ? styles.metaValueHighlight : null,
            ]}>
            {dueDetails.dueStateLabel}
          </Text>
        </View>
        <View style={styles.metaPill}>
          <Text style={styles.metaLabel}>Difficulty</Text>
          <Text style={styles.metaValue}>{quest.difficulty}</Text>
        </View>
      </View>

      {isExpanded ? (
        <>
          <Text style={styles.questDescription}>
            {quest.description || 'No quest note recorded yet.'}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Text style={styles.metaLabel}>Tag</Text>
              <Text style={styles.metaValue}>{quest.tag}</Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaLabel}>Quest Path</Text>
              <Text style={styles.metaValue}>{quest.category}</Text>
            </View>
            <View style={[styles.metaPill, styles.metaPillHighlight]}>
              <Text style={styles.metaLabel}>XP Reward</Text>
              <Text style={[styles.metaValue, styles.metaValueHighlight]}>
                +{quest.xpReward}
              </Text>
            </View>
          </View>

          {!isResolved && onPrimaryAction ? (
            <Pressable
              onPress={event => {
                event.stopPropagation();
                onPrimaryAction(quest.id);
              }}
              style={styles.completeButton}
              testID={`complete-quest-${quest.id}`}>
              <Text style={styles.completeButtonText}>
                {getQuestPrimaryActionLabel(quest.status)}
              </Text>
            </Pressable>
          ) : null}

          {onEdit ? (
            <Pressable
              onPress={event => {
                event.stopPropagation();
                onEdit(quest.id);
              }}
              style={styles.cardSecondaryButton}
              testID={`edit-quest-${quest.id}`}>
              <Text style={styles.cardSecondaryButtonText}>Edit Quest</Text>
            </Pressable>
          ) : null}
        </>
      ) : (
        <Text style={styles.questCardHint}>Tap for details. Expand for actions.</Text>
      )}
    </Pressable>
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
  onPrimaryQuestAction,
  onEditQuest,
  onOpenQuestDetails,
  onNavigateToAddQuest,
  onNavigateToHistory,
  onNavigateToProgress,
  onNavigateToQuestPool,
  onNavigateToStreak,
  onNavigateToRealmCodex,
  onNavigateToThemeSanctum,
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
  onPrimaryQuestAction: (questId: string) => void;
  onEditQuest: (questId: string) => void;
  onOpenQuestDetails: (questId: string) => void;
  onNavigateToAddQuest: () => void;
  onNavigateToHistory: () => void;
  onNavigateToProgress: () => void;
  onNavigateToQuestPool: () => void;
  onNavigateToStreak: () => void;
  onNavigateToRealmCodex: () => void;
  onNavigateToThemeSanctum: () => void;
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
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [expandedQuestIds, setExpandedQuestIds] = useState<string[]>([]);
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const feedbackTranslateY = useRef(new Animated.Value(-12)).current;
  const rankProgress = getRankProgress(hero.xp);

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
    quests.filter(
      quest =>
        (quest.status === 'Ready' || quest.status === 'In Progress') &&
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

  const mainQuests = visibleQuests.filter(quest => quest.category === 'Main Quest');
  const sideQuests = visibleQuests.filter(quest => quest.category === 'Side Quest');
  const hasVisibleQuests = visibleQuests.length > 0;

  useEffect(() => {
    const visibleQuestIds = new Set(visibleQuests.map(quest => quest.id));

    setExpandedQuestIds(currentExpandedQuestIds => {
      const nextExpandedQuestIds = currentExpandedQuestIds.filter(questId =>
        visibleQuestIds.has(questId),
      );

      return nextExpandedQuestIds.length === currentExpandedQuestIds.length &&
        nextExpandedQuestIds.every(
          (questId, index) => questId === currentExpandedQuestIds[index],
        )
        ? currentExpandedQuestIds
        : nextExpandedQuestIds;
    });
  }, [visibleQuests]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDifficultyFilter('All');
    setSelectedCategoryFilter('All');
    setSelectedStatusFilter('All');
    onSelectSortOption('Newest first');
  };

  const handleToggleQuestExpand = (questId: string) => {
    setExpandedQuestIds(currentExpandedQuestIds =>
      currentExpandedQuestIds.includes(questId)
        ? currentExpandedQuestIds.filter(currentQuestId => currentQuestId !== questId)
        : [...currentExpandedQuestIds, questId],
    );
  };
  const questSections = appConfig.questSectionOrder
    .filter(sectionKey => sectionKey !== 'completed')
    .map(sectionKey => {
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
      key: 'side',
      title: appConfig.sideQuestSectionTitle,
      quests: sideQuests,
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
        <View style={styles.topBarActions}>
          <Pressable
            onPress={onRefreshAppConfig}
            style={styles.iconUtilityButton}
            testID="refresh-app-config">
            <Text style={styles.iconUtilityButtonText}>
              {isRefreshingAppConfig ? '...' : 'Sync'}
            </Text>
          </Pressable>
          <ThemeToggle
            onToggleTheme={onToggleTheme}
            styles={styles}
            themeMode={themeMode}
          />
        </View>
      </View>

      <Text style={styles.subtitle}>{appConfig.boardSubtitle}</Text>

      <View style={styles.heroCard}>
        <Pressable
          onPress={onNavigateToProgress}
          style={styles.heroOverviewPressable}
          testID="hero-overview-button">
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroEyebrow}>{appConfig.heroEyebrow}</Text>
              <Text style={styles.heroTitle}>
                {appConfig.boardHeroTitlePrefix}: {hero.rankTitle}
              </Text>
            </View>
            <View style={styles.heroOrb} />
          </View>

          <Text style={styles.heroTapHint}>Tap hero overview for profile</Text>
        </Pressable>

        <View style={styles.heroStatsRow}>
          <HeroStat
            accentStyle={styles.levelAccent}
            label="Level"
            onPress={onNavigateToProgress}
            styles={styles}
            testID="hero-level-button"
            value={getLevelForXp(hero.xp)}
          />
          <HeroStat
            accentStyle={styles.xpAccent}
            label="XP"
            onPress={onNavigateToProgress}
            styles={styles}
            testID="hero-xp-button"
            value={`${hero.xp}`}
          />
          <HeroStat
            accentStyle={styles.streakAccent}
            label="Streak"
            onPress={onNavigateToStreak}
            styles={styles}
            testID="hero-streak-button"
            value={`${hero.streakCount}d`}
          />
        </View>

        <Pressable
          onPress={onNavigateToProgress}
          style={styles.heroOverviewPressable}
          testID="hero-rank-progress-button">
          <View style={styles.detailsProgressSection}>
            <View style={styles.detailsProgressHeader}>
              <Text style={styles.formLabel}>Rank Progress</Text>
              <Text style={styles.detailsProgressValue}>
                {Math.round(rankProgress.progressPercent)}%
              </Text>
            </View>
            <View style={styles.detailsProgressTrack}>
              <View
                style={[
                  styles.detailsProgressFill,
                  { width: `${rankProgress.progressPercent}%` },
                ]}
              />
            </View>
          </View>
          <Text style={styles.heroSupportText}>{rankProgress.progressText}</Text>
        </Pressable>
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

      {appConfig.featureFlags.showSuggestionSection ? (
        <View style={styles.boardActionCard}>
          <Text style={styles.sectionTitle}>{appConfig.suggestionSectionTitle}</Text>
          <Text style={styles.formIntro}>
            Fresh quest ideas picked for today&apos;s momentum.
          </Text>
          <Text style={styles.formHint}>Forged for {dailySuggestionDateKey}</Text>

          {dailySuggestions.length > 0 ? (
            dailySuggestions.map((suggestion, index) => (
              (() => {
                const suggestionDueDetails = getQuestDueDetails({
                  status: 'Ready',
                  dueDate: suggestion.dueDate ?? null,
                });

                return (
                  <View
                    key={`${suggestion.title}-${index}`}
                    style={styles.suggestionCard}
                    testID={`daily-suggestion-card-${index}`}>
                    <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                    <Text style={styles.questDescription}>{suggestion.description}</Text>
                    <View style={styles.metaRow}>
                      <View style={styles.metaPill}>
                        <Text style={styles.metaLabel}>Difficulty</Text>
                        <Text style={styles.metaValue}>{suggestion.difficulty}</Text>
                      </View>
                      <View style={styles.metaPill}>
                        <Text style={styles.metaLabel}>Category</Text>
                        <Text style={styles.metaValue}>{suggestion.category}</Text>
                      </View>
                      <View style={styles.metaPill}>
                        <Text style={styles.metaLabel}>Tag</Text>
                        <Text style={styles.metaValue}>{suggestion.tag}</Text>
                      </View>
                    </View>
                    {suggestion.dueDate ? (
                      <View style={styles.metaRow}>
                        <View style={styles.metaPill}>
                          <Text style={styles.metaLabel}>Deadline</Text>
                          <Text style={styles.metaValue}>
                            {suggestionDueDetails.dueDateLabel}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.metaPill,
                            suggestionDueDetails.isUrgent
                              ? styles.metaPillHighlight
                              : null,
                          ]}>
                          <Text style={styles.metaLabel}>Reminder</Text>
                          <Text
                            style={[
                              styles.metaValue,
                              suggestionDueDetails.isUrgent
                                ? styles.metaValueHighlight
                                : null,
                            ]}>
                            {suggestionDueDetails.dueStateLabel}
                          </Text>
                        </View>
                      </View>
                    ) : null}
                    <Pressable
                      onPress={() => onAddSuggestedQuest(suggestion)}
                      style={styles.cardSecondaryButton}
                      testID={`add-suggested-quest-${index}`}>
                      <Text style={styles.cardSecondaryButtonText}>
                        Add Suggested Quest
                      </Text>
                    </Pressable>
                  </View>
                );
              })()
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
            Shape your next quest, check your profile, or review quest history.
          </Text>
        {appConfig.featureFlags.showAddQuestScreen ? (
          <Pressable
            onPress={onNavigateToAddQuest}
            style={styles.primaryActionButton}
            testID="navigate-to-add-quest">
            <Text style={styles.primaryActionText}>Quest Forge</Text>
          </Pressable>
        ) : null}
        {appConfig.featureFlags.showProgressScreen ? (
          <Pressable
            onPress={onNavigateToProgress}
            style={styles.secondaryActionButton}
            testID="navigate-to-progress-screen">
            <Text style={styles.secondaryActionText}>Profile</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={onNavigateToQuestPool}
          style={styles.secondaryActionButton}
          testID="navigate-to-quest-pool-screen">
          <Text style={styles.secondaryActionText}>Quest Pool</Text>
        </Pressable>
        <Pressable
          onPress={onNavigateToHistory}
          style={styles.secondaryActionButton}
          testID="navigate-to-history-screen">
          <Text style={styles.secondaryActionText}>History</Text>
        </Pressable>
        {appConfig.featureFlags.showRealmCodexScreen ? (
          <Pressable
            onPress={onNavigateToRealmCodex}
            style={styles.secondaryActionButton}
            testID="navigate-to-realm-codex">
            <Text style={styles.secondaryActionText}>Realm Codex</Text>
          </Pressable>
        ) : null}
        {appConfig.featureFlags.showThemeSanctumScreen ? (
          <Pressable
            onPress={onNavigateToThemeSanctum}
            style={styles.secondaryActionButton}
            testID="navigate-to-theme-sanctum">
            <Text style={styles.secondaryActionText}>Theme Sanctum</Text>
          </Pressable>
        ) : null}
      </View>

      {appConfig.featureFlags.showFilterSection ? (
        <View style={styles.filterCard}>
          <View style={styles.filterHeaderRow}>
            <Text style={styles.sectionTitle}>{appConfig.filterSectionTitle}</Text>
            <View style={styles.filterHeaderActions}>
              <Pressable
                onPress={handleResetFilters}
                style={styles.inlineUtilityButton}
                testID="reset-filter-panel">
                <Text style={styles.inlineUtilityButtonText}>Reset</Text>
              </Pressable>
              <Pressable
                onPress={() => setIsFilterExpanded(expanded => !expanded)}
                style={styles.inlineUtilityButton}
                testID="toggle-filter-panel">
                <Text style={styles.inlineUtilityButtonText}>
                  {isFilterExpanded ? 'Hide' : 'Show'}
                </Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.formHint}>
            {isFilterExpanded
              ? 'Search by title, notes, or tags and keep the board focused on active quests.'
              : 'Expand to search, filter, and sort your active quest board.'}
          </Text>

          {isFilterExpanded ? (
            <>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Search Quest Board</Text>
                <TextInput
                  onChangeText={setSearchQuery}
                  placeholder="Search titles, notes, or tags"
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
                onSelect={value =>
                  setSelectedCategoryFilter(value as CategoryFilter)
                }
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
            </>
          ) : null}
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
              isExpanded={expandedQuestIds.includes(quest.id)}
              onPrimaryAction={
                section.key === 'completed'
                  ? undefined
                  : onPrimaryQuestAction
              }
              onEdit={
                appConfig.featureFlags.showAddQuestScreen ? onEditQuest : undefined
              }
              onOpenDetails={onOpenQuestDetails}
              onToggleExpand={handleToggleQuestExpand}
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
  onNavigateToHistory,
  onNavigateToStreak,
  onResetJourney,
  onToggleTheme,
  styles,
  themeMode,
}: {
  appConfig: AppConfig;
  hero: HeroProgress;
  quests: Quest[];
  unlockedAchievementIds: AchievementId[];
  onBack: () => void;
  onNavigateToHistory: () => void;
  onNavigateToStreak: () => void;
  onResetJourney: () => void;
  onToggleTheme: () => void;
  styles: ReturnType<typeof createStyles>;
  themeMode: ThemeMode;
}) {
  const stats = getProgressStats(quests);
  const rankProgress = getRankProgress(hero.xp);
  const favoriteTag = getFavoriteTag(quests);
  const bestStreak = getBestStreak(hero.activeDateKeys);

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
      <Text style={styles.subtitle}>
        {hero.rankTitle} of the {favoriteTag} path. Your codex keeps track of
        every quest, streak, and badge you forge.
      </Text>

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

        <View style={styles.detailsProgressSection}>
          <View style={styles.detailsProgressHeader}>
            <Text style={styles.formLabel}>Rank Progress</Text>
            <Text style={styles.detailsProgressValue}>
              {Math.round(rankProgress.progressPercent)}%
            </Text>
          </View>
          <View style={styles.detailsProgressTrack}>
            <View
              style={[
                styles.detailsProgressFill,
                { width: `${rankProgress.progressPercent}%` },
              ]}
            />
          </View>
        </View>
        <Text style={styles.heroSupportText}>{rankProgress.progressText}</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>{appConfig.progressSectionTitle}</Text>
        <Text style={styles.formIntro}>
          Best streak: {bestStreak} days. Favorite tag: {favoriteTag}. Keep
          shaping the board to build a stronger legend.
        </Text>

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
            label="Failed Quests"
            styles={styles}
            value={`${stats.totalFailed}`}
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

        <Pressable
          onPress={onNavigateToHistory}
          style={styles.secondaryActionButton}
          testID="navigate-to-history-screen-from-progress">
          <Text style={styles.secondaryActionText}>Quest History</Text>
        </Pressable>
        <Pressable
          onPress={onNavigateToStreak}
          style={styles.secondaryActionButton}
          testID="navigate-to-streak-screen-from-progress">
          <Text style={styles.secondaryActionText}>Streak Calendar</Text>
        </Pressable>
        <Pressable
          onPress={onResetJourney}
          style={styles.deleteButton}
          testID="reset-progress-button">
          <Text style={styles.deleteButtonText}>Reset Journey</Text>
        </Pressable>
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

function ThemeSanctumScreen({
  isRefreshingThemeSanctum,
  onBack,
  onRefresh,
  onSelectThemePack,
  onToggleTheme,
  styles,
  themeMode,
  themeSanctum,
}: {
  isRefreshingThemeSanctum: boolean;
  onBack: () => void;
  onRefresh: () => void;
  onSelectThemePack: (themePackId: ThemePackId) => void;
  onToggleTheme: () => void;
  styles: ReturnType<typeof createStyles>;
  themeMode: ThemeMode;
  themeSanctum: ThemeSanctumResponse;
}) {
  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <View style={styles.screenHeader}>
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          testID="back-from-theme-sanctum">
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.screenLabel}>Quest Board</Text>
        <ThemeToggle
          onToggleTheme={onToggleTheme}
          styles={styles}
          themeMode={themeMode}
        />
      </View>

      <Text style={styles.kicker}>{themeSanctum.kicker}</Text>
      <Text style={styles.title}>{themeSanctum.title}</Text>
      <Text style={styles.subtitle}>{themeSanctum.subtitle}</Text>

      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroEyebrow}>Active Essence</Text>
            <Text style={styles.heroTitle}>{themeSanctum.activeThemeLabel}</Text>
          </View>
          <View style={styles.heroOrb} />
        </View>

        <View style={styles.heroStatsRow}>
          <HeroStat
            accentStyle={styles.levelAccent}
            label="Mode"
            styles={styles}
            value={themeSanctum.activeModeLabel}
          />
          <HeroStat
            accentStyle={styles.xpAccent}
            label="Accent"
            styles={styles}
            value={themeSanctum.accentEnergyLabel}
          />
          <HeroStat
            accentStyle={styles.streakAccent}
            label="Surface"
            styles={styles}
            value={themeSanctum.surfaceToneLabel}
          />
        </View>

        <Text style={styles.heroSupportText}>{themeSanctum.realmNotesLabel}</Text>

        <Pressable
          onPress={onRefresh}
          style={styles.secondaryActionButton}
          testID="refresh-theme-sanctum">
          <Text style={styles.secondaryActionText}>
            {isRefreshingThemeSanctum ? 'Refreshing Sanctum...' : 'Refresh Theme Sanctum'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>{themeSanctum.availableEssencesTitle}</Text>
        <Text style={styles.formIntro}>{themeSanctum.availableEssencesIntro}</Text>

        {themeSanctum.availableThemePacks.map(themePack => {
          const isCurrent = themePack.statusLabel === 'Current';

          return (
            <View key={themePack.id} style={styles.suggestionCard}>
              <View style={styles.questHeaderRow}>
                <Text style={styles.suggestionTitle}>{themePack.name}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    isCurrent ? styles.statusBadgeDone : styles.statusBadgeActive,
                  ]}>
                  <Text
                    style={[
                      styles.statusBadgeText,
                      isCurrent ? styles.statusBadgeTextDone : null,
                    ]}>
                    {themePack.statusLabel}
                  </Text>
                </View>
              </View>
              <Text style={styles.formHint}>{themePack.description}</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaPill}>
                  <Text style={styles.metaLabel}>Accent Energy</Text>
                  <Text style={styles.metaValue}>{themePack.accentEnergy}</Text>
                </View>
                <View style={styles.metaPill}>
                  <Text style={styles.metaLabel}>Surface Tone</Text>
                  <Text style={styles.metaValue}>{themePack.surfaceTone}</Text>
                </View>
              </View>
              {isCurrent ? null : (
                <Pressable
                  onPress={() => onSelectThemePack(themePack.id)}
                  style={styles.cardSecondaryButton}
                  testID={`select-theme-pack-${themePack.id}`}>
                  <Text style={styles.cardSecondaryButtonText}>Channel Essence</Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function HistoryScreen({
  onBack,
  onToggleTheme,
  quests,
  styles,
  themeMode,
}: {
  onBack: () => void;
  onToggleTheme: () => void;
  quests: Quest[];
  styles: ReturnType<typeof createStyles>;
  themeMode: ThemeMode;
}) {
  const [historyPeriodFilter, setHistoryPeriodFilter] =
    useState<HistoryPeriodFilter>('Month');
  const [historyStatusFilter, setHistoryStatusFilter] =
    useState<HistoryStatusFilter>('All');
  const historyQuests = sortHistoryQuests(
    quests.filter(
      quest => quest.status === 'Completed' || quest.status === 'Failed',
    ),
  );
  const filteredHistoryQuests = historyQuests.filter(quest => {
    const resolvedDate = getQuestResolvedDate(quest);
    const matchesStatus =
      historyStatusFilter === 'All' || quest.status === historyStatusFilter;

    return (
      matchesStatus &&
      matchesHistoryPeriod(resolvedDate, historyPeriodFilter)
    );
  });
  const historyStats = getProgressStats(quests);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <View style={styles.screenHeader}>
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          testID="back-from-history-screen">
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.screenLabel}>Quest Board</Text>
        <ThemeToggle
          onToggleTheme={onToggleTheme}
          styles={styles}
          themeMode={themeMode}
        />
      </View>

      <Text style={styles.kicker}>Quest History</Text>
      <Text style={styles.title}>Archive Of The Realm</Text>
      <Text style={styles.subtitle}>
        Review the quests you completed, the ones that failed, and the pace of
        your journey across day, month, and year windows.
      </Text>

      <View style={styles.heroCard}>
        <View style={styles.heroStatsRow}>
          <HeroStat
            accentStyle={styles.xpAccent}
            label="Completed"
            styles={styles}
            value={`${historyStats.totalCompleted}`}
          />
          <HeroStat
            accentStyle={styles.levelAccent}
            label="Failed"
            styles={styles}
            value={`${historyStats.totalFailed}`}
          />
          <HeroStat
            accentStyle={styles.streakAccent}
            label="Archived"
            styles={styles}
            value={`${historyQuests.length}`}
          />
        </View>
      </View>

      <View style={styles.filterCard}>
        <SectionPicker
          label="Time Window"
          onSelect={value => setHistoryPeriodFilter(value as HistoryPeriodFilter)}
          options={historyPeriodOptions}
          selectedValue={historyPeriodFilter}
          styles={styles}
          testIdPrefix="history-period-filter"
        />
        <SectionPicker
          label="Outcome"
          onSelect={value => setHistoryStatusFilter(value as HistoryStatusFilter)}
          options={historyStatusOptions}
          selectedValue={historyStatusFilter}
          styles={styles}
          testIdPrefix="history-status-filter"
        />
      </View>

      {filteredHistoryQuests.length === 0 ? (
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateTitle}>No quests in this archive view</Text>
          <Text style={styles.emptyStateText}>
            Change the time window or outcome filter to widen the ledger.
          </Text>
        </View>
      ) : (
        filteredHistoryQuests.map(quest => {
          const resolvedDate = getQuestResolvedDate(quest) ?? 'Unknown';

          return (
            <View
              key={`${quest.id}-${resolvedDate}`}
              style={styles.suggestionCard}
              testID={`history-quest-${quest.id}`}>
              <View style={styles.questHeaderRow}>
                <Text style={styles.suggestionTitle}>{quest.title}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    quest.status === 'Completed'
                      ? styles.statusBadgeDone
                      : styles.statusBadgeActive,
                  ]}>
                  <Text
                    style={[
                      styles.statusBadgeText,
                      quest.status === 'Completed'
                        ? styles.statusBadgeTextDone
                        : null,
                    ]}>
                    {quest.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.questDescription}>{quest.description}</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaPill}>
                  <Text style={styles.metaLabel}>Resolved</Text>
                  <Text style={styles.metaValue}>{resolvedDate}</Text>
                </View>
                <View style={styles.metaPill}>
                  <Text style={styles.metaLabel}>XP Result</Text>
                  <Text style={styles.metaValue}>
                    {quest.status === 'Completed' ? `+${quest.xpReward}` : '0'}
                  </Text>
                </View>
              </View>
              <View style={styles.metaRow}>
                <View style={styles.metaPill}>
                  <Text style={styles.metaLabel}>Tag</Text>
                  <Text style={styles.metaValue}>{quest.tag}</Text>
                </View>
                <View style={styles.metaPill}>
                  <Text style={styles.metaLabel}>Difficulty</Text>
                  <Text style={styles.metaValue}>{quest.difficulty}</Text>
                </View>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

function StreakScreen({
  hero,
  onBack,
  onToggleTheme,
  styles,
  themeMode,
}: {
  hero: HeroProgress;
  onBack: () => void;
  onToggleTheme: () => void;
  styles: ReturnType<typeof createStyles>;
  themeMode: ThemeMode;
}) {
  const today = new Date();
  const calendarDays = buildCalendarDays(hero.activeDateKeys, today);
  const bestStreak = getBestStreak(hero.activeDateKeys);
  const activeDaysThisMonth = hero.activeDateKeys.filter(activeDateKey =>
    matchesHistoryPeriod(activeDateKey, 'Month', getDateKey(today)),
  ).length;
  const monthLabel = today.toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <View style={styles.screenHeader}>
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          testID="back-from-streak-screen">
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.screenLabel}>Quest Board</Text>
        <ThemeToggle
          onToggleTheme={onToggleTheme}
          styles={styles}
          themeMode={themeMode}
        />
      </View>

      <Text style={styles.kicker}>Streak Calendar</Text>
      <Text style={styles.title}>Keep The Flame Alive</Text>
      <Text style={styles.subtitle}>
        Your calendar reveals the rhythm of your questing and the days when you
        kept the guild moving.
      </Text>

      <View style={styles.heroCard}>
        <View style={styles.heroStatsRow}>
          <HeroStat
            accentStyle={styles.streakAccent}
            label="Current"
            styles={styles}
            value={`${hero.streakCount}d`}
          />
          <HeroStat
            accentStyle={styles.levelAccent}
            label="Best"
            styles={styles}
            value={`${bestStreak}d`}
          />
          <HeroStat
            accentStyle={styles.xpAccent}
            label="This Month"
            styles={styles}
            value={`${activeDaysThisMonth}`}
          />
        </View>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>{monthLabel}</Text>
        <View style={styles.calendarWeekRow}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(weekDay => (
            <Text key={weekDay} style={styles.calendarWeekday}>
              {weekDay}
            </Text>
          ))}
        </View>
        <View style={styles.calendarGrid}>
          {calendarDays.map((calendarDay, index) =>
            calendarDay ? (
              <View
                key={calendarDay.dateKey}
                style={[
                  styles.calendarDay,
                  calendarDay.isActive && styles.calendarDayActive,
                  calendarDay.isToday && styles.calendarDayToday,
                ]}>
                <Text
                  style={[
                    styles.calendarDayText,
                    calendarDay.isActive && styles.calendarDayTextActive,
                    calendarDay.isToday && styles.calendarDayTextToday,
                  ]}>
                  {calendarDay.dayNumber}
                </Text>
              </View>
            ) : (
              <View key={`empty-day-${index}`} style={styles.calendarDayEmpty} />
            ),
          )}
        </View>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Streak Insight</Text>
        <Text style={styles.formIntro}>
          Last active day: {hero.lastCompletedDate ?? 'No streak yet'}.
          {` `}
          Your next milestone is {Math.max(3, hero.streakCount + 1)} days.
        </Text>
      </View>
    </ScrollView>
  );
}

function QuestDetailsScreen({
  onBack,
  onPrimaryAction,
  onEdit,
  onFail,
  onToggleTheme,
  questDetails,
  styles,
  themeMode,
}: {
  onBack: () => void;
  onPrimaryAction: (questId: string) => void;
  onEdit: (questId: string) => void;
  onFail: (questId: string) => void;
  onToggleTheme: () => void;
  questDetails: QuestDetailsResponse;
  styles: ReturnType<typeof createStyles>;
  themeMode: ThemeMode;
}) {
  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <View style={styles.screenHeader}>
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          testID="back-from-quest-details">
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.screenLabel}>Quest Board</Text>
        <ThemeToggle
          onToggleTheme={onToggleTheme}
          styles={styles}
          themeMode={themeMode}
        />
      </View>

      <Text style={styles.kicker}>{questDetails.kicker}</Text>
      <Text style={styles.title}>{questDetails.title}</Text>
      <Text style={styles.subtitle}>{questDetails.subtitle}</Text>

      <View style={styles.detailsBadgeRow}>
        <View
          style={[
            styles.statusBadge,
            questDetails.canComplete
              ? styles.statusBadgeActive
              : styles.statusBadgeDone,
          ]}>
          <Text
            style={[
              styles.statusBadgeText,
              questDetails.canComplete ? null : styles.statusBadgeTextDone,
            ]}>
            {questDetails.statusLabel}
          </Text>
        </View>
        <View style={styles.detailsCategoryBadge}>
          <Text style={styles.detailsCategoryBadgeText}>
            {questDetails.categoryLabel}
          </Text>
        </View>
        <View style={styles.detailsCategoryBadge}>
          <Text style={styles.detailsCategoryBadgeText}>
            {questDetails.tagLabel}
          </Text>
        </View>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroEyebrow}>{questDetails.summaryEyebrow}</Text>
            <Text style={styles.heroTitle}>{questDetails.summaryTitle}</Text>
          </View>
          <View style={styles.heroOrb} />
        </View>

        <View style={styles.heroStatsRow}>
          <HeroStat
            accentStyle={styles.levelAccent}
            label="Difficulty"
            styles={styles}
            value={questDetails.difficultyLabel}
          />
          <HeroStat
            accentStyle={styles.xpAccent}
            label="Reward"
            styles={styles}
            value={questDetails.xpRewardLabel}
          />
          <HeroStat
            accentStyle={styles.streakAccent}
            label="Status"
            styles={styles}
            value={questDetails.statusLabel}
          />
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <Text style={styles.metaLabel}>Due Date</Text>
            <Text style={styles.metaValue}>{questDetails.dueDateLabel}</Text>
          </View>
          <View style={styles.metaPill}>
            <Text style={styles.metaLabel}>Timeline</Text>
            <Text style={styles.metaValue}>{questDetails.dueStateLabel}</Text>
          </View>
        </View>

        <View style={styles.detailsProgressSection}>
          <View style={styles.detailsProgressHeader}>
            <Text style={styles.formLabel}>{questDetails.ritualProgressLabel}</Text>
            <Text style={styles.detailsProgressValue}>
              {questDetails.ritualProgressPercent}%
            </Text>
          </View>
          <View style={styles.detailsProgressTrack}>
            <View
              style={[
                styles.detailsProgressFill,
                { width: `${questDetails.ritualProgressPercent}%` },
              ]}
            />
          </View>
        </View>

        <Text style={styles.heroSupportText}>{questDetails.progressStatusText}</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>{questDetails.guidanceTitle}</Text>
        <Text style={styles.formIntro}>{questDetails.guidanceText}</Text>
      </View>

      <View style={styles.boardActionCard}>
        <Text style={styles.sectionTitle}>Quest Actions</Text>
        <Text style={styles.formIntro}>
          Choose the next move for this quest and keep the board in motion.
        </Text>

        {questDetails.primaryActionType !== 'none' ? (
          <Pressable
            onPress={() => onPrimaryAction(questDetails.questId)}
            style={styles.primaryActionButton}
            testID="complete-quest-from-details">
            <Text style={styles.primaryActionText}>
              {questDetails.primaryActionLabel}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>
              {questDetails.primaryActionLabel}
            </Text>
            <Text style={styles.emptyStateText}>
              {questDetails.statusLabel === 'Failed'
                ? 'This quest has been sealed inside the failed archive.'
                : 'This quest is already sealed inside the completed ledger.'}
            </Text>
          </View>
        )}

        <Pressable
          onPress={() => onEdit(questDetails.questId)}
          style={styles.secondaryActionButton}
          testID="edit-quest-from-details">
          <Text style={styles.secondaryActionText}>
            {questDetails.secondaryActionLabel}
          </Text>
        </Pressable>
        {questDetails.tertiaryActionType === 'fail' ? (
          <Pressable
            onPress={() => onFail(questDetails.questId)}
            style={styles.deleteButton}
            testID="fail-quest-from-details">
            <Text style={styles.deleteButtonText}>
              {questDetails.tertiaryActionLabel}
            </Text>
          </Pressable>
        ) : null}
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
  const [questDescription, setQuestDescription] = useState('');
  const [questDueDate, setQuestDueDate] = useState('');
  const [selectedTag, setSelectedTag] = useState<QuestTag>('General');
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty>('Easy');
  const [selectedCategory, setSelectedCategory] =
    useState<Category>('Side Quest');

  useEffect(() => {
    if (questToEdit) {
      setQuestTitle(questToEdit.title);
      setQuestDescription(questToEdit.description);
      setQuestDueDate(questToEdit.dueDate ?? '');
      setSelectedTag(questToEdit.tag);
      setSelectedDifficulty(questToEdit.difficulty);
      setSelectedCategory(questToEdit.category);
      return;
    }

    setQuestTitle('');
    setQuestDescription('');
    setQuestDueDate('');
    setSelectedTag('General');
    setSelectedDifficulty('Easy');
    setSelectedCategory('Side Quest');
  }, [questToEdit]);

  const isValidDueDate =
    questDueDate.trim().length === 0 || normalizeDueDate(questDueDate) !== null;
  const canSaveQuest = questTitle.trim().length > 0 && isValidDueDate;

  const handleSaveQuest = () => {
    const title = questTitle.trim();

    if (!title) {
      return;
    }

    onSave({
      title,
      description: questDescription.trim(),
      tag: selectedTag,
      dueDate: normalizeDueDate(questDueDate),
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

      <Text style={styles.kicker}>{isEditing ? 'Edit Quest' : 'Quest Forge'}</Text>
      <Text style={styles.title}>
        {isEditing ? 'Refine Quest Details' : 'Shape Your Next Quest'}
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

        {questToEdit?.status === 'Completed' || questToEdit?.status === 'Failed' ? (
          <Text style={styles.formHint}>
            Archived quest edits only update the saved details. Earned XP,
            streak history, and archive outcome stay as they are.
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

        <View style={styles.formField}>
          <Text style={styles.formLabel}>Quest Notes</Text>
          <TextInput
            multiline
            numberOfLines={4}
            onChangeText={setQuestDescription}
            placeholder="Write a short quest note or guidance line"
            placeholderTextColor={styles.themePlaceholder.color}
            style={styles.notesInput}
            testID="quest-description-input"
            textAlignVertical="top"
            value={questDescription}
          />
        </View>

        <View style={styles.formField}>
          <Text style={styles.formLabel}>Due Date</Text>
          <TextInput
            autoCapitalize="none"
            onChangeText={setQuestDueDate}
            placeholder="YYYY-MM-DD or 2026-04-03T18:00"
            placeholderTextColor={styles.themePlaceholder.color}
            style={styles.titleInput}
            testID="quest-due-date-input"
            value={questDueDate}
          />
          <Text style={styles.formHint}>
            {isValidDueDate
              ? 'Use `YYYY-MM-DD` for all-day quests or a full date-time for reminder-based quests.'
              : 'Enter a valid `YYYY-MM-DD` date or full date-time before saving this quest.'}
          </Text>
        </View>

        <SectionPicker
          label="Tag"
          onSelect={value => setSelectedTag(value as QuestTag)}
          options={questTagOptions}
          selectedValue={selectedTag}
          styles={styles}
          testIdPrefix="tag-option"
        />

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

function QuestPoolScreen({
  isRefreshingQuestPool,
  onAddTemplate,
  onBack,
  onRefresh,
  onToggleTheme,
  questPool,
  styles,
  themeMode,
}: {
  isRefreshingQuestPool: boolean;
  onAddTemplate: (template: SuggestedQuest, category: Category) => void;
  onBack: () => void;
  onRefresh: () => void;
  onToggleTheme: () => void;
  questPool: QuestPoolResponse;
  styles: ReturnType<typeof createStyles>;
  themeMode: ThemeMode;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const visibleTemplates = questPool.templates.filter(template => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const normalizedDescription = template.description?.toLowerCase() ?? '';
    const normalizedTag = template.tag?.toLowerCase() ?? '';
    const matchesQuery =
      normalizedQuery.length === 0 ||
      template.title.toLowerCase().includes(normalizedQuery) ||
      normalizedDescription.includes(normalizedQuery) ||
      normalizedTag.includes(normalizedQuery);
    const matchesCategory =
      selectedCategory === 'All' || template.tag === selectedCategory;

    return matchesQuery && matchesCategory;
  });

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <View style={styles.screenHeader}>
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          testID="back-from-quest-pool">
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.screenLabel}>Quest Board</Text>
        <ThemeToggle
          onToggleTheme={onToggleTheme}
          styles={styles}
          themeMode={themeMode}
        />
      </View>

      <Text style={styles.kicker}>{questPool.kicker}</Text>
      <Text style={styles.title}>{questPool.title}</Text>
      <Text style={styles.subtitle}>{questPool.subtitle}</Text>

      <View style={styles.formCard}>
        <View style={styles.questPoolHeaderRow}>
          <View style={styles.questPoolHeaderCopy}>
            <Text style={styles.sectionTitle}>Template Archive</Text>
            <Text style={styles.formIntro}>
              Save time by dropping proven daily tasks straight into your board.
            </Text>
          </View>
          <Pressable
            onPress={onRefresh}
            style={styles.inlineUtilityButton}
            testID="refresh-quest-pool">
            <Text style={styles.inlineUtilityButtonText}>
              {isRefreshingQuestPool ? '...' : 'Refresh'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.formField}>
          <Text style={styles.formLabel}>Search Quest Pool</Text>
          <TextInput
            onChangeText={setSearchQuery}
            placeholder={questPool.searchPlaceholder}
            placeholderTextColor={styles.themePlaceholder.color}
            style={styles.titleInput}
            testID="quest-pool-search-input"
            value={searchQuery}
          />
        </View>

        <ScrollView
          horizontal
          contentContainerStyle={styles.questPoolChipRow}
          showsHorizontalScrollIndicator={false}>
          {questPool.categories.map(category => {
            const isSelected = category === selectedCategory;

            return (
              <Pressable
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[
                  styles.optionChip,
                  styles.questPoolChip,
                  isSelected && styles.optionChipSelected,
                ]}
                testID={`quest-pool-category-${category.replace(/\s+/g, '-').toLowerCase()}`}>
                <Text
                  style={[
                    styles.optionChipText,
                    isSelected && styles.optionChipTextSelected,
                  ]}>
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {visibleTemplates.length === 0 ? (
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateTitle}>No templates match this search</Text>
          <Text style={styles.emptyStateText}>
            Try another tag or clear the search to widen the archive.
          </Text>
        </View>
      ) : (
        visibleTemplates.map((template, index) => {
          const dueDetails = getQuestDueDetails({
            status: 'Ready',
            dueDate: template.dueDate ?? null,
          });

          return (
            <View
              key={`${template.title}-${index}`}
              style={styles.suggestionCard}
              testID={`quest-pool-card-${index}`}>
              <Text style={styles.suggestionTitle}>{template.title}</Text>
              <Text style={styles.questDescription}>{template.description}</Text>

              <View style={styles.metaRow}>
                <View style={styles.metaPill}>
                  <Text style={styles.metaLabel}>Tag</Text>
                  <Text style={styles.metaValue}>{template.tag}</Text>
                </View>
                <View style={styles.metaPill}>
                  <Text style={styles.metaLabel}>Difficulty</Text>
                  <Text style={styles.metaValue}>{template.difficulty}</Text>
                </View>
                <View style={styles.metaPill}>
                  <Text style={styles.metaLabel}>Default Path</Text>
                  <Text style={styles.metaValue}>{template.category}</Text>
                </View>
              </View>

              {template.dueDate ? (
                <View style={styles.metaRow}>
                  <View style={styles.metaPill}>
                    <Text style={styles.metaLabel}>Deadline</Text>
                    <Text style={styles.metaValue}>{dueDetails.dueDateLabel}</Text>
                  </View>
                  <View
                    style={[
                      styles.metaPill,
                      dueDetails.isUrgent ? styles.metaPillHighlight : null,
                    ]}>
                    <Text style={styles.metaLabel}>Timeline</Text>
                    <Text
                      style={[
                        styles.metaValue,
                        dueDetails.isUrgent ? styles.metaValueHighlight : null,
                      ]}>
                      {dueDetails.dueStateLabel}
                    </Text>
                  </View>
                </View>
              ) : null}

              <View style={styles.questPoolActionRow}>
                <Pressable
                  onPress={() => onAddTemplate(template, 'Main Quest')}
                  style={styles.poolActionButton}
                  testID={`add-quest-pool-main-${index}`}>
                  <Text style={styles.poolActionButtonText}>Main Quest</Text>
                </Pressable>
                <Pressable
                  onPress={() => onAddTemplate(template, 'Side Quest')}
                  style={[styles.poolActionButton, styles.poolActionButtonSecondary]}
                  testID={`add-quest-pool-side-${index}`}>
                  <Text
                    style={[
                      styles.poolActionButtonText,
                      styles.poolActionButtonTextSecondary,
                    ]}>
                    Side Quest
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })
      )}
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
  const [questPool, setQuestPool] = useState<QuestPoolResponse | null>(null);
  const [isRefreshingQuestPool, setIsRefreshingQuestPool] = useState(false);
  const [themeSanctum, setThemeSanctum] = useState<ThemeSanctumResponse | null>(null);
  const [isRefreshingThemeSanctum, setIsRefreshingThemeSanctum] = useState(false);
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [questDetails, setQuestDetails] = useState<QuestDetailsResponse | null>(null);
  const [isRefreshingQuestDetails, setIsRefreshingQuestDetails] = useState(false);
  const [reminderPrompt, setReminderPrompt] = useState<ReminderPrompt | null>(null);
  const [dailySuggestions, setDailySuggestions] = useState<SuggestedQuest[]>(
    () => getDailySuggestions(getDateKey(), initialQuests.map(normalizeQuest)),
  );
  const [dailySuggestionDateKey, setDailySuggestionDateKey] = useState(
    getDateKey(),
  );
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isProcessingRemindersRef = useRef(false);

  const currentTheme = getThemePalette(gameState.themeMode, gameState.themePackId);
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

  const applyRemoteQuestPool = (nextQuestPool: QuestPoolResponse) => {
    setQuestPool(nextQuestPool);

    return nextQuestPool;
  };

  const applyRemoteRealmCodex = (nextRealmCodex: RealmCodexResponse) => {
    setRealmCodex(nextRealmCodex);

    return nextRealmCodex;
  };

  const applyRemoteThemeSanctum = (nextThemeSanctum: ThemeSanctumResponse) => {
    setThemeSanctum(nextThemeSanctum);

    return nextThemeSanctum;
  };

  const applyRemoteQuestDetails = (nextQuestDetails: QuestDetailsResponse) => {
    setQuestDetails(nextQuestDetails);

    return nextQuestDetails;
  };

  const refreshRemoteDailySuggestions = async () => {
    const nextDailySuggestions =
      await fetchRemoteDailySuggestions<DailySuggestionsResponse>();

    applyRemoteDailySuggestions(nextDailySuggestions);

    return nextDailySuggestions;
  };

  const refreshRemoteQuestPool = async () => {
    const nextQuestPool = await fetchRemoteQuestPool<QuestPoolResponse>();

    applyRemoteQuestPool(nextQuestPool);

    return nextQuestPool;
  };

  const refreshRemoteRealmCodex = async () => {
    const nextRealmCodex = await fetchRemoteRealmCodex<RealmCodexResponse>();

    applyRemoteRealmCodex(nextRealmCodex);

    return nextRealmCodex;
  };

  const refreshRemoteThemeSanctum = async () => {
    const nextThemeSanctum =
      await fetchRemoteThemeSanctum<ThemeSanctumResponse>();

    applyRemoteThemeSanctum(nextThemeSanctum);

    return nextThemeSanctum;
  };

  const refreshRemoteQuestDetails = async (
    questId: string,
  ) => {
    const nextQuestDetails =
      await fetchRemoteQuestDetails<QuestDetailsResponse>(questId);

    applyRemoteQuestDetails(nextQuestDetails);

    return nextQuestDetails;
  };

  const persistGameStateSnapshot = async (nextGameState: GameState) => {
    try {
      setBackendError(null);
      const savedGameState = await saveRemoteGameState<GameState>(nextGameState);

      return applyRemoteGameState(savedGameState);
    } catch {
      setBackendError(backendUnavailableMessage);

      return null;
    }
  };

  const processQuestReminders = useEffectEvent(
    async (gameStateSnapshot: GameState) => {
    if (
      !isHydrated ||
      backendError !== null ||
      isProcessingRemindersRef.current
    ) {
      return;
    }

    const dueSoonQuests = gameStateSnapshot.quests.filter(shouldSendDueSoonReminder);
    const overdueQuests = gameStateSnapshot.quests.filter(shouldSendOverdueReminder);

    if (dueSoonQuests.length === 0 && overdueQuests.length === 0) {
      return;
    }

    isProcessingRemindersRef.current = true;

    try {
      await Promise.all(
        dueSoonQuests.map(quest =>
          sendQuestReminderNotification(
            'Quest Due Soon',
            `${quest.title} is running out of time.`,
            `due-soon-${quest.id}`,
          ),
        ),
      );
      await Promise.all(
        overdueQuests.map(quest =>
          sendQuestReminderNotification(
            'Quest Overdue',
            `${quest.title} is overdue. Did you complete it?`,
            `overdue-${quest.id}`,
          ),
        ),
      );

      const nextGameState = normalizeStoredGameState({
        ...gameStateSnapshot,
        quests: gameStateSnapshot.quests.map(quest => ({
          ...quest,
          dueSoonReminderAt: dueSoonQuests.some(
            dueSoonQuest => dueSoonQuest.id === quest.id,
          )
            ? quest.dueDate
            : quest.dueSoonReminderAt,
          overdueReminderAt: overdueQuests.some(
            overdueQuest => overdueQuest.id === quest.id,
          )
            ? quest.dueDate
            : quest.overdueReminderAt,
        })),
      });
      const savedGameState = await persistGameStateSnapshot(nextGameState);

      if (overdueQuests.length > 0 && reminderPrompt === null) {
        const promptQuestId = overdueQuests[0].id;
        const promptQuest =
          savedGameState?.quests.find(quest => quest.id === promptQuestId) ??
          nextGameState.quests.find(quest => quest.id === promptQuestId);

        if (promptQuest) {
          const dueDetails = getQuestDueDetails(promptQuest);

          setReminderPrompt({
            questId: promptQuest.id,
            title: promptQuest.title,
            dueLabel: dueDetails.dueDateLabel,
            dueStateLabel: dueDetails.dueStateLabel,
          });
        }
      }
    } finally {
      isProcessingRemindersRef.current = false;
    }
    },
  );

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
      if (currentScreen === 'quest-pool') {
        await refreshRemoteQuestPool();
      }
      if (currentScreen === 'theme-sanctum') {
        await refreshRemoteThemeSanctum();
      }
      if (currentScreen === 'quest-details' && selectedQuestId) {
        await refreshRemoteQuestDetails(selectedQuestId);
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

  useEffect(() => {
    if (!isHydrated || backendError !== null || appStateRef.current !== 'active') {
      return;
    }

    processQuestReminders(gameState);
  }, [backendError, gameState, isHydrated]);

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        const shouldCheckReminders =
          appStateRef.current.match(/inactive|background/) &&
          nextAppState === 'active';

        appStateRef.current = nextAppState;

        if (shouldCheckReminders) {
          processQuestReminders(gameState);
        }
      },
    );

    return () => {
      appStateSubscription.remove();
    };
  }, [gameState, isHydrated, backendError]);

  const returnToBoard = () => {
    setEditingQuestId(null);
    setSelectedQuestId(null);
    setQuestDetails(null);
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

  const handleAddQuestPoolTemplate = async (
    template: SuggestedQuest,
    category: Category,
  ) => {
    const response = await runGameStateRequest(() =>
      createRemoteQuest<SuggestedQuest, GameStateResponse>({
        ...template,
        category,
      }),
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
      if (reminderPrompt?.questId === questId) {
        setReminderPrompt(null);
      }
      await refreshRemoteDailySuggestions();
      returnToBoard();
    }
  };

  const handleQuestPrimaryAction = async (questId: string) => {
    const quest = gameState.quests.find(currentQuest => currentQuest.id === questId);

    if (!quest || quest.status === 'Completed') {
      return;
    }

    if (quest.status === 'Ready') {
      await runGameStateRequest(() => startRemoteQuest<GameStateResponse>(questId));
      return;
    }

    const response = await runGameStateRequest(() =>
      completeRemoteQuest<CompleteQuestResponse>(questId),
    );

    if (response?.completionFeedback) {
      if (reminderPrompt?.questId === questId) {
        setReminderPrompt(null);
      }
      setCompletionFeedback(response.completionFeedback);
    }
  };

  const handleFailQuest = async (questId: string) => {
    const response = await runGameStateRequest(() =>
      failRemoteQuest<GameStateResponse>(questId),
    );

    if (response) {
      if (reminderPrompt?.questId === questId) {
        setReminderPrompt(null);
      }
      returnToBoard();
    }
  };

  const handleDismissReminderPrompt = () => {
    setReminderPrompt(null);
  };

  const handleReminderViewQuest = async (questId: string) => {
    setReminderPrompt(null);
    await handleOpenQuestDetails(questId);
  };

  const handleReminderCompleteQuest = async (questId: string) => {
    setReminderPrompt(null);
    await handleQuestPrimaryAction(questId);
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

  const handleSelectThemePack = async (themePackId: ThemePackId) => {
    await runGameStateRequest(() =>
      updateRemoteThemePack<ThemePackId, GameStateResponse>(themePackId),
    );
  };

  const handleOpenQuestDetails = async (questId: string) => {
    setSelectedQuestId(questId);
    setQuestDetails(null);
    setCurrentScreen('quest-details');
    setIsRefreshingQuestDetails(true);

    try {
      setBackendError(null);
      await refreshRemoteQuestDetails(questId);
    } catch {
      setBackendError(backendUnavailableMessage);
      setSelectedQuestId(null);
      setQuestDetails(null);
      setCurrentScreen('quest-board');
    } finally {
      setIsRefreshingQuestDetails(false);
    }
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

  const handleOpenHistory = () => {
    setCurrentScreen('history');
  };

  const handleOpenStreak = () => {
    setCurrentScreen('streak');
  };

  const handleOpenQuestPool = async () => {
    setCurrentScreen('quest-pool');
    setIsRefreshingQuestPool(true);

    try {
      setBackendError(null);
      await refreshRemoteQuestPool();
    } catch {
      setBackendError(backendUnavailableMessage);
      setCurrentScreen('quest-board');
    } finally {
      setIsRefreshingQuestPool(false);
    }
  };

  const handleRefreshQuestPool = async () => {
    setIsRefreshingQuestPool(true);

    try {
      setBackendError(null);
      await refreshRemoteQuestPool();
    } catch {
      setBackendError(backendUnavailableMessage);
    } finally {
      setIsRefreshingQuestPool(false);
    }
  };

  const handleResetJourney = async () => {
    const response = await runGameStateRequest(() =>
      resetRemoteProgress<GameStateResponse>(),
    );

    if (response) {
      setCompletionFeedback(null);
      setReminderPrompt(null);
      await refreshRemoteDailySuggestions();
      returnToBoard();
    }
  };

  const handleConfirmResetJourney = () => {
    Alert.alert(
      'Reset Journey?',
      'This will clear your quests, history, streaks, XP, and achievements. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: () => {
            handleResetJourney().catch(() => undefined);
          },
        },
      ],
    );
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

  const handleOpenThemeSanctum = async () => {
    if (!appConfig.featureFlags.showThemeSanctumScreen) {
      return;
    }

    setCurrentScreen('theme-sanctum');
    setIsRefreshingThemeSanctum(true);

    try {
      setBackendError(null);
      await refreshRemoteThemeSanctum();
    } catch {
      setBackendError(backendUnavailableMessage);
      setCurrentScreen('quest-board');
    } finally {
      setIsRefreshingThemeSanctum(false);
    }
  };

  const handleRefreshThemeSanctum = async () => {
    setIsRefreshingThemeSanctum(true);

    try {
      setBackendError(null);
      await refreshRemoteThemeSanctum();
    } catch {
      setBackendError(backendUnavailableMessage);
    } finally {
      setIsRefreshingThemeSanctum(false);
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
      if (currentScreen === 'quest-pool') {
        await refreshRemoteQuestPool();
      }
      if (currentScreen === 'theme-sanctum') {
        await refreshRemoteThemeSanctum();
      }
      if (currentScreen === 'quest-details' && selectedQuestId) {
        await refreshRemoteQuestDetails(selectedQuestId);
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
                  onPrimaryQuestAction={handleQuestPrimaryAction}
                  onEditQuest={questId => {
                    setEditingQuestId(questId);
                    setCurrentScreen('add-quest');
                  }}
                  onOpenQuestDetails={handleOpenQuestDetails}
                  onNavigateToAddQuest={handleOpenAddQuest}
                  onNavigateToHistory={handleOpenHistory}
                  onNavigateToProgress={handleOpenProgress}
                  onNavigateToQuestPool={handleOpenQuestPool}
                  onNavigateToStreak={handleOpenStreak}
                  onNavigateToRealmCodex={handleOpenRealmCodex}
                  onNavigateToThemeSanctum={handleOpenThemeSanctum}
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
                  onNavigateToHistory={handleOpenHistory}
                  onNavigateToStreak={handleOpenStreak}
                  onResetJourney={handleConfirmResetJourney}
                  onToggleTheme={handleToggleTheme}
                  quests={gameState.quests}
                  styles={styles}
                  themeMode={gameState.themeMode}
                  unlockedAchievementIds={gameState.unlockedAchievementIds}
                />
              ) : currentScreen === 'history' ? (
                <HistoryScreen
                  onBack={() => setCurrentScreen('quest-board')}
                  onToggleTheme={handleToggleTheme}
                  quests={gameState.quests}
                  styles={styles}
                  themeMode={gameState.themeMode}
                />
              ) : currentScreen === 'streak' ? (
                <StreakScreen
                  hero={gameState.hero}
                  onBack={() => setCurrentScreen('quest-board')}
                  onToggleTheme={handleToggleTheme}
                  styles={styles}
                  themeMode={gameState.themeMode}
                />
              ) : currentScreen === 'quest-pool' ? (
                questPool ? (
                  <QuestPoolScreen
                    isRefreshingQuestPool={isRefreshingQuestPool}
                    onAddTemplate={handleAddQuestPoolTemplate}
                    onBack={() => setCurrentScreen('quest-board')}
                    onRefresh={handleRefreshQuestPool}
                    onToggleTheme={handleToggleTheme}
                    questPool={questPool}
                    styles={styles}
                    themeMode={gameState.themeMode}
                  />
                ) : (
                  <View style={styles.loadingState}>
                    <Text style={styles.loadingKicker}>Opening Quest Pool</Text>
                    <Text style={styles.loadingTitle}>Quest Forge</Text>
                  </View>
                )
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
              ) : currentScreen === 'theme-sanctum' ? (
                themeSanctum ? (
                  <ThemeSanctumScreen
                    isRefreshingThemeSanctum={isRefreshingThemeSanctum}
                    onBack={() => setCurrentScreen('quest-board')}
                    onRefresh={handleRefreshThemeSanctum}
                    onSelectThemePack={handleSelectThemePack}
                    onToggleTheme={handleToggleTheme}
                    styles={styles}
                    themeMode={gameState.themeMode}
                    themeSanctum={themeSanctum}
                  />
                ) : (
                  <View style={styles.loadingState}>
                    <Text style={styles.loadingKicker}>Opening Theme Sanctum</Text>
                    <Text style={styles.loadingTitle}>Quest Forge</Text>
                  </View>
                )
              ) : currentScreen === 'quest-details' ? (
                questDetails ? (
                  <QuestDetailsScreen
                    onBack={returnToBoard}
                    onFail={handleFailQuest}
                    onPrimaryAction={handleQuestPrimaryAction}
                    onEdit={questId => {
                      setEditingQuestId(questId);
                      setCurrentScreen('add-quest');
                    }}
                    onToggleTheme={handleToggleTheme}
                    questDetails={questDetails}
                    styles={styles}
                    themeMode={gameState.themeMode}
                  />
                ) : (
                  <View style={styles.loadingState}>
                    <Text style={styles.loadingKicker}>
                      {isRefreshingQuestDetails
                        ? 'Forging Quest Dossier'
                        : 'Opening Quest Details'}
                    </Text>
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
              {reminderPrompt ? (
                <ReminderPromptOverlay
                  onComplete={handleReminderCompleteQuest}
                  onDismiss={handleDismissReminderPrompt}
                  onViewQuest={handleReminderViewQuest}
                  reminderPrompt={reminderPrompt}
                  styles={styles}
                />
              ) : null}
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
    detailsBadgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 16,
    },
    detailsCategoryBadge: {
      backgroundColor: `${theme.blue}18`,
      borderColor: `${theme.blue}42`,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    detailsCategoryBadgeText: {
      color: theme.blueSoft,
      fontSize: 11,
      fontWeight: '700',
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
    topBarActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
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
    heroStatInteractive: {
      borderColor: `${theme.blue}48`,
    },
    heroOverviewPressable: {
      borderRadius: 18,
    },
    heroTapHint: {
      color: theme.blueSoft,
      fontSize: 12,
      fontWeight: '600',
      marginTop: 10,
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
    detailsProgressSection: {
      marginTop: 18,
    },
    detailsProgressHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    detailsProgressValue: {
      color: theme.blueSoft,
      fontSize: 14,
      fontWeight: '700',
    },
    detailsProgressTrack: {
      backgroundColor: `${theme.surfaceHigh}f0`,
      borderColor: theme.ghostBorder,
      borderRadius: 999,
      borderWidth: 1,
      height: 12,
      overflow: 'hidden',
    },
    detailsProgressFill: {
      backgroundColor: theme.amber,
      borderRadius: 999,
      height: '100%',
      shadowColor: theme.amber,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.28,
      shadowRadius: 12,
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
    questPoolHeaderRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
    },
    questPoolHeaderCopy: {
      flex: 1,
    },
    questPoolChipRow: {
      gap: 10,
      paddingRight: 6,
    },
    questPoolChip: {
      marginTop: 14,
    },
    questPoolActionRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 14,
    },
    poolActionButton: {
      alignItems: 'center',
      backgroundColor: theme.amber,
      borderColor: `${theme.amberSoft}80`,
      borderRadius: 14,
      borderWidth: 1,
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    poolActionButtonSecondary: {
      backgroundColor: `${theme.blue}14`,
      borderColor: `${theme.blue}42`,
    },
    poolActionButtonText: {
      color: theme.buttonText,
      fontSize: 14,
      fontWeight: '700',
    },
    poolActionButtonTextSecondary: {
      color: theme.blueSoft,
    },
    questDescription: {
      color: theme.subtitle,
      fontSize: 14,
      lineHeight: 21,
      marginTop: 10,
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
    filterHeaderRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
    },
    filterHeaderActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
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
    inlineUtilityButton: {
      alignItems: 'center',
      backgroundColor: `${theme.surfaceHigh}f2`,
      borderColor: theme.ghostBorder,
      borderRadius: 999,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 38,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    inlineUtilityButtonText: {
      color: theme.blueSoft,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.2,
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
    notesInput: {
      backgroundColor: theme.surfaceLow,
      borderColor: theme.ghostBorder,
      borderRadius: 18,
      borderWidth: 1,
      color: theme.textPrimary,
      fontSize: 15,
      lineHeight: 21,
      minHeight: 110,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    themePlaceholder: {
      color: theme.placeholder,
    },
    iconUtilityButton: {
      alignItems: 'center',
      backgroundColor: `${theme.surfaceHigh}f2`,
      borderColor: theme.ghostBorder,
      borderRadius: 999,
      borderWidth: 1,
      height: 44,
      justifyContent: 'center',
      minWidth: 44,
      paddingHorizontal: 14,
    },
    iconUtilityButtonText: {
      color: theme.blueSoft,
      fontSize: 18,
      fontWeight: '700',
      lineHeight: 20,
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
    reminderOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'flex-end',
      padding: 20,
      zIndex: 20,
    },
    reminderOverlayBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(3, 8, 18, 0.72)',
    },
    reminderCard: {
      backgroundColor: theme.surface,
      borderColor: `${theme.blue}42`,
      borderRadius: 24,
      borderWidth: 1,
      padding: 20,
      shadowColor: theme.blue,
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.24,
      shadowRadius: 26,
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
    questCardDueSoon: {
      borderColor: `${theme.amber}55`,
      shadowColor: theme.amber,
      shadowOpacity: 0.14,
    },
    questCardOverdue: {
      borderColor: `${theme.blue}55`,
      shadowColor: theme.blue,
      shadowOpacity: 0.16,
    },
    questHeaderRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
    },
    questHeaderActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
      marginLeft: 12,
    },
    expandChevronButton: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 26,
      minWidth: 26,
    },
    expandChevronIcon: {
      color: theme.blueSoft,
      fontSize: 18,
      fontWeight: '700',
    },
    questTitle: {
      color: theme.textPrimary,
      flex: 1,
      fontSize: 18,
      fontWeight: '700',
      lineHeight: 24,
    },
    questCardHint: {
      color: theme.textMuted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 12,
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
    calendarWeekRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    calendarWeekday: {
      color: theme.textMuted,
      flex: 1,
      fontSize: 12,
      fontWeight: '700',
      textAlign: 'center',
      textTransform: 'uppercase',
    },
    calendarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    calendarDay: {
      alignItems: 'center',
      backgroundColor: theme.surfaceLow,
      borderColor: theme.ghostBorder,
      borderRadius: 16,
      borderWidth: 1,
      height: 42,
      justifyContent: 'center',
      width: '13%',
    },
    calendarDayActive: {
      backgroundColor: `${theme.blue}22`,
      borderColor: `${theme.blue}55`,
    },
    calendarDayToday: {
      borderColor: theme.amber,
      shadowColor: theme.amber,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.18,
      shadowRadius: 10,
    },
    calendarDayText: {
      color: theme.textMuted,
      fontSize: 14,
      fontWeight: '600',
    },
    calendarDayTextActive: {
      color: theme.blueSoft,
      fontWeight: '700',
    },
    calendarDayTextToday: {
      color: theme.amberSoft,
    },
    calendarDayEmpty: {
      height: 42,
      width: '13%',
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

























