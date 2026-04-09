import React, { useEffect, useEffectEvent, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  AppState,
  BackHandler,
  type AppStateStatus,
  PanResponder,
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
  createRemoteQuestPoolTemplate,
  deleteRemoteQuest,
  failRemoteQuest,
  fetchRemoteAppConfig,
  fetchRemoteDailySuggestions,
  fetchRemoteGameState,
  fetchRemoteQuestDetails,
  fetchRemoteQuestPool,
  fetchRemoteRealmCodex,
  fetchRemoteThemePalette,
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
} from './src/api/gameStateApi';
import { sendQuestReminderNotification } from './src/notifications/questNotifications';

type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Epic';
type Category = 'Main Quest' | 'Side Quest';
type Status = 'Ready' | 'In Progress' | 'Completed' | 'Failed';
type ScreenName =
  | 'quest-board'
  | 'add-quest'
  | 'guild'
  | 'progress'
  | 'history'
  | 'streak'
  | 'quest-pool'
  | 'realm-codex'
  | 'theme-sanctum'
  | 'quest-details';
type PrimaryNavTab = 'quests' | 'forge' | 'guild' | 'profile';
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
type HistoryPeriodFilter = 'All Time' | 'This Month' | 'This Year';
type HistoryStatusFilter = 'All' | 'Completed' | 'Failed';
type ThemeMode = 'dark' | 'light';
type ThemePackId =
  | 'celestial-bazaar'
  | 'moon-garden'
  | 'sunrise-forge'
  | 'arcade-nova'
  | 'royal-tide'
  | 'crimson-vault'
  | 'sunspire'
  | 'verdant-rune';

type Quest = {
  id: string;
  title: string;
  description: string;
  tag: QuestTag;
  dueDate: string | null;
  startedAt: string | null;
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
type QuestPoolTemplate = SuggestedQuest & {
  id: string;
};
type DraftEditorMode = 'quest' | 'quest-pool';

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
  templates: QuestPoolTemplate[];
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
  accentPreviewColor: string;
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
    previewSwatches: string[];
    statusLabel: string;
  }>;
};

type ThemePaletteResponse = {
  themeMode: ThemeMode;
  themePackId: ThemePackId;
  themePalette: ThemePalette;
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

type ThemePresetPalette = {
  background: string;
  surfaceLow: string;
  surface: string;
  surfaceHigh: string;
  surfaceHighest: string;
  textPrimary: string;
  textMuted: string;
  primaryAccent: string;
  primaryAccentSoft: string;
  secondaryAccent: string;
  secondaryAccentSoft: string;
  tertiaryAccent?: string;
  tertiaryAccentSoft?: string;
  success: string;
  border: string;
  subtitle: string;
  placeholder: string;
  buttonText: string;
};

const questForgeThemePresets = {
  celestialBazaar: {
    name: 'Celestial Bazaar',
    dark: {
      background: '#0A1020',
      surfaceLow: '#10182B',
      surface: '#16213A',
      surfaceHigh: '#1D2B47',
      surfaceHighest: '#25365A',
      textPrimary: '#F7F8FC',
      textMuted: '#AEB9CD',
      primaryAccent: '#F4C542',
      primaryAccentSoft: '#5E4918',
      secondaryAccent: '#FF6B6B',
      secondaryAccentSoft: '#4E2227',
      success: '#41D39A',
      border: '#314465',
      subtitle: '#D2D9E7',
      placeholder: '#8391A8',
      buttonText: '#111827',
    },
    light: {
      background: '#F7F9FD',
      surfaceLow: '#EDF2FA',
      surface: '#FFFFFF',
      surfaceHigh: '#FFF4E1',
      surfaceHighest: '#FFE7E7',
      textPrimary: '#1A2236',
      textMuted: '#647188',
      primaryAccent: '#D39A05',
      primaryAccentSoft: '#F7E2A6',
      secondaryAccent: '#E25555',
      secondaryAccentSoft: '#FFD7D7',
      success: '#24A572',
      border: '#D7E0ED',
      subtitle: '#394760',
      placeholder: '#8B97AA',
      buttonText: '#FFFFFF',
    },
  },
  moonGarden: {
    name: 'Moon Garden',
    dark: {
      background: '#0C1316',
      surfaceLow: '#132026',
      surface: '#193039',
      surfaceHigh: '#22404C',
      surfaceHighest: '#2A5260',
      textPrimary: '#F3FAF9',
      textMuted: '#A8C4C0',
      primaryAccent: '#7BE0B8',
      primaryAccentSoft: '#1D4A3D',
      secondaryAccent: '#D98CFF',
      secondaryAccentSoft: '#4B2B5A',
      success: '#9BE15D',
      border: '#335460',
      subtitle: '#D3E7E3',
      placeholder: '#7F9E9A',
      buttonText: '#0E1918',
    },
    light: {
      background: '#F5FBFA',
      surfaceLow: '#E7F3F1',
      surface: '#FFFFFF',
      surfaceHigh: '#EAFBF2',
      surfaceHighest: '#F6EFFF',
      textPrimary: '#1E2E31',
      textMuted: '#62797B',
      primaryAccent: '#2DA878',
      primaryAccentSoft: '#CFF4E4',
      secondaryAccent: '#A95FE0',
      secondaryAccentSoft: '#EEDBFF',
      success: '#6AAF2C',
      border: '#D5E5E4',
      subtitle: '#40585A',
      placeholder: '#8BA0A2',
      buttonText: '#FFFFFF',
    },
  },
  sunriseForge: {
    name: 'Sunrise Forge',
    dark: {
      background: '#16110E',
      surfaceLow: '#221915',
      surface: '#2C211C',
      surfaceHigh: '#382A24',
      surfaceHighest: '#47332B',
      textPrimary: '#FFF7F2',
      textMuted: '#D2B8A8',
      primaryAccent: '#FF8A3D',
      primaryAccentSoft: '#5D311B',
      secondaryAccent: '#FFD166',
      secondaryAccentSoft: '#5A4720',
      success: '#52D273',
      border: '#544037',
      subtitle: '#EACFC0',
      placeholder: '#A88D7F',
      buttonText: '#1C120D',
    },
    light: {
      background: '#FFF8F3',
      surfaceLow: '#FCEDE4',
      surface: '#FFFFFF',
      surfaceHigh: '#FFF0DE',
      surfaceHighest: '#FFF6D9',
      textPrimary: '#3B271F',
      textMuted: '#7A6358',
      primaryAccent: '#E96A1E',
      primaryAccentSoft: '#FFD3BE',
      secondaryAccent: '#D9A100',
      secondaryAccentSoft: '#F8E8B6',
      success: '#2FA65A',
      border: '#EDD9CE',
      subtitle: '#5B4035',
      placeholder: '#9E8579',
      buttonText: '#FFFFFF',
    },
  },
  arcadeNova: {
    name: 'Arcade Nova',
    dark: {
      background: '#0A0D18',
      surfaceLow: '#11162A',
      surface: '#171F38',
      surfaceHigh: '#1F2949',
      surfaceHighest: '#28345D',
      textPrimary: '#F8F9FF',
      textMuted: '#ADB6D4',
      primaryAccent: '#44D1FF',
      primaryAccentSoft: '#183F53',
      secondaryAccent: '#FF4FD8',
      secondaryAccentSoft: '#4C1F49',
      success: '#6BFF95',
      border: '#334264',
      subtitle: '#D7DDF0',
      placeholder: '#818CAD',
      buttonText: '#09121A',
    },
    light: {
      background: '#F7F9FF',
      surfaceLow: '#EDEFFD',
      surface: '#FFFFFF',
      surfaceHigh: '#E7F8FF',
      surfaceHighest: '#FFE8FB',
      textPrimary: '#1B2340',
      textMuted: '#626D8C',
      primaryAccent: '#109DCC',
      primaryAccentSoft: '#CCF3FF',
      secondaryAccent: '#D83AB3',
      secondaryAccentSoft: '#FFD8F5',
      success: '#2EBB63',
      border: '#D9DFF1',
      subtitle: '#37415F',
      placeholder: '#8D98B0',
      buttonText: '#FFFFFF',
    },
  },
  royalTide: {
    name: 'Royal Tide',
    dark: {
      background: '#0B1420',
      surfaceLow: '#122033',
      surface: '#19304A',
      surfaceHigh: '#223C5C',
      surfaceHighest: '#2D4A6E',
      textPrimary: '#F6FAFF',
      textMuted: '#AFC0D0',
      primaryAccent: '#4DB6FF',
      primaryAccentSoft: '#183F5E',
      secondaryAccent: '#C792FF',
      secondaryAccentSoft: '#432B5E',
      success: '#49D6A3',
      border: '#39536F',
      subtitle: '#D7E2EE',
      placeholder: '#8798AB',
      buttonText: '#0C1823',
    },
    light: {
      background: '#F6FAFD',
      surfaceLow: '#EAF1F7',
      surface: '#FFFFFF',
      surfaceHigh: '#E8F5FF',
      surfaceHighest: '#F3EBFF',
      textPrimary: '#203247',
      textMuted: '#677A8E',
      primaryAccent: '#1F94DC',
      primaryAccentSoft: '#D3EEFF',
      secondaryAccent: '#9C63E6',
      secondaryAccentSoft: '#E8D9FF',
      success: '#27A97A',
      border: '#D6E1EA',
      subtitle: '#3E5268',
      placeholder: '#8E9EB0',
      buttonText: '#FFFFFF',
    },
  },
  crimsonVault: {
    name: 'Blood Forge',
    dark: {
      background: '#140B0E',
      surfaceLow: '#1C1115',
      surface: '#26171C',
      surfaceHigh: '#311E25',
      surfaceHighest: '#3D2530',
      textPrimary: '#FFF7F8',
      textMuted: '#D7BBC1',
      subtitle: '#EACFD5',
      placeholder: '#A4878F',
      primaryAccent: '#D63C52',
      primaryAccentSoft: '#5B1D29',
      secondaryAccent: '#D4A63A',
      secondaryAccentSoft: '#574317',
      tertiaryAccent: '#8E2233',
      tertiaryAccentSoft: '#43131D',
      success: '#45C486',
      border: '#563642',
      buttonText: '#FFF8F9',
    },
    light: {
      background: '#FFF8FA',
      surfaceLow: '#FBECEF',
      surface: '#FFFFFF',
      surfaceHigh: '#FFF1E5',
      surfaceHighest: '#F9E3E7',
      textPrimary: '#3A1F26',
      textMuted: '#7C626A',
      subtitle: '#5A3942',
      placeholder: '#9C838A',
      primaryAccent: '#C92B43',
      primaryAccentSoft: '#FFD5DC',
      secondaryAccent: '#B98712',
      secondaryAccentSoft: '#F6E5B9',
      tertiaryAccent: '#9E1F33',
      tertiaryAccentSoft: '#F4CDD4',
      success: '#2FA767',
      border: '#ECD9DE',
      buttonText: '#FFFFFF',
    },
  },
  sunspire: {
    name: 'Sunspire',
    dark: {
      background: '#151109',
      surfaceLow: '#1E1810',
      surface: '#282016',
      surfaceHigh: '#33281B',
      surfaceHighest: '#423322',
      textPrimary: '#FFF9F0',
      textMuted: '#D7C3A4',
      primaryAccent: '#F2C94C',
      primaryAccentSoft: '#624B17',
      secondaryAccent: '#4DB6FF',
      secondaryAccentSoft: '#1A425C',
      success: '#58CC78',
      border: '#5B4930',
      subtitle: '#EADCC2',
      placeholder: '#A89579',
      buttonText: '#1C1408',
    },
    light: {
      background: '#FFFBF3',
      surfaceLow: '#F9F1DE',
      surface: '#FFFFFF',
      surfaceHigh: '#FFF6E2',
      surfaceHighest: '#EAF6FF',
      textPrimary: '#3A2D14',
      textMuted: '#7C6A4E',
      primaryAccent: '#D4A106',
      primaryAccentSoft: '#F8E5A8',
      secondaryAccent: '#1F95D1',
      secondaryAccentSoft: '#D3EEFB',
      success: '#33A85B',
      border: '#EADFC9',
      subtitle: '#5E4A29',
      placeholder: '#9B8A70',
      buttonText: '#FFFFFF',
    },
  },
  verdantRune: {
    name: 'Verdant Rune',
    dark: {
      background: '#09140F',
      surfaceLow: '#102019',
      surface: '#163027',
      surfaceHigh: '#1D3D31',
      surfaceHighest: '#275041',
      textPrimary: '#F4FCF7',
      textMuted: '#B1CCBF',
      primaryAccent: '#3FC17B',
      primaryAccentSoft: '#184631',
      secondaryAccent: '#D9A441',
      secondaryAccentSoft: '#4F3A17',
      success: '#79D956',
      border: '#355747',
      subtitle: '#D5E9DE',
      placeholder: '#85A395',
      buttonText: '#08160F',
    },
    light: {
      background: '#F6FCF8',
      surfaceLow: '#E8F4ED',
      surface: '#FFFFFF',
      surfaceHigh: '#ECFBF2',
      surfaceHighest: '#FFF6E7',
      textPrimary: '#1F342A',
      textMuted: '#637D71',
      primaryAccent: '#239A5B',
      primaryAccentSoft: '#CEF2DD',
      secondaryAccent: '#B78018',
      secondaryAccentSoft: '#F7E7C2',
      success: '#5AB53B',
      border: '#D7E7DE',
      subtitle: '#3F5B4E',
      placeholder: '#8AA194',
      buttonText: '#FFFFFF',
    },
  },
} as const;

function toRgba(hex: string, alpha: number) {
  const normalizedHex = hex.replace('#', '');
  const value =
    normalizedHex.length === 3
      ? normalizedHex
          .split('')
          .map(character => `${character}${character}`)
          .join('')
      : normalizedHex;

  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function getReadableTextColor(
  backgroundHex: string,
  darkText = '#101418',
  lightText = '#FFFFFF',
) {
  const normalizedHex = backgroundHex.replace('#', '');

  if (!/^[\da-fA-F]{6}$/.test(normalizedHex)) {
    return lightText;
  }

  const channels = [0, 2, 4].map(offset =>
    Number.parseInt(normalizedHex.slice(offset, offset + 2), 16) / 255,
  );
  const [red, green, blue] = channels.map(channel =>
    channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4),
  );
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;

  return luminance > 0.52 ? darkText : lightText;
}

function buildThemePaletteFromPreset(presetPalette: ThemePresetPalette): ThemePalette {
  return {
    background: presetPalette.background,
    surfaceLow: presetPalette.surfaceLow,
    surface: presetPalette.surface,
    surfaceHigh: presetPalette.surfaceHigh,
    surfaceHighest: presetPalette.surfaceHighest,
    textPrimary: presetPalette.textPrimary,
    textMuted: presetPalette.textMuted,
    amber: presetPalette.primaryAccent,
    amberSoft: presetPalette.primaryAccentSoft,
    blue: presetPalette.secondaryAccent,
    blueSoft: presetPalette.secondaryAccentSoft,
    success: presetPalette.success,
    ghostBorder: presetPalette.border,
    subtitle: presetPalette.subtitle,
    placeholder: presetPalette.placeholder,
    buttonText: presetPalette.buttonText,
    buttonDisabled: presetPalette.surfaceHighest,
    activeBadgeBackground: presetPalette.secondaryAccentSoft,
    doneBadgeBackground: toRgba(presetPalette.success, 0.16),
  };
}

const themePackPalettes: Record<ThemePackId, Record<ThemeMode, ThemePalette>> = {
  'celestial-bazaar': {
    dark: buildThemePaletteFromPreset(questForgeThemePresets.celestialBazaar.dark),
    light: buildThemePaletteFromPreset(questForgeThemePresets.celestialBazaar.light),
  },
  'moon-garden': {
    dark: buildThemePaletteFromPreset(questForgeThemePresets.moonGarden.dark),
    light: buildThemePaletteFromPreset(questForgeThemePresets.moonGarden.light),
  },
  'sunrise-forge': {
    dark: buildThemePaletteFromPreset(questForgeThemePresets.sunriseForge.dark),
    light: buildThemePaletteFromPreset(questForgeThemePresets.sunriseForge.light),
  },
  'arcade-nova': {
    dark: buildThemePaletteFromPreset(questForgeThemePresets.arcadeNova.dark),
    light: buildThemePaletteFromPreset(questForgeThemePresets.arcadeNova.light),
  },
  'royal-tide': {
    dark: buildThemePaletteFromPreset(questForgeThemePresets.royalTide.dark),
    light: buildThemePaletteFromPreset(questForgeThemePresets.royalTide.light),
  },
  'crimson-vault': {
    dark: buildThemePaletteFromPreset(questForgeThemePresets.crimsonVault.dark),
    light: buildThemePaletteFromPreset(questForgeThemePresets.crimsonVault.light),
  },
  sunspire: {
    dark: buildThemePaletteFromPreset(questForgeThemePresets.sunspire.dark),
    light: buildThemePaletteFromPreset(questForgeThemePresets.sunspire.light),
  },
  'verdant-rune': {
    dark: buildThemePaletteFromPreset(questForgeThemePresets.verdantRune.dark),
    light: buildThemePaletteFromPreset(questForgeThemePresets.verdantRune.light),
  },
};

const themePackPreviewSwatches: Record<ThemePackId, string[]> = {
  'celestial-bazaar': ['#F4C542', '#FF6B6B', '#16213A'],
  'moon-garden': ['#7BE0B8', '#D98CFF', '#193039'],
  'sunrise-forge': ['#FF8A3D', '#FFD166', '#2C211C'],
  'arcade-nova': ['#44D1FF', '#FF4FD8', '#171F38'],
  'royal-tide': ['#4DB6FF', '#C792FF', '#19304A'],
  'crimson-vault': ['#D63C52', '#D4A63A', '#8E2233'],
  sunspire: ['#F2C94C', '#4DB6FF', '#282016'],
  'verdant-rune': ['#3FC17B', '#D7A6FF', '#163027'],
};

function normalizeThemePackId(themePackId: string | undefined): ThemePackId {
  if (
    themePackId === 'moon-garden' ||
    themePackId === 'sunrise-forge' ||
    themePackId === 'arcade-nova' ||
    themePackId === 'royal-tide' ||
    themePackId === 'crimson-vault' ||
    themePackId === 'sunspire' ||
    themePackId === 'verdant-rune'
  ) {
    return themePackId;
  }

  return 'celestial-bazaar';
}

function getThemePalette(
  themeMode: ThemeMode,
  themePackId: ThemePackId,
): ThemePalette {
  return themePackPalettes[normalizeThemePackId(themePackId)][themeMode];
}

function getFallbackThemePreviewSwatches(themePackId: ThemePackId) {
  return themePackPreviewSwatches[normalizeThemePackId(themePackId)];
}

function normalizeThemeSanctumResponse(
  themeSanctum: ThemeSanctumResponse,
): ThemeSanctumResponse {
  const availableThemePacks = (themeSanctum.availableThemePacks ?? []).map(themePack => ({
    ...themePack,
    previewSwatches:
      Array.isArray(themePack.previewSwatches) && themePack.previewSwatches.length > 0
        ? themePack.previewSwatches
        : getFallbackThemePreviewSwatches(themePack.id),
  }));
  const currentThemePack =
    availableThemePacks.find(themePack => themePack.statusLabel === 'Current') ?? null;

  return {
    ...themeSanctum,
    accentPreviewColor:
      themeSanctum.accentPreviewColor ||
      currentThemePack?.previewSwatches[0] ||
      '#F4C542',
    availableThemePacks,
  };
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
const historyPeriodOptions: HistoryPeriodFilter[] = [
  'All Time',
  'This Month',
  'This Year',
];
const historyStatusOptions: Exclude<HistoryStatusFilter, 'All'>[] = [
  'Completed',
  'Failed',
];
const primaryScreenOrder: ScreenName[] = [
  'quest-board',
  'add-quest',
  'guild',
  'progress',
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
    startedAt: null,
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
    startedAt: null,
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
    startedAt: null,
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
      'Complete a short workout or movement session to keep momentum alive.',
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
      nextRankMinimumXp: xp,
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
    nextRankMinimumXp: nextRank.minimumXp,
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

function normalizeStartedAt(startedAt: string | null | undefined) {
  return normalizeDueDate(startedAt);
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

function formatArchiveDateLabel(resolvedDate: string | null | undefined) {
  const normalizedResolvedDate = normalizeResolvedDate(resolvedDate);

  if (!normalizedResolvedDate) {
    return 'Unknown';
  }

  const parsedDate = parseDateKey(normalizedResolvedDate);

  if (parsedDate) {
    return parsedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  const resolvedMoment = new Date(normalizedResolvedDate);

  if (Number.isNaN(resolvedMoment.getTime())) {
    return normalizedResolvedDate;
  }

  return resolvedMoment.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatArchiveGroupLabel(resolvedDate: string | null | undefined) {
  const normalizedResolvedDate = normalizeResolvedDate(resolvedDate);

  if (!normalizedResolvedDate) {
    return 'Unknown Archive';
  }

  const parsedDate = parseDateKey(normalizedResolvedDate);

  if (parsedDate) {
    return parsedDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }

  const resolvedMoment = new Date(normalizedResolvedDate);

  if (Number.isNaN(resolvedMoment.getTime())) {
    return 'Unknown Archive';
  }

  return resolvedMoment.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function getQuestReminderLeadTimeMs(
  quest: Pick<Quest, 'dueDate'> &
    Partial<Pick<Quest, 'startedAt' | 'createdAt'>>,
) {
  const dueMoment = parseDueMoment(quest.dueDate);

  if (!dueMoment || dueMoment.isDateOnly) {
    return null;
  }

  const startedAt = normalizeStartedAt(quest.startedAt);
  const referenceTimeMs = startedAt
    ? new Date(startedAt).getTime()
    : typeof quest.createdAt === 'number'
      ? quest.createdAt
      : Date.now();
  const totalDurationMs = Math.max(
    dueMoment.date.getTime() - referenceTimeMs,
    0,
  );

  if (totalDurationMs <= 4 * 60 * 60 * 1000) {
    return 30 * 60 * 1000;
  }

  if (totalDurationMs <= 24 * 60 * 60 * 1000) {
    return 60 * 60 * 1000;
  }

  if (totalDurationMs <= 3 * DAY_IN_MS) {
    return 2 * 60 * 60 * 1000;
  }

  return 4 * 60 * 60 * 1000;
}

function getQuestDueStateLabel(
  quest: Pick<Quest, 'status' | 'dueDate'> &
    Partial<Pick<Quest, 'startedAt' | 'createdAt'>>,
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

  const reminderLeadTimeMs = getQuestReminderLeadTimeMs(quest);

  if (
    reminderLeadTimeMs !== null &&
    dueTimeDifferenceMs <= reminderLeadTimeMs
  ) {
    return 'Due Soon';
  }

  if (getDateKey(dueMoment.date) === todayKey) {
    return 'Due Today';
  }

  return 'Upcoming';
}

function getQuestDueDetails(
  quest: Pick<Quest, 'status' | 'dueDate'> &
    Partial<Pick<Quest, 'startedAt' | 'createdAt'>>,
) {
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
    startedAt:
      normalizedStatus === 'In Progress'
        ? normalizeStartedAt(quest.startedAt) ??
          new Date(
            typeof quest.createdAt === 'number' ? quest.createdAt : Date.now(),
          ).toISOString()
        : normalizeStartedAt(quest.startedAt),
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
    themePackId: 'celestial-bazaar',
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
    themePackId: 'celestial-bazaar',
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
    return 'Quest Complete';
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
  if (historyPeriodFilter === 'All Time') {
    return resolvedDate !== null;
  }

  if (!resolvedDate) {
    return false;
  }

  const todayDate = parseDateKey(todayKey);
  const resolvedDay = parseDateKey(resolvedDate);

  if (!todayDate || !resolvedDay) {
    return false;
  }

  if (historyPeriodFilter === 'This Month') {
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
  streakDateKeys: string[] = [],
  referenceDate = new Date(),
  todayDate = new Date(),
) {
  const year = referenceDate.getFullYear();
  const monthIndex = referenceDate.getMonth();
  const firstOfMonth = new Date(year, monthIndex, 1);
  const previousMonthDate = new Date(year, monthIndex, 0);
  const previousMonthDayCount = previousMonthDate.getDate();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leadingEmptyDays = firstOfMonth.getDay();
  const activeDateSet = new Set(activeDateKeys);
  const streakDateSet = new Set(streakDateKeys);
  const todayKey = getDateKey(todayDate);
  const calendarDays: Array<{
    dayNumber: number;
    dateKey: string;
    isActive: boolean;
    isMomentum: boolean;
    isToday: boolean;
    isCurrentMonth: boolean;
  }> = [];

  for (let index = leadingEmptyDays - 1; index >= 0; index -= 1) {
    const dayNumber = previousMonthDayCount - index;
    const dateKey = getDateKey(new Date(year, monthIndex - 1, dayNumber));

    calendarDays.push({
      dayNumber,
      dateKey,
      isActive: activeDateSet.has(dateKey),
      isMomentum: streakDateSet.has(dateKey),
      isToday: dateKey === todayKey,
      isCurrentMonth: false,
    });
  }

  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber += 1) {
    const dateKey = getDateKey(new Date(year, monthIndex, dayNumber));

    calendarDays.push({
      dayNumber,
      dateKey,
      isActive: activeDateSet.has(dateKey),
      isMomentum: streakDateSet.has(dateKey),
      isToday: dateKey === todayKey,
      isCurrentMonth: true,
    });
  }

  let trailingDayNumber = 1;

  while (calendarDays.length % 7 !== 0 || calendarDays.length < 35) {
    const dateKey = getDateKey(new Date(year, monthIndex + 1, trailingDayNumber));

    calendarDays.push({
      dayNumber: trailingDayNumber,
      dateKey,
      isActive: activeDateSet.has(dateKey),
      isMomentum: streakDateSet.has(dateKey),
      isToday: dateKey === todayKey,
      isCurrentMonth: false,
    });
    trailingDayNumber += 1;
  }

  return calendarDays;
}

function getCurrentStreakDateKeys(hero: HeroProgress) {
  if (!hero.lastCompletedDate) {
    return [];
  }

  const sortedActiveDateKeys = normalizeActiveDateKeys(hero.activeDateKeys);

  if (!sortedActiveDateKeys.includes(hero.lastCompletedDate)) {
    return [];
  }

  const streakDateKeys: string[] = [];
  let currentDateKey = hero.lastCompletedDate;

  while (sortedActiveDateKeys.includes(currentDateKey)) {
    streakDateKeys.unshift(currentDateKey);
    const previousDate = parseDateKey(currentDateKey);

    if (!previousDate) {
      break;
    }

    previousDate.setDate(previousDate.getDate() - 1);
    currentDateKey = getDateKey(previousDate);
  }

  return streakDateKeys;
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
      onPress={onToggleTheme}
      style={styles.secondaryActionButton}
      testID="theme-toggle-button">
      <Text style={styles.secondaryActionText}>
        {nextThemeIcon ? nextThemeLabel : nextThemeLabel}
      </Text>
    </Pressable>
  );
}

function getActivePrimaryNavTab(screenName: ScreenName): PrimaryNavTab {
  if (screenName === 'add-quest') {
    return 'forge';
  }

  if (screenName === 'guild') {
    return 'guild';
  }

  if (
    screenName === 'progress' ||
    screenName === 'history' ||
    screenName === 'realm-codex' ||
    screenName === 'theme-sanctum' ||
    screenName === 'streak'
  ) {
    return 'profile';
  }

  return 'quests';
}

function getProfileBackTarget(screenName: ScreenName) {
  if (
    screenName === 'history' ||
    screenName === 'realm-codex' ||
    screenName === 'theme-sanctum' ||
    screenName === 'streak'
  ) {
    return 'progress';
  }

  return null;
}

function getAdjacentPrimaryScreen(
  currentScreen: ScreenName,
  direction: 'next' | 'previous',
) {
  const currentScreenIndex = primaryScreenOrder.indexOf(currentScreen);

  if (currentScreenIndex === -1) {
    return null;
  }

  const offset = direction === 'next' ? 1 : -1;
  const nextScreen = primaryScreenOrder[currentScreenIndex + offset];

  return nextScreen ?? null;
}

function BottomNavigationBar({
  activeTab,
  onNavigateToForge,
  onNavigateToGuild,
  onNavigateToProfile,
  onNavigateToQuests,
  styles,
}: {
  activeTab: PrimaryNavTab;
  onNavigateToForge: () => void;
  onNavigateToGuild: () => void;
  onNavigateToProfile: () => void;
  onNavigateToQuests: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const navItems: Array<{
    glyph: string;
    id: PrimaryNavTab;
    label: string;
    onPress: () => void;
  }> = [
    {
      glyph: 'Q',
      id: 'quests',
      label: 'Quests',
      onPress: onNavigateToQuests,
    },
    {
      glyph: 'F',
      id: 'forge',
      label: 'Forge',
      onPress: onNavigateToForge,
    },
    {
      glyph: 'G',
      id: 'guild',
      label: 'Guild',
      onPress: onNavigateToGuild,
    },
    {
      glyph: 'P',
      id: 'profile',
      label: 'Profile',
      onPress: onNavigateToProfile,
    },
  ];

  return (
    <View pointerEvents="box-none" style={styles.bottomNavShell}>
      <View style={styles.bottomNavBar}>
        {navItems.map(item => {
          const isActive = item.id === activeTab;

          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              onPress={item.onPress}
              style={[
                styles.bottomNavItem,
                isActive && styles.bottomNavItemActive,
              ]}
              testID={`bottom-nav-${item.id}`}>
              <Text
                style={[
                  styles.bottomNavGlyph,
                  isActive && styles.bottomNavGlyphActive,
                ]}>
                {item.glyph}
              </Text>
              <Text
                style={[
                  styles.bottomNavLabel,
                  isActive && styles.bottomNavLabelActive,
                ]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function getQuestDetailComponents(questDetails: QuestDetailsResponse) {
  const paceGuidance =
    questDetails.difficultyLabel === 'Epic'
      ? 'Break the quest into clear milestones'
      : questDetails.difficultyLabel === 'Hard'
        ? 'Protect a deep focus block'
        : questDetails.difficultyLabel === 'Medium'
          ? 'Keep one strong visible outcome'
          : 'Use it as a quick momentum win';
  const routeGuidance =
    questDetails.categoryLabel === 'Main Quest'
      ? 'Treat it as the main path for today'
      : 'Keep it as a lighter supporting objective';

  return [
    `${questDetails.tagLabel} focus anchor`,
    routeGuidance,
    paceGuidance,
  ];
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
  onFail,
  onEdit,
  onOpenDetails,
  onToggleExpand,
}: {
  quest: Quest;
  isExpanded: boolean;
  styles: ReturnType<typeof createStyles>;
  onPrimaryAction?: (questId: string) => void;
  onFail?: (questId: string) => void;
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
      <View style={styles.questCardTopRow}>
        <View style={styles.questArtTile}>
          <View style={styles.questArtShapePrimary} />
          <View style={styles.questArtShapeSecondary} />
          <View style={styles.questArtShapeAccent} />
        </View>
        <View style={styles.questHeaderMeta}>
          <View style={styles.questHeaderRow}>
            <Text style={styles.questCategoryLine}>{quest.category}</Text>
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
                    {isExpanded ? '^' : 'v'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
          <Text style={styles.questTitle}>{quest.title}</Text>
          <View style={styles.questRewardRow}>
            <View style={styles.questRewardBadge}>
              <Text style={styles.questRewardText}>{`+${quest.xpReward} XP`}</Text>
            </View>
            <Text style={styles.questMiniMetaText}>{quest.difficulty}</Text>
          </View>
        </View>
      </View>

      <View style={styles.questCardTimelineRow}>
        <Text style={styles.questTimelineText}>{dueDetails.dueDateLabel}</Text>
        <Text
          style={[
            styles.questTimelineState,
            dueDetails.isUrgent ? styles.questTimelineStateUrgent : null,
          ]}>
          {dueDetails.dueStateLabel}
        </Text>
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

          {onEdit || onFail ? (
            <View style={styles.questCardActionRow}>
              {onEdit ? (
                <Pressable
                  onPress={event => {
                    event.stopPropagation();
                    onEdit(quest.id);
                  }}
                  style={[styles.cardSecondaryButton, styles.questCardInlineAction]}
                  testID={`edit-quest-${quest.id}`}>
                  <Text style={styles.cardSecondaryButtonText}>Edit Quest</Text>
                </Pressable>
              ) : null}
              {onFail ? (
                <Pressable
                  onPress={event => {
                    event.stopPropagation();
                    onFail(quest.id);
                  }}
                  style={[styles.inlineDangerButton, styles.questCardInlineAction]}
                  testID={`fail-quest-${quest.id}`}>
                  <Text style={styles.inlineDangerButtonText}>Mark Failed</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </>
      ) : null}
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
  onRefreshAppConfig,
  onAddSuggestedQuest,
  onPrimaryQuestAction,
  onFailQuest,
  onEditQuest,
  onOpenQuestDetails,
  onNavigateToAddQuest,
  onNavigateToHistory,
  onNavigateToProgress,
  onNavigateToQuestPool,
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
  onRefreshAppConfig: () => void;
  onAddSuggestedQuest: (suggestion: SuggestedQuest) => void;
  onPrimaryQuestAction: (questId: string) => void;
  onFailQuest: (questId: string) => void;
  onEditQuest: (questId: string) => void;
  onOpenQuestDetails: (questId: string) => void;
  onNavigateToAddQuest: () => void;
  onNavigateToHistory: () => void;
  onNavigateToProgress: () => void;
  onNavigateToQuestPool: () => void;
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
  const [isSuggestionsExpanded, setIsSuggestionsExpanded] = useState(false);
  const [isGuildHubExpanded, setIsGuildHubExpanded] = useState(false);
  const [collapsedSectionKeys, setCollapsedSectionKeys] = useState<
    Array<'main' | 'side'>
  >([]);
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
  const handleToggleSection = (sectionKey: 'main' | 'side') => {
    setCollapsedSectionKeys(currentCollapsedSectionKeys =>
      currentCollapsedSectionKeys.includes(sectionKey)
        ? currentCollapsedSectionKeys.filter(
            currentSectionKey => currentSectionKey !== sectionKey,
          )
        : [...currentCollapsedSectionKeys, sectionKey],
    );
  };
  const questSections: Array<{
    key: 'main' | 'side';
    quests: Quest[];
    title: string;
  }> = appConfig.questSectionOrder
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
        </View>
      </View>

      <Text style={styles.subtitle}>{appConfig.boardSubtitle}</Text>

      <View style={styles.heroCard}>
        <Pressable
          onPress={onNavigateToProgress}
          style={styles.heroOverviewPressable}
          testID="hero-overview-button">
          <View style={styles.boardRankHeader}>
            <View>
              <Text style={styles.heroEyebrow}>Current Rank</Text>
              <Text style={styles.boardRankTitle}>{hero.rankTitle}</Text>
            </View>
          </View>

          <View style={styles.boardRankMetaRow}>
            <View style={styles.boardLevelChip}>
              <Text style={styles.boardLevelChipText}>
                Level {getLevelForXp(hero.xp)}
              </Text>
            </View>
            <Text style={styles.boardRankXpText}>
              {`${hero.xp} / ${rankProgress.nextRankMinimumXp} XP`}
            </Text>
          </View>

          <View style={styles.boardRankProgressHeader}>
            <Text style={styles.boardRankProgressLabel}>
              {`Progress to ${rankProgress.nextRankTitle}`}
            </Text>
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
          <Pressable
            onPress={() => setIsSuggestionsExpanded(expanded => !expanded)}
            style={styles.sectionHeaderRow}
            testID="toggle-suggestions-panel">
            <View style={styles.sectionHeaderCopy}>
              <Text style={styles.sectionTitle}>{appConfig.suggestionSectionTitle}</Text>
              <Text style={styles.formHint}>
                {dailySuggestions.length} ready for {dailySuggestionDateKey}
              </Text>
            </View>
            <Text style={styles.expandChevronIcon}>
              {isSuggestionsExpanded ? '^' : 'v'}
            </Text>
          </Pressable>

          {isSuggestionsExpanded ? (
            <>
              <Text style={styles.formIntro}>
                Fresh quest ideas picked for today&apos;s momentum.
              </Text>

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
                    Your current quest log already covers the saved quest pool.
                  </Text>
                </View>
              )}
            </>
          ) : null}
        </View>
      ) : null}


        <View style={styles.boardActionCard}>
          <Pressable
            onPress={() => setIsGuildHubExpanded(expanded => !expanded)}
            style={styles.sectionHeaderRow}
            testID="toggle-guild-hub-panel">
            <View style={styles.sectionHeaderCopy}>
              <Text style={styles.sectionTitle}>{appConfig.addQuestSectionTitle}</Text>
              <Text style={styles.formHint}>
                Quest Forge, Profile, Quest Pool, and realm tools.
              </Text>
            </View>
            <Text style={styles.expandChevronIcon}>
              {isGuildHubExpanded ? '^' : 'v'}
            </Text>
          </Pressable>
          {isGuildHubExpanded ? (
            <>
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
            </>
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
          <Pressable
            onPress={() => handleToggleSection(section.key)}
            style={styles.sectionHeaderRow}
            testID={`toggle-board-section-${section.key}`}>
            <View style={styles.questSectionHeader}>
              <View style={styles.questSectionSignal} />
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <Text style={styles.expandChevronIcon}>
              {collapsedSectionKeys.includes(section.key) ? 'v' : '^'}
            </Text>
          </Pressable>
          {collapsedSectionKeys.includes(section.key)
            ? null
            : section.quests.map(quest => (
                <QuestCard
                  key={quest.id}
                  isExpanded={expandedQuestIds.includes(quest.id)}
                  onFail={onFailQuest}
                  onPrimaryAction={onPrimaryQuestAction}
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
  onNavigateToHistory,
  onNavigateToRealmCodex,
  onNavigateToStreak,
  onNavigateToThemeSanctum,
  onResetJourney,
  onToggleTheme,
  styles,
  themeMode,
}: {
  appConfig: AppConfig;
  hero: HeroProgress;
  quests: Quest[];
  unlockedAchievementIds: AchievementId[];
  onNavigateToHistory: () => void;
  onNavigateToRealmCodex: () => void;
  onNavigateToStreak: () => void;
  onNavigateToThemeSanctum: () => void;
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
      <Text style={styles.title}>{appConfig.progressTitle}</Text>
      <Text style={styles.subtitle}>
        {hero.rankTitle} of the {favoriteTag} path. Your codex keeps track of
        every quest, streak, and badge you forge.
      </Text>

      <View style={styles.heroCard}>
        <View style={styles.boardRankHeader}>
          <View>
            <Text style={styles.heroEyebrow}>Current Rank</Text>
            <Text style={styles.boardRankTitle}>{hero.rankTitle}</Text>
          </View>
        </View>

        <View style={styles.boardRankMetaRow}>
          <View style={styles.boardLevelChip}>
            <Text style={styles.boardLevelChipText}>
              Level {getLevelForXp(hero.xp)}
            </Text>
          </View>
          <Text style={styles.boardRankXpText}>
            {`${hero.xp} / ${rankProgress.nextRankMinimumXp} XP`}
          </Text>
        </View>

        <View style={styles.boardRankProgressHeader}>
          <Text style={styles.boardRankProgressLabel}>
            {`Progress to ${rankProgress.nextRankTitle}`}
          </Text>
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

        <ThemeToggle
          onToggleTheme={onToggleTheme}
          styles={styles}
          themeMode={themeMode}
        />

        <Pressable
          onPress={onNavigateToHistory}
          style={styles.secondaryActionButton}
          testID="navigate-to-history-screen-from-progress">
          <Text style={styles.secondaryActionText}>Quest History</Text>
        </Pressable>
        <Pressable
          onPress={onNavigateToRealmCodex}
          style={styles.secondaryActionButton}
          testID="navigate-to-realm-codex-from-progress">
          <Text style={styles.secondaryActionText}>Realm Codex</Text>
        </Pressable>
        <Pressable
          onPress={onNavigateToThemeSanctum}
          style={styles.secondaryActionButton}
          testID="navigate-to-theme-sanctum-from-progress">
          <Text style={styles.secondaryActionText}>Theme Sanctum</Text>
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
  onBack: _onBack,
  onRefresh,
  onToggleTheme: _onToggleTheme,
  realmCodex,
  styles,
  themeMode: _themeMode,
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
  onBack: _onBack,
  onRefresh,
  onSelectThemePack,
  onToggleTheme: _onToggleTheme,
  styles,
  themeMode: _themeMode,
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
      <Text style={styles.title}>{themeSanctum.title}</Text>
      <Text style={styles.subtitle}>{themeSanctum.subtitle}</Text>

      <View style={styles.themeHeroCard}>
        <View style={styles.themeHeroHeader}>
          <View>
            <Text style={styles.heroEyebrow}>Active Theme</Text>
            <Text style={styles.themeHeroTitle}>{themeSanctum.activeThemeLabel}</Text>
          </View>
        </View>

        <View style={styles.themeMetricGrid}>
          <View style={styles.themeMetricCard}>
            <Text style={styles.themeMetricLabel}>Active Mode</Text>
            <Text style={styles.themeMetricValue}>{themeSanctum.activeModeLabel}</Text>
          </View>
          <View style={styles.themeMetricCard}>
            <Text style={styles.themeMetricLabel}>Accent Energy</Text>
            <View style={styles.themeMetricAccentRow}>
              <View
                style={[
                  styles.themeMetricAccentDot,
                  { backgroundColor: themeSanctum.accentPreviewColor },
                ]}
              />
              <Text style={styles.themeMetricValue}>{themeSanctum.accentEnergyLabel}</Text>
            </View>
          </View>
          <View style={styles.themeMetricCard}>
            <Text style={styles.themeMetricLabel}>Surface Tone</Text>
            <Text style={styles.themeMetricValue}>{themeSanctum.surfaceToneLabel}</Text>
          </View>
          <View style={styles.themeMetricCard}>
            <Text style={styles.themeMetricLabel}>Realm Notes</Text>
            <Text style={styles.themeMetricValueCompact}>{themeSanctum.realmNotesLabel}</Text>
          </View>
        </View>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>{themeSanctum.availableEssencesTitle}</Text>
        <Text style={styles.formIntro}>{themeSanctum.availableEssencesIntro}</Text>

        {themeSanctum.availableThemePacks.map(themePack => {
          const isCurrent = themePack.statusLabel === 'Current';

          return (
            <View key={themePack.id} style={styles.themePackRow}>
              <View style={styles.themePackSwatchStack}>
                {themePack.previewSwatches.map((previewSwatch, index) => (
                  <View
                    key={`${themePack.id}-${previewSwatch}-${index}`}
                    style={[
                      styles.themePackSwatch,
                      { backgroundColor: previewSwatch },
                    ]}
                  />
                ))}
              </View>
              <View style={styles.themePackCopy}>
                <Text style={styles.themePackTitle}>{themePack.name}</Text>
                <Text style={styles.themePackSubtitle}>{themePack.description}</Text>
              </View>
              <Pressable
                disabled={isCurrent}
                onPress={() => {
                  if (!isCurrent) {
                    onSelectThemePack(themePack.id);
                  }
                }}
                style={[
                  styles.themePackSelectButton,
                  isCurrent && styles.themePackSelectButtonCurrent,
                ]}
                testID={`select-theme-pack-${themePack.id}`}>
                <Text
                  style={[
                    styles.themePackSelectButtonText,
                    isCurrent && styles.themePackSelectButtonTextCurrent,
                  ]}>
                  {isCurrent ? 'Current' : 'Select'}
                </Text>
              </Pressable>
            </View>
          );
        })}

        <Pressable
          onPress={onRefresh}
          style={styles.secondaryActionButton}
          testID="refresh-theme-sanctum">
          <Text style={styles.secondaryActionText}>
            {isRefreshingThemeSanctum ? 'Refreshing Sanctum...' : 'Refresh Theme Sanctum'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function GuildScreen({
  onToggleTheme: _onToggleTheme,
  styles,
  themeMode: _themeMode,
}: {
  onToggleTheme: () => void;
  styles: ReturnType<typeof createStyles>;
  themeMode: ThemeMode;
}) {
  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Guild Hall</Text>
      <Text style={styles.subtitle}>
        This wing is reserved for future guild systems, teams, and shared
        progress tools.
      </Text>

      <View style={styles.emptyStateCard}>
        <Text style={styles.emptyStateTitle}>Guild features are coming soon</Text>
        <Text style={styles.emptyStateText}>
          For now this tab marks the place where guild members, parties, and
          shared goals will eventually live.
        </Text>
      </View>
    </ScrollView>
  );
}

function HistoryScreen({
  onBack: _onBack,
  onToggleTheme: _onToggleTheme,
  quests,
  styles,
  themeMode: _themeMode,
}: {
  onBack: () => void;
  onToggleTheme: () => void;
  quests: Quest[];
  styles: ReturnType<typeof createStyles>;
  themeMode: ThemeMode;
}) {
  const [historyPeriodFilter, setHistoryPeriodFilter] =
    useState<HistoryPeriodFilter>('All Time');
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
  const historyQuestGroups = filteredHistoryQuests.reduce<
    Array<{ label: string; quests: Quest[] }>
  >((groups, quest) => {
    const groupLabel = formatArchiveGroupLabel(getQuestResolvedDate(quest));
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && lastGroup.label === groupLabel) {
      lastGroup.quests.push(quest);
      return groups;
    }

    groups.push({
      label: groupLabel,
      quests: [quest],
    });

    return groups;
  }, []);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <Text style={[styles.title, styles.historyPageTitle]}>Archive Of The Realm</Text>
      <Text style={styles.subtitle}>
        Review the quests you completed and the ones that slipped away, all in
        one cleaner archive view.
      </Text>

      <View style={styles.historySummaryRow}>
        <View style={[styles.historySummaryCard, styles.historySummaryCardWarm]}>
          <View style={styles.historySummaryAccent} />
          <Text style={styles.historySummaryLabel}>Total Completed</Text>
          <View style={styles.historySummaryValueRow}>
            <Text style={styles.historySummaryValue}>{historyStats.totalCompleted}</Text>
            <Text style={styles.historySummaryGlyph}>*</Text>
          </View>
        </View>
        <View style={[styles.historySummaryCard, styles.historySummaryCardRose]}>
          <View style={[styles.historySummaryAccent, styles.historySummaryAccentRose]} />
          <Text style={styles.historySummaryLabel}>Failed</Text>
          <View style={styles.historySummaryValueRow}>
            <Text style={styles.historySummaryValue}>{historyStats.totalFailed}</Text>
            <Text style={styles.historySummaryGlyph}>x</Text>
          </View>
        </View>
      </View>

      <View style={styles.historyFilterCard}>
        <View style={styles.historySegmentRow}>
          {historyPeriodOptions.map(periodOption => {
            const isSelected = periodOption === historyPeriodFilter;

            return (
              <Pressable
                key={periodOption}
                onPress={() => setHistoryPeriodFilter(periodOption)}
                style={[
                  styles.historySegmentChip,
                  isSelected && styles.historySegmentChipSelected,
                ]}
                testID={`history-period-filter-${periodOption
                  .replace(/\s+/g, '-')
                  .toLowerCase()}`}>
                <Text
                  style={[
                    styles.historySegmentChipText,
                    isSelected && styles.historySegmentChipTextSelected,
                  ]}>
                  {periodOption}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.historySegmentRow}>
          {historyStatusOptions.map(statusOption => {
            const isSelected = statusOption === historyStatusFilter;
            const indicatorStyle =
              statusOption === 'Completed'
                ? styles.historyStatusIndicatorDone
                : styles.historyStatusIndicatorFailed;

            return (
              <Pressable
                key={statusOption}
                onPress={() =>
                  setHistoryStatusFilter(currentFilter =>
                    currentFilter === statusOption ? 'All' : statusOption,
                  )
                }
                style={[
                  styles.historySegmentChip,
                  isSelected && styles.historySegmentChipSelected,
                ]}
                testID={`history-status-filter-${statusOption.toLowerCase()}`}>
                <View style={[styles.historyStatusIndicator, indicatorStyle]} />
                <Text
                  style={[
                    styles.historySegmentChipText,
                    isSelected && styles.historySegmentChipTextSelected,
                  ]}>
                  {statusOption}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {filteredHistoryQuests.length === 0 ? (
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateTitle}>No quests in this archive view</Text>
          <Text style={styles.emptyStateText}>
            Change the time window or outcome filter to widen the ledger.
          </Text>
        </View>
      ) : (
        historyQuestGroups.map(historyQuestGroup => (
          <View
            key={historyQuestGroup.label}
            style={styles.historyGroupSection}>
            <Text style={styles.historyGroupLabel}>{historyQuestGroup.label}</Text>
            {historyQuestGroup.quests.map(quest => {
              const resolvedDate = getQuestResolvedDate(quest) ?? 'Unknown';
              const isCompletedQuest = quest.status === 'Completed';
              const resolvedDateLabel = formatArchiveDateLabel(resolvedDate);

              return (
                <View
                  key={`${quest.id}-${resolvedDate}`}
                  style={styles.historyQuestCard}
                  testID={`history-quest-${quest.id}`}>
                  <View style={styles.historyBadgeRow}>
                    <View style={styles.historyBadgeGroup}>
                      <View style={styles.historyTagBadge}>
                        <Text style={styles.historyTagBadgeText}>{quest.tag}</Text>
                      </View>
                      <View style={styles.historyPathBadge}>
                        <Text style={styles.historyPathBadgeText}>{quest.category}</Text>
                      </View>
                    </View>
                    <View style={styles.historyStatusRail}>
                      <Text style={styles.historyStatusIcon}>
                        {isCompletedQuest ? '*' : '!'}
                      </Text>
                      <Text
                        style={[
                          styles.historyStatusText,
                          isCompletedQuest
                            ? styles.historyStatusTextDone
                            : styles.historyStatusTextFailed,
                        ]}>
                        {quest.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.historyQuestTitle}>{quest.title}</Text>
                  <Text style={styles.historyQuestDescription}>{quest.description}</Text>

                  <View style={styles.historyQuestDivider} />

                  <View style={styles.historyFooterRow}>
                    <View style={styles.historyResolvedRow}>
                      <Text style={styles.historyResolvedIcon}>[]</Text>
                      <Text style={styles.historyResolvedText}>{resolvedDateLabel}</Text>
                    </View>
                    <View style={styles.historyXpBadge}>
                      <Text style={styles.historyXpBadgeText}>
                        {isCompletedQuest ? `+${quest.xpReward} XP` : 'Failed'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ))
      )}
    </ScrollView>
  );
}

function StreakScreen({
  hero,
  onBack: _onBack,
  onToggleTheme: _onToggleTheme,
  styles,
  themeMode: _themeMode,
}: {
  hero: HeroProgress;
  onBack: () => void;
  onToggleTheme: () => void;
  styles: ReturnType<typeof createStyles>;
  themeMode: ThemeMode;
}) {
  const today = new Date();
  const [viewedMonthDate, setViewedMonthDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const currentStreakDateKeys = getCurrentStreakDateKeys(hero);
  const calendarDays = buildCalendarDays(
    hero.activeDateKeys,
    currentStreakDateKeys,
    viewedMonthDate,
    today,
  );
  const bestStreak = getBestStreak(hero.activeDateKeys);
  const activeDaysThisMonth = hero.activeDateKeys.filter(activeDateKey =>
    matchesHistoryPeriod(activeDateKey, 'This Month', getDateKey(viewedMonthDate)),
  ).length;
  const monthLabel = viewedMonthDate.toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
  });
  const handleViewPreviousMonth = () => {
    setViewedMonthDate(currentViewedMonthDate =>
      new Date(
        currentViewedMonthDate.getFullYear(),
        currentViewedMonthDate.getMonth() - 1,
        1,
      ),
    );
  };
  const handleViewNextMonth = () => {
    setViewedMonthDate(currentViewedMonthDate =>
      new Date(
        currentViewedMonthDate.getFullYear(),
        currentViewedMonthDate.getMonth() + 1,
        1,
      ),
    );
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Keep The Flame Alive</Text>
      <Text style={styles.subtitle}>
        Your calendar reveals the rhythm of your questing and the days when you
        kept the guild moving.
      </Text>

      <View style={styles.streakMetricStack}>
        <View style={[styles.streakSpotlightCard, styles.streakSpotlightCardPrimary]}>
          <Text style={styles.streakSpotlightLabel}>Active Momentum</Text>
          <Text style={[styles.streakSpotlightValue, styles.streakSpotlightValuePrimary]}>
            {hero.streakCount} Days
          </Text>
          <Text style={styles.streakSpotlightBody}>
            Your forge is burning bright. Maintain the heat to unlock elder quests.
          </Text>
        </View>
        <View style={styles.streakSpotlightCard}>
          <Text style={styles.streakSpotlightLabel}>Best Streak</Text>
          <Text style={styles.streakSpotlightValue}>{bestStreak} Days</Text>
        </View>
        <View style={styles.streakSpotlightCard}>
          <Text style={styles.streakSpotlightLabel}>Active This Month</Text>
          <Text style={styles.streakSpotlightValue}>{activeDaysThisMonth} Days</Text>
        </View>
      </View>

      <View style={styles.streakCalendarCard}>
        <View style={styles.calendarHeaderRow}>
          <Text style={styles.streakCalendarMonth}>{monthLabel}</Text>
          <View style={styles.calendarNavRow}>
            <Pressable
              onPress={handleViewPreviousMonth}
              style={styles.calendarNavButton}
              testID="streak-calendar-prev-month">
              <Text style={styles.calendarNavButtonText}>{'<'}</Text>
            </Pressable>
            <Pressable
              onPress={handleViewNextMonth}
              style={styles.calendarNavButton}
              testID="streak-calendar-next-month">
              <Text style={styles.calendarNavButtonText}>{'>'}</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.calendarWeekRow}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(weekDay => (
            <Text key={weekDay} style={styles.calendarWeekday}>
              {weekDay}
            </Text>
          ))}
        </View>
        <View style={styles.calendarGrid}>
          {calendarDays.map(calendarDay => (
            <View
              key={calendarDay.dateKey}
              style={[
                styles.calendarDay,
                calendarDay.isCurrentMonth
                  ? styles.calendarDayCurrentMonth
                  : styles.calendarDayOutsideMonth,
                calendarDay.isMomentum && styles.calendarDayMomentum,
                calendarDay.isActive &&
                  !calendarDay.isMomentum &&
                  styles.calendarDayActive,
                calendarDay.isToday && styles.calendarDayToday,
              ]}>
              <Text
                style={[
                  styles.calendarDayText,
                  !calendarDay.isCurrentMonth && styles.calendarDayTextOutsideMonth,
                  calendarDay.isMomentum && styles.calendarDayTextMomentum,
                  calendarDay.isActive &&
                    !calendarDay.isMomentum &&
                    styles.calendarDayTextActive,
                  calendarDay.isToday && styles.calendarDayTextToday,
                ]}>
                {calendarDay.dayNumber}
              </Text>
              {calendarDay.isToday ? (
                <View
                  style={[
                    styles.calendarTodayDot,
                    calendarDay.isActive
                      ? styles.calendarTodayDotActive
                      : styles.calendarTodayDotPassive,
                  ]}
                />
              ) : null}
            </View>
          ))}
        </View>
      </View>

    </ScrollView>
  );
}

function QuestDetailsScreen({
  onBack,
  onPrimaryAction,
  onEdit,
  onFail,
  onToggleTheme: _onToggleTheme,
  questDetails,
  styles,
  themeMode: _themeMode,
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
  const detailComponents = getQuestDetailComponents(questDetails);
  const isResolved =
    questDetails.statusLabel === 'Completed' ||
    questDetails.statusLabel === 'Failed';

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
        <View style={styles.screenHeaderSpacer} />
        <View style={styles.screenHeaderSpacer} />
      </View>

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

        <View style={styles.detailsMetricGrid}>
          <View style={styles.detailsMetricCard}>
            <Text style={styles.detailsMetricLabel}>Difficulty</Text>
            <Text style={styles.detailsMetricValue}>
              {questDetails.difficultyLabel}
            </Text>
          </View>
          <View style={styles.detailsMetricCard}>
            <Text style={styles.detailsMetricLabel}>Reward</Text>
            <Text style={[styles.detailsMetricValue, styles.xpAccent]}>
              {questDetails.xpRewardLabel}
            </Text>
          </View>
        </View>

        <View style={styles.detailsTimelineStrip}>
          <View style={styles.detailsTimelineItem}>
            <Text style={styles.detailsMetricLabel}>Due Date</Text>
            <Text style={styles.detailsTimelineValue}>
              {questDetails.dueDateLabel}
            </Text>
          </View>
          <View style={styles.detailsTimelineItem}>
            <Text style={styles.detailsMetricLabel}>Timeline</Text>
            <Text
              style={[
                styles.detailsTimelineValue,
                questDetails.dueStateLabel === 'Overdue'
                  ? styles.streakAccent
                  : questDetails.dueStateLabel === 'Due Soon' ||
                      questDetails.dueStateLabel === 'Due Today'
                    ? styles.levelAccent
                    : styles.xpAccent,
              ]}>
              {questDetails.dueStateLabel}
            </Text>
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

      <View style={styles.detailsGuidanceCard}>
        <Text style={styles.detailsGuidanceTitle}>{questDetails.guidanceTitle}</Text>
        <Text style={styles.detailsGuidanceText}>{questDetails.guidanceText}</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Quest Components</Text>
        <Text style={styles.formIntro}>
          A cleaner breakdown for starting this quest without losing momentum.
        </Text>
        <View style={styles.detailsComponentList}>
          {detailComponents.map((component, index) => (
            <View key={`${questDetails.questId}-component-${index}`} style={styles.detailsComponentRow}>
              <View style={styles.detailsComponentMarker}>
                <Text style={styles.detailsComponentMarkerText}>{index + 1}</Text>
              </View>
              <Text style={styles.detailsComponentText}>{component}</Text>
            </View>
          ))}
        </View>
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
              {isResolved && questDetails.statusLabel === 'Failed'
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
  editorMode,
  onSave,
  onSaveToPool,
  onDelete,
  poolTemplateToEdit,
  questToEdit,
  onToggleTheme: _onToggleTheme,
  styles,
  themeMode: _themeMode,
}: {
  editorMode: DraftEditorMode;
  onSave: (questDraft: QuestDraft) => void;
  onSaveToPool: (questDraft: QuestDraft) => void;
  onDelete: (questId: string) => void;
  poolTemplateToEdit: QuestPoolTemplate | null;
  questToEdit: Quest | null;
  onToggleTheme: () => void;
  styles: ReturnType<typeof createStyles>;
  themeMode: ThemeMode;
}) {
  const isEditingQuest = questToEdit !== null;
  const isEditingPoolTemplate = poolTemplateToEdit !== null;
  const activeDraftSource = questToEdit ?? poolTemplateToEdit;
  const [questTitle, setQuestTitle] = useState('');
  const [questDescription, setQuestDescription] = useState('');
  const [questDueDate, setQuestDueDate] = useState('');
  const [selectedTag, setSelectedTag] = useState<QuestTag>('General');
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty>('Easy');
  const [selectedCategory, setSelectedCategory] =
    useState<Category>('Side Quest');

  useEffect(() => {
    if (activeDraftSource) {
      setQuestTitle(activeDraftSource.title);
      setQuestDescription(activeDraftSource.description ?? '');
      setQuestDueDate(activeDraftSource.dueDate ?? '');
      setSelectedTag(activeDraftSource.tag ?? 'General');
      setSelectedDifficulty(activeDraftSource.difficulty);
      setSelectedCategory(activeDraftSource.category);
      return;
    }

    setQuestTitle('');
    setQuestDescription('');
    setQuestDueDate('');
    setSelectedTag('General');
    setSelectedDifficulty('Easy');
    setSelectedCategory('Side Quest');
  }, [activeDraftSource]);

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

  const handleSaveTemplate = () => {
    const title = questTitle.trim();

    if (!title) {
      return;
    }

    onSaveToPool({
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
      <Text style={styles.title}>
        {editorMode === 'quest-pool'
          ? isEditingPoolTemplate
            ? 'Refine Saved Template'
            : 'Forge A Reusable Template'
          : isEditingQuest
            ? 'Refine Quest Details'
            : 'Shape Your Next Quest'}
      </Text>
      <Text style={styles.subtitle}>
        {editorMode === 'quest-pool'
          ? 'Edit reusable templates that can be added to the board whenever you need them.'
          : isEditingQuest
            ? 'Update the quest and send the changes back to the Quest Board instantly.'
            : 'Create a new mission and send it back to the Quest Board instantly.'}
      </Text>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Quest Details</Text>
        <Text style={styles.formIntro}>
          {editorMode === 'quest-pool'
            ? 'Use this screen to keep your reusable quest templates clean, practical, and easy to drop into the board.'
            : isEditingQuest
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
          onPress={editorMode === 'quest-pool' ? handleSaveTemplate : handleSaveQuest}
          style={[
            styles.saveButton,
            !canSaveQuest && styles.saveButtonDisabled,
          ]}
          testID="save-quest-button">
          <Text style={styles.saveButtonText}>
            {editorMode === 'quest-pool'
              ? isEditingPoolTemplate
                ? 'Save Template'
                : 'Add To Quest Pool'
              : isEditingQuest
                ? 'Save Changes'
                : 'Save Quest'}
          </Text>
        </Pressable>

        {editorMode === 'quest' && !isEditingQuest ? (
          <Pressable
            disabled={!canSaveQuest}
            onPress={handleSaveTemplate}
            style={[
              styles.secondaryActionButton,
              !canSaveQuest && styles.saveButtonDisabled,
            ]}
            testID="save-to-quest-pool-button">
            <Text style={styles.secondaryActionText}>Save To Quest Pool</Text>
          </Pressable>
        ) : null}

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
  onEditTemplate,
  onRefresh,
  onResetDefaults,
  onToggleTheme: _onToggleTheme,
  questPool,
  styles,
  themeMode: _themeMode,
}: {
  isRefreshingQuestPool: boolean;
  onAddTemplate: (template: SuggestedQuest, category: Category) => void;
  onBack: () => void;
  onEditTemplate: (templateId: string) => void;
  onRefresh: () => void;
  onResetDefaults: () => void;
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
        <View style={styles.screenHeaderSpacer} />
        <View style={styles.screenHeaderSpacer} />
      </View>

      <Text style={styles.title}>{questPool.title}</Text>
      <Text style={styles.subtitle}>{questPool.subtitle}</Text>

      <View style={styles.questPoolToolbar}>
        <View style={styles.questPoolHeaderRow}>
          <View style={styles.filterHeaderActions}>
            <Pressable
              onPress={onResetDefaults}
              style={styles.inlineUtilityButton}
              testID="reset-quest-pool-defaults">
              <Text style={styles.inlineUtilityButtonText}>Reset Defaults</Text>
            </Pressable>
            <Pressable
              onPress={onRefresh}
              style={styles.inlineUtilityButton}
              testID="refresh-quest-pool">
              <Text style={styles.inlineUtilityButtonText}>
                {isRefreshingQuestPool ? '...' : 'Refresh'}
              </Text>
            </Pressable>
          </View>
        </View>

        <TextInput
          onChangeText={setSearchQuery}
          placeholder={questPool.searchPlaceholder}
          placeholderTextColor={styles.themePlaceholder.color}
          style={styles.questPoolSearchInput}
          testID="quest-pool-search-input"
          value={searchQuery}
        />

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
              style={styles.questPoolCompactCard}
              testID={`quest-pool-card-${index}`}>
              <View style={styles.questPoolCompactHeader}>
                <View style={styles.questPoolCompactHeaderRow}>
                  <View style={styles.questPoolCompactTagBadge}>
                    <Text style={styles.questPoolCompactTagText}>{template.tag}</Text>
                  </View>
                  <View style={styles.questPoolCompactDifficultyBadge}>
                    <Text style={styles.questPoolCompactDifficultyText}>
                      {template.difficulty}
                    </Text>
                  </View>
                </View>
                <Text style={styles.questPoolCompactTitle}>{template.title}</Text>
                <Text numberOfLines={2} style={styles.questPoolCompactDescription}>
                  {template.description}
                </Text>
              </View>

              {template.dueDate ? (
                <Text style={styles.questPoolCompactDueText}>
                  {`${dueDetails.dueDateLabel} ${dueDetails.dueStateLabel}`}
                </Text>
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
              <Pressable
                onPress={() => onEditTemplate(template.id)}
                style={styles.questPoolCompactEditButton}
                testID={`edit-quest-pool-template-${template.id}`}>
                <Text style={styles.questPoolCompactEditButtonText}>Edit Template</Text>
              </Pressable>
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
  const [editingQuestPoolTemplateId, setEditingQuestPoolTemplateId] =
    useState<string | null>(null);
  const [isRefreshingAppConfig, setIsRefreshingAppConfig] = useState(false);
  const [realmCodex, setRealmCodex] = useState<RealmCodexResponse | null>(null);
  const [isRefreshingRealmCodex, setIsRefreshingRealmCodex] = useState(false);
  const [questPool, setQuestPool] = useState<QuestPoolResponse | null>(null);
  const [isRefreshingQuestPool, setIsRefreshingQuestPool] = useState(false);
  const [themeSanctum, setThemeSanctum] = useState<ThemeSanctumResponse | null>(null);
  const [isRefreshingThemeSanctum, setIsRefreshingThemeSanctum] = useState(false);
  const [remoteThemePalette, setRemoteThemePalette] = useState<ThemePalette>(() =>
    getThemePalette('dark', 'celestial-bazaar'),
  );
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

  const currentTheme =
    remoteThemePalette ?? getThemePalette(gameState.themeMode, gameState.themePackId);
  const styles = createStyles(currentTheme);
  const questToEdit =
    editingQuestId === null
      ? null
      : gameState.quests.find(quest => quest.id === editingQuestId) ?? null;
  const questPoolTemplateToEdit =
    editingQuestPoolTemplateId === null
      ? null
      : questPool?.templates.find(
          template => template.id === editingQuestPoolTemplateId,
        ) ?? null;
  const draftEditorMode: DraftEditorMode =
    editingQuestPoolTemplateId !== null ? 'quest-pool' : 'quest';

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
    const normalizedThemeSanctum = normalizeThemeSanctumResponse(nextThemeSanctum);

    setThemeSanctum(normalizedThemeSanctum);

    return normalizedThemeSanctum;
  };

  const applyRemoteThemePalette = (
    nextThemePaletteResponse: ThemePaletteResponse,
  ) => {
    setRemoteThemePalette(nextThemePaletteResponse.themePalette);

    return nextThemePaletteResponse;
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

  const refreshRemoteThemePalette = async () => {
    const nextThemePaletteResponse =
      await fetchRemoteThemePalette<ThemePaletteResponse>();

    applyRemoteThemePalette(nextThemePaletteResponse);

    return nextThemePaletteResponse;
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
      try {
        await refreshRemoteThemePalette();
      } catch {
        setRemoteThemePalette(
          getThemePalette(response.gameState.themeMode, response.gameState.themePackId),
        );
      }
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
        const [
          remoteGameStateResponse,
          remoteAppConfigResponse,
          remoteDailySuggestionsResponse,
        ] = await Promise.all([
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
        try {
          const remoteThemePaletteResponse =
            await fetchRemoteThemePalette<ThemePaletteResponse>();

          applyRemoteThemePalette(remoteThemePaletteResponse);
        } catch {
          setRemoteThemePalette(
            getThemePalette(nextGameState.themeMode, nextGameState.themePackId),
          );
        }
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

  useEffect(() => {
    const hardwareBackSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        const backTarget = getProfileBackTarget(currentScreen);

        if (backTarget) {
          setCurrentScreen(backTarget);
          return true;
        }

        return false;
      },
    );

    return () => {
      hardwareBackSubscription.remove();
    };
  }, [currentScreen]);

  const returnToBoard = () => {
    setEditingQuestId(null);
    setEditingQuestPoolTemplateId(null);
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

  const handleSaveQuestPool = async (questDraft: QuestDraft) => {
    try {
      setBackendError(null);
      const response = editingQuestPoolTemplateId
        ? await updateRemoteQuestPoolTemplate<QuestDraft, QuestPoolResponse>(
            editingQuestPoolTemplateId,
            questDraft,
          )
        : await createRemoteQuestPoolTemplate<QuestDraft, QuestPoolResponse>(
            questDraft,
          );

      applyRemoteQuestPool(response);
      setEditingQuestPoolTemplateId(null);
      if (draftEditorMode === 'quest-pool') {
        setCurrentScreen('quest-pool');
      } else {
        returnToBoard();
      }
    } catch {
      setBackendError(backendUnavailableMessage);
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

  const handleResetQuestPoolDefaults = async () => {
    try {
      setBackendError(null);
      const response = await resetRemoteQuestPool<QuestPoolResponse>();

      applyRemoteQuestPool(response);
      await refreshRemoteDailySuggestions();
    } catch {
      setBackendError(backendUnavailableMessage);
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
    setEditingQuestPoolTemplateId(null);
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
    setEditingQuestPoolTemplateId(null);
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

  const handleEditQuestPoolTemplate = (templateId: string) => {
    setEditingQuestId(null);
    setEditingQuestPoolTemplateId(templateId);
    setCurrentScreen('add-quest');
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
  const activePrimaryNavTab = getActivePrimaryNavTab(currentScreen);
  const primaryScreenPanResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) =>
      primaryScreenOrder.includes(currentScreen) &&
      Math.abs(gestureState.dx) > 18 &&
      Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
    onPanResponderRelease: (_, gestureState) => {
      if (
        !primaryScreenOrder.includes(currentScreen) ||
        Math.abs(gestureState.dx) < 72 ||
        Math.abs(gestureState.dx) <= Math.abs(gestureState.dy)
      ) {
        return;
      }

      const nextScreen = getAdjacentPrimaryScreen(
        currentScreen,
        gestureState.dx < 0 ? 'next' : 'previous',
      );

      if (nextScreen) {
        setCurrentScreen(nextScreen);
      }
    },
  });

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
                <View
                  style={styles.primaryScreenShell}
                  testID="primary-screen-shell"
                  {...primaryScreenPanResponder.panHandlers}>
                  <QuestBoardScreen
                    appConfig={appConfig}
                    completionFeedback={completionFeedback}
                    dailySuggestionDateKey={dailySuggestionDateKey}
                    dailySuggestions={dailySuggestions}
                    hero={gameState.hero}
                    isRefreshingAppConfig={isRefreshingAppConfig}
                    onAddSuggestedQuest={handleAddSuggestedQuest}
                    onPrimaryQuestAction={handleQuestPrimaryAction}
                    onFailQuest={handleFailQuest}
                    onEditQuest={questId => {
                      setEditingQuestPoolTemplateId(null);
                      setEditingQuestId(questId);
                      setCurrentScreen('add-quest');
                    }}
                    onOpenQuestDetails={handleOpenQuestDetails}
                    onNavigateToAddQuest={handleOpenAddQuest}
                    onNavigateToHistory={handleOpenHistory}
                    onNavigateToProgress={handleOpenProgress}
                    onNavigateToQuestPool={handleOpenQuestPool}
                    onNavigateToRealmCodex={handleOpenRealmCodex}
                    onNavigateToThemeSanctum={handleOpenThemeSanctum}
                    onRefreshAppConfig={handleRefreshAppConfig}
                    onSelectSortOption={handleSelectSortOption}
                    quests={gameState.quests}
                    selectedSortOption={gameState.sortOption}
                    styles={styles}
                  />
                </View>
              ) : currentScreen === 'progress' ? (
                <View
                  style={styles.primaryScreenShell}
                  testID="primary-screen-shell"
                  {...primaryScreenPanResponder.panHandlers}>
                  <ProgressScreen
                    appConfig={appConfig}
                    hero={gameState.hero}
                    onNavigateToHistory={handleOpenHistory}
                    onNavigateToRealmCodex={handleOpenRealmCodex}
                    onNavigateToStreak={handleOpenStreak}
                    onNavigateToThemeSanctum={handleOpenThemeSanctum}
                    onResetJourney={handleConfirmResetJourney}
                    onToggleTheme={handleToggleTheme}
                    quests={gameState.quests}
                    styles={styles}
                    themeMode={gameState.themeMode}
                    unlockedAchievementIds={gameState.unlockedAchievementIds}
                  />
                </View>
              ) : currentScreen === 'guild' ? (
                <View
                  style={styles.primaryScreenShell}
                  testID="primary-screen-shell"
                  {...primaryScreenPanResponder.panHandlers}>
                  <GuildScreen
                    onToggleTheme={handleToggleTheme}
                    styles={styles}
                    themeMode={gameState.themeMode}
                  />
                </View>
              ) : currentScreen === 'history' ? (
                <HistoryScreen
                  onBack={() => setCurrentScreen('progress')}
                  onToggleTheme={handleToggleTheme}
                  quests={gameState.quests}
                  styles={styles}
                  themeMode={gameState.themeMode}
                />
              ) : currentScreen === 'streak' ? (
                <StreakScreen
                  hero={gameState.hero}
                  onBack={() => setCurrentScreen('progress')}
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
                    onEditTemplate={handleEditQuestPoolTemplate}
                    onRefresh={handleRefreshQuestPool}
                    onResetDefaults={handleResetQuestPoolDefaults}
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
                    onBack={() => setCurrentScreen('progress')}
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
                    onBack={() => setCurrentScreen('progress')}
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
                      setEditingQuestPoolTemplateId(null);
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
                <View
                  style={styles.primaryScreenShell}
                  testID="primary-screen-shell"
                  {...primaryScreenPanResponder.panHandlers}>
                  <AddQuestScreen
                    editorMode={draftEditorMode}
                    onDelete={handleDeleteQuest}
                    onSave={handleSaveQuest}
                    onSaveToPool={handleSaveQuestPool}
                    onToggleTheme={handleToggleTheme}
                    poolTemplateToEdit={questPoolTemplateToEdit}
                    questToEdit={questToEdit}
                    styles={styles}
                    themeMode={gameState.themeMode}
                  />
                </View>
              )}
              <BottomNavigationBar
                activeTab={activePrimaryNavTab}
                onNavigateToForge={handleOpenAddQuest}
                onNavigateToGuild={() => setCurrentScreen('guild')}
                onNavigateToProfile={handleOpenProgress}
                onNavigateToQuests={() => setCurrentScreen('quest-board')}
                styles={styles}
              />
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
  const primaryActionTextColor = getReadableTextColor(
    theme.amber,
    theme.buttonText,
    '#FFFFFF',
  );
  const secondaryActionTextColor = getReadableTextColor(theme.blue);
  const tagBadgeTextColor = getReadableTextColor(theme.blueSoft);
  const surfaceBadgeTextColor = getReadableTextColor(theme.surfaceHighest);

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
      backgroundColor: `${theme.blue}14`,
      borderRadius: 280,
      height: 280,
      position: 'absolute',
      right: -92,
      top: -72,
      width: 280,
    },
    backgroundOrbSecondary: {
      backgroundColor: `${theme.amber}16`,
      borderRadius: 220,
      height: 220,
      left: -92,
      position: 'absolute',
      top: 132,
      width: 220,
    },
    backgroundOrbTertiary: {
      backgroundColor: `${theme.amber}12`,
      borderRadius: 260,
      bottom: -104,
      height: 260,
      position: 'absolute',
      right: -96,
      width: 260,
    },
    contentFrame: {
      flex: 1,
      position: 'relative',
      zIndex: 1,
    },
    primaryScreenShell: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 22,
      paddingTop: 24,
      paddingBottom: 150,
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
      borderRadius: 28,
      borderWidth: 1,
      maxWidth: 360,
      padding: 26,
      shadowColor: theme.blue,
      shadowOffset: { width: 0, height: 24 },
      shadowOpacity: 0.12,
      shadowRadius: 34,
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
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'space-between',
      marginBottom: 18,
    },
    screenHeaderSpacer: {
      height: 44,
      width: 56,
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
      backgroundColor: `${theme.surfaceHigh}f2`,
      borderColor: theme.ghostBorder,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 11,
    },
    backButtonText: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '700',
    },
    bottomNavShell: {
      bottom: 18,
      left: 18,
      position: 'absolute',
      right: 18,
      zIndex: 12,
    },
    bottomNavBar: {
      alignItems: 'stretch',
      backgroundColor: `${theme.surface}f6`,
      borderColor: `${theme.amber}55`,
      borderRadius: 24,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 10,
      shadowColor: theme.amber,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.12,
      shadowRadius: 22,
    },
    bottomNavItem: {
      alignItems: 'center',
      borderRadius: 18,
      flex: 1,
      justifyContent: 'center',
      minHeight: 64,
      paddingHorizontal: 8,
      paddingVertical: 8,
    },
    bottomNavItemActive: {
      backgroundColor: `${theme.blue}18`,
      borderColor: `${theme.blue}55`,
      borderWidth: 1,
      shadowColor: theme.blue,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.18,
      shadowRadius: 18,
    },
    bottomNavGlyph: {
      color: theme.subtitle,
      fontSize: 16,
      fontWeight: '800',
      marginBottom: 4,
    },
    bottomNavGlyphActive: {
      color: theme.blue,
    },
    bottomNavLabel: {
      color: theme.subtitle,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.9,
      textTransform: 'uppercase',
    },
    bottomNavLabelActive: {
      color: theme.blue,
    },
    screenLabel: {
      alignSelf: 'flex-start',
      backgroundColor: `${theme.surfaceHighest}d9`,
      borderColor: theme.ghostBorder,
      borderWidth: 1,
      borderRadius: 999,
      color: theme.blueSoft,
      fontSize: 12,
      letterSpacing: 1.4,
      paddingHorizontal: 12,
      paddingVertical: 7,
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
      backgroundColor: `${theme.surfaceHighest}e6`,
      borderColor: theme.ghostBorder,
      borderWidth: 1,
      borderRadius: 999,
      color: theme.amberSoft,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1.8,
      marginBottom: 10,
      overflow: 'hidden',
      paddingHorizontal: 13,
      paddingVertical: 7,
      textTransform: 'uppercase',
    },
    title: {
      color: theme.textPrimary,
      fontSize: 40,
      fontWeight: '800',
      letterSpacing: -1.3,
      lineHeight: 44,
      maxWidth: 330,
    },
    subtitle: {
      color: theme.subtitle,
      fontSize: 15,
      lineHeight: 24,
      marginTop: 14,
      maxWidth: 350,
    },
    heroCard: {
      backgroundColor: theme.surface,
      borderColor: theme.ghostBorder,
      borderRadius: 30,
      borderWidth: 1,
      marginTop: 28,
      overflow: 'hidden',
      padding: 24,
      shadowColor: theme.blue,
      shadowOffset: { width: 0, height: 24 },
      shadowOpacity: 0.14,
      shadowRadius: 36,
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
      color: theme.subtitle,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.4,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    heroTitle: {
      color: theme.textPrimary,
      fontSize: 24,
      fontWeight: '800',
      lineHeight: 30,
      maxWidth: 236,
    },
    heroOrb: {
      backgroundColor: theme.amber,
      borderRadius: 28,
      height: 28,
      shadowColor: theme.amber,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.34,
      shadowRadius: 18,
      width: 28,
    },
    heroStatsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 14,
      marginTop: 24,
    },
    boardHeroPillRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 18,
    },
    boardHeroPill: {
      backgroundColor: `${theme.surfaceHigh}f8`,
      borderColor: theme.ghostBorder,
      borderRadius: 20,
      borderWidth: 1,
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    boardHeroPillLabel: {
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.1,
      marginBottom: 6,
      textTransform: 'uppercase',
    },
    boardHeroPillValue: {
      color: theme.textPrimary,
      fontSize: 22,
      fontWeight: '800',
    },
    heroStat: {
      backgroundColor: `${theme.surfaceHigh}f8`,
      borderRadius: 22,
      flexGrow: 1,
      flexBasis: '30%',
      borderWidth: 1,
      borderColor: theme.ghostBorder,
      minHeight: 94,
      paddingHorizontal: 16,
      paddingVertical: 18,
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
      marginTop: 12,
    },
    heroStatLabel: {
      color: theme.textMuted,
      fontSize: 12,
      marginBottom: 6,
      textTransform: 'uppercase',
    },
    heroStatValue: {
      color: theme.textPrimary,
      fontSize: 24,
      fontWeight: '800',
    },
    heroSupportText: {
      color: theme.subtitle,
      fontSize: 14,
      lineHeight: 22,
      marginTop: 20,
    },
    boardRankHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    boardRankTitle: {
      color: theme.textPrimary,
      fontFamily: 'serif',
      fontSize: 28,
      fontWeight: '700',
      letterSpacing: -0.7,
      lineHeight: 34,
      maxWidth: 240,
    },
    boardRankMetaRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 14,
      marginTop: 18,
    },
    boardLevelChip: {
      alignSelf: 'flex-start',
      backgroundColor: theme.amber,
      borderColor: `${theme.amberSoft}80`,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 8,
      shadowColor: theme.amber,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.22,
      shadowRadius: 14,
    },
    boardLevelChipText: {
      color: theme.buttonText,
      fontSize: 13,
      fontWeight: '700',
    },
    boardRankXpText: {
      color: theme.subtitle,
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'right',
    },
    boardRankProgressHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
      marginTop: 18,
    },
    boardRankProgressLabel: {
      color: theme.subtitle,
      flex: 1,
      fontSize: 13,
      fontWeight: '600',
      marginRight: 12,
    },
    boardRankProgressNote: {
      color: theme.subtitle,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 12,
    },
    boardMiniStatRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    boardMiniStatCard: {
      backgroundColor: `${theme.surfaceHigh}f8`,
      borderColor: `${theme.blue}4a`,
      borderRadius: 22,
      borderWidth: 1,
      flex: 1,
      minHeight: 108,
      paddingHorizontal: 14,
      paddingVertical: 16,
    },
    boardMiniStatLabel: {
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.1,
      marginBottom: 10,
      textTransform: 'uppercase',
    },
    boardMiniStatValue: {
      color: theme.textPrimary,
      fontSize: 19,
      fontWeight: '800',
      letterSpacing: -0.3,
      lineHeight: 24,
    },
    themeHeroCard: {
      backgroundColor: theme.surface,
      borderColor: theme.ghostBorder,
      borderRadius: 26,
      borderWidth: 1,
      marginTop: 28,
      paddingHorizontal: 20,
      paddingVertical: 20,
      shadowColor: theme.amber,
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.1,
      shadowRadius: 22,
    },
    themeHeroHeader: {
      alignItems: 'flex-start',
      marginBottom: 18,
    },
    themeHeroTitle: {
      color: theme.textPrimary,
      fontFamily: 'serif',
      fontSize: 28,
      fontWeight: '700',
      letterSpacing: -0.7,
      lineHeight: 34,
      maxWidth: 230,
    },
    themeMetricGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    themeMetricCard: {
      backgroundColor: `${theme.surfaceHigh}f8`,
      borderColor: theme.ghostBorder,
      borderRadius: 22,
      borderWidth: 1,
      minHeight: 104,
      paddingHorizontal: 14,
      paddingVertical: 14,
      width: '47%',
    },
    themeMetricLabel: {
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.1,
      marginBottom: 10,
      textTransform: 'uppercase',
    },
    themeMetricValue: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: '700',
      lineHeight: 22,
    },
    themeMetricValueCompact: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: '700',
      lineHeight: 20,
    },
    themeMetricAccentRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
    },
    themeMetricAccentDot: {
      borderRadius: 999,
      height: 12,
      width: 12,
    },
    themePackRow: {
      alignItems: 'center',
      backgroundColor: `${theme.surfaceHigh}f2`,
      borderColor: theme.ghostBorder,
      borderRadius: 22,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 14,
      marginTop: 14,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    themePackSwatchStack: {
      flexDirection: 'row',
      gap: 8,
    },
    themePackSwatch: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.ghostBorder,
      height: 26,
      width: 26,
    },
    themePackCopy: {
      flex: 1,
    },
    themePackTitle: {
      color: theme.textPrimary,
      fontSize: 20,
      fontWeight: '700',
      lineHeight: 24,
    },
    themePackSubtitle: {
      color: theme.subtitle,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 4,
    },
    themePackSelectButton: {
      alignItems: 'center',
      backgroundColor: `${theme.surfaceHighest}f4`,
      borderColor: theme.ghostBorder,
      borderRadius: 999,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 40,
      minWidth: 82,
      paddingHorizontal: 16,
    },
    themePackSelectButtonCurrent: {
      backgroundColor: theme.amber,
      borderColor: `${theme.amberSoft}88`,
    },
    themePackSelectButtonText: {
      color: theme.textPrimary,
      fontSize: 13,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    themePackSelectButtonTextCurrent: {
      color: theme.buttonText,
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
      color: theme.amber,
      fontSize: 14,
      fontWeight: '800',
    },
    detailsProgressTrack: {
      backgroundColor: `${theme.surfaceHighest}f0`,
      borderColor: theme.ghostBorder,
      borderRadius: 999,
      borderWidth: 1,
      height: 14,
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
      borderRadius: 28,
      borderWidth: 1,
      marginTop: 28,
      padding: 22,
      shadowColor: theme.blue,
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.08,
      shadowRadius: 28,
    },
    sectionHeaderRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 14,
      justifyContent: 'space-between',
    },
    sectionHeaderCopy: {
      flex: 1,
    },
    suggestionCard: {
      backgroundColor: theme.surfaceHigh,
      borderColor: theme.ghostBorder,
      borderRadius: 24,
      borderWidth: 1,
      marginTop: 14,
      padding: 18,
      shadowColor: theme.amber,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.06,
      shadowRadius: 20,
    },
    suggestionTitle: {
      color: theme.textPrimary,
      fontSize: 19,
      fontWeight: '800',
      lineHeight: 25,
    },
    questPoolToolbar: {
      marginTop: 26,
    },
    questPoolHeaderRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'flex-end',
    },
    questPoolHeaderCopy: {
      flex: 1,
    },
    questPoolSearchInput: {
      backgroundColor: theme.surfaceLow,
      borderColor: toRgba(theme.blue, 0.28),
      borderRadius: 18,
      borderWidth: 1,
      color: theme.textPrimary,
      fontSize: 16,
      marginTop: 14,
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    questPoolChipRow: {
      gap: 10,
      paddingTop: 14,
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
    questPoolCompactCard: {
      backgroundColor: theme.surfaceHigh,
      borderColor: theme.ghostBorder,
      borderRadius: 24,
      borderWidth: 1,
      marginTop: 18,
      paddingHorizontal: 18,
      paddingVertical: 18,
      shadowColor: theme.blue,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
    },
    questPoolCompactHeader: {
      gap: 10,
    },
    questPoolCompactHeaderRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'space-between',
    },
    questPoolCompactTagBadge: {
      alignSelf: 'flex-start',
      backgroundColor: theme.blueSoft,
      borderColor: toRgba(theme.blue, 0.34),
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    questPoolCompactTagText: {
      color: tagBadgeTextColor,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    questPoolCompactDifficultyBadge: {
      alignSelf: 'flex-start',
      backgroundColor: theme.surfaceHighest,
      borderColor: theme.ghostBorder,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    questPoolCompactDifficultyText: {
      color: surfaceBadgeTextColor,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    questPoolCompactTitle: {
      color: theme.textPrimary,
      fontFamily: 'serif',
      fontSize: 22,
      fontWeight: '700',
      letterSpacing: -0.4,
      lineHeight: 28,
    },
    questPoolCompactDescription: {
      color: theme.subtitle,
      fontSize: 15,
      lineHeight: 22,
    },
    questPoolCompactDueText: {
      color: theme.textMuted,
      fontSize: 13,
      fontWeight: '600',
      marginTop: 12,
    },
    questPoolCompactEditButton: {
      alignItems: 'center',
      backgroundColor: theme.surfaceHighest,
      borderColor: theme.ghostBorder,
      borderRadius: 16,
      borderWidth: 1,
      marginTop: 12,
      paddingHorizontal: 16,
      paddingVertical: 13,
    },
    questPoolCompactEditButtonText: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: '700',
    },
    poolActionButton: {
      alignItems: 'center',
      backgroundColor: theme.amber,
      borderColor: toRgba(theme.amber, 0.52),
      borderRadius: 14,
      borderWidth: 1,
      flex: 1,
      shadowColor: theme.amber,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    poolActionButtonSecondary: {
      backgroundColor: theme.blue,
      borderColor: toRgba(theme.blue, 0.48),
      shadowColor: theme.blue,
    },
    poolActionButtonText: {
      color: primaryActionTextColor,
      fontSize: 14,
      fontWeight: '700',
    },
    poolActionButtonTextSecondary: {
      color: secondaryActionTextColor,
    },
    questDescription: {
      color: theme.subtitle,
      fontSize: 14,
      lineHeight: 22,
      marginTop: 12,
    },
    questSectionHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
      marginBottom: 14,
    },
    questSectionSignal: {
      backgroundColor: theme.amber,
      borderRadius: 999,
      height: 4,
      shadowColor: theme.amber,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.26,
      shadowRadius: 10,
      width: 16,
    },
    completionBanner: {
      backgroundColor: `${theme.surfaceHigh}f7`,
      borderColor: `${theme.success}55`,
      borderRadius: 26,
      borderWidth: 1,
      marginTop: 18,
      paddingHorizontal: 20,
      paddingVertical: 18,
      shadowColor: theme.success,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.16,
      shadowRadius: 24,
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
      borderRadius: 28,
      borderWidth: 1,
      marginTop: 20,
      padding: 22,
      shadowColor: theme.blue,
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
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
      borderRadius: 20,
      borderWidth: 1,
      marginTop: 12,
      paddingHorizontal: 18,
      paddingVertical: 17,
      shadowColor: theme.amber,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
    },
    primaryActionText: {
      color: theme.buttonText,
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 0.4,
    },
    secondaryActionButton: {
      alignItems: 'center',
      backgroundColor: `${theme.surfaceHighest}f8`,
      borderColor: `${theme.blue}2f`,
      borderRadius: 20,
      borderWidth: 1,
      marginTop: 12,
      paddingHorizontal: 18,
      paddingVertical: 17,
      shadowColor: theme.blue,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.06,
      shadowRadius: 18,
    },
    secondaryActionText: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    inlineUtilityButton: {
      alignItems: 'center',
      backgroundColor: `${theme.surfaceHighest}e8`,
      borderColor: theme.ghostBorder,
      borderRadius: 999,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 38,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    inlineUtilityButtonText: {
      color: theme.textPrimary,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    formCard: {
      backgroundColor: theme.surface,
      borderColor: theme.ghostBorder,
      borderRadius: 28,
      borderWidth: 1,
      marginTop: 28,
      padding: 22,
      shadowColor: theme.blue,
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.08,
      shadowRadius: 26,
    },
    formIntro: {
      color: theme.subtitle,
      fontSize: 14,
      lineHeight: 22,
      marginBottom: 18,
      marginTop: -2,
    },
    formHint: {
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 19,
      marginTop: -2,
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
      backgroundColor: theme.surfaceHigh,
      borderColor: theme.ghostBorder,
      borderRadius: 20,
      borderWidth: 1,
      color: theme.textPrimary,
      fontSize: 16,
      paddingHorizontal: 16,
      paddingVertical: 15,
    },
    notesInput: {
      backgroundColor: theme.surfaceHigh,
      borderColor: theme.ghostBorder,
      borderRadius: 20,
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
      color: theme.textPrimary,
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
      backgroundColor: theme.surfaceHigh,
      borderColor: theme.ghostBorder,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    optionChipSelected: {
      backgroundColor: theme.amber,
      borderColor: `${theme.amberSoft}90`,
    },
    optionChipText: {
      color: theme.subtitle,
      fontSize: 14,
      fontWeight: '600',
    },
    optionChipTextSelected: {
      color: theme.buttonText,
    },
    saveButton: {
      alignItems: 'center',
      backgroundColor: theme.amber,
      borderColor: `${theme.amberSoft}80`,
      borderRadius: 20,
      borderWidth: 1,
      marginTop: 22,
      paddingHorizontal: 18,
      paddingVertical: 17,
      shadowColor: theme.amber,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
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
      backgroundColor: theme.surfaceHigh,
      borderColor: theme.ghostBorder,
      borderRadius: 26,
      borderWidth: 1,
      marginTop: 28,
      padding: 20,
      shadowColor: theme.amber,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.06,
      shadowRadius: 18,
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
      borderRadius: 28,
      borderWidth: 1,
      padding: 22,
      shadowColor: theme.blue,
      shadowOffset: { width: 0, height: 24 },
      shadowOpacity: 0.18,
      shadowRadius: 30,
    },
    sectionTitle: {
      color: theme.textPrimary,
      fontSize: 24,
      fontWeight: '800',
      letterSpacing: -0.4,
      marginBottom: 14,
    },
    questCard: {
      backgroundColor: theme.surfaceHigh,
      borderColor: theme.ghostBorder,
      borderRadius: 26,
      borderWidth: 1,
      marginBottom: 14,
      padding: 20,
      shadowColor: theme.amber,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.06,
      shadowRadius: 20,
    },
    questCardTopRow: {
      alignItems: 'stretch',
      flexDirection: 'row',
      gap: 16,
    },
    questArtTile: {
      backgroundColor: `${theme.surfaceHighest}f2`,
      borderColor: theme.ghostBorder,
      borderRadius: 22,
      borderWidth: 1,
      minHeight: 90,
      overflow: 'hidden',
      position: 'relative',
      width: 82,
    },
    questArtShapePrimary: {
      backgroundColor: `${theme.amber}45`,
      borderRadius: 16,
      height: 34,
      left: 14,
      position: 'absolute',
      top: 14,
      width: 34,
    },
    questArtShapeSecondary: {
      backgroundColor: `${theme.blue}34`,
      borderRadius: 999,
      bottom: 14,
      height: 28,
      position: 'absolute',
      right: 16,
      width: 28,
    },
    questArtShapeAccent: {
      backgroundColor: `${theme.blue}70`,
      borderRadius: 999,
      height: 48,
      position: 'absolute',
      right: 12,
      top: 18,
      width: 10,
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
    questHeaderMeta: {
      flex: 1,
      justifyContent: 'space-between',
    },
    questCategoryLine: {
      color: theme.textMuted,
      flex: 1,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.1,
      marginRight: 12,
      textTransform: 'uppercase',
    },
    expandChevronButton: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 26,
      minWidth: 26,
    },
    expandChevronIcon: {
      color: theme.blue,
      fontSize: 18,
      fontWeight: '700',
    },
    questTitle: {
      color: theme.textPrimary,
      flex: 1,
      fontSize: 19,
      fontWeight: '800',
      lineHeight: 25,
    },
    questRewardRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
      marginTop: 12,
    },
    questRewardBadge: {
      alignSelf: 'flex-start',
      backgroundColor: theme.amber,
      borderColor: `${theme.amberSoft}88`,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    questRewardText: {
      color: theme.buttonText,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    questMiniMetaText: {
      color: theme.subtitle,
      fontSize: 13,
      fontWeight: '600',
    },
    questCardTimelineRow: {
      alignItems: 'center',
      borderTopColor: theme.ghostBorder,
      borderTopWidth: 1,
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
      marginTop: 16,
      paddingTop: 14,
    },
    questTimelineText: {
      color: theme.subtitle,
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
    },
    questTimelineState: {
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    questTimelineStateUrgent: {
      color: theme.amber,
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
      backgroundColor: theme.activeBadgeBackground,
    },
    statusBadgeDone: {
      backgroundColor: theme.doneBadgeBackground,
    },
    statusBadgeText: {
      color: theme.blue,
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
      backgroundColor: `${theme.surfaceHighest}ef`,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.ghostBorder,
      flex: 1,
      paddingHorizontal: 13,
      paddingVertical: 13,
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
      backgroundColor: `${theme.blue}12`,
      borderColor: `${theme.blue}28`,
      borderRadius: 18,
      borderWidth: 1,
      marginTop: 16,
      paddingHorizontal: 16,
      paddingVertical: 13,
    },
    completeButtonText: {
      color: theme.blueSoft,
      fontSize: 14,
      fontWeight: '700',
    },
    cardSecondaryButton: {
      alignItems: 'center',
      backgroundColor: `${theme.surfaceHighest}ee`,
      borderColor: theme.ghostBorder,
      borderRadius: 18,
      borderWidth: 1,
      marginTop: 12,
      paddingHorizontal: 16,
      paddingVertical: 13,
    },
    cardSecondaryButtonText: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '700',
    },
    questCardActionRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 12,
    },
    questCardInlineAction: {
      flex: 1,
      marginTop: 0,
    },
    inlineDangerButton: {
      alignItems: 'center',
      backgroundColor: theme.doneBadgeBackground,
      borderColor: theme.success,
      borderRadius: 18,
      borderWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 13,
    },
    inlineDangerButtonText: {
      color: theme.success,
      fontSize: 14,
      fontWeight: '700',
    },
    deleteButton: {
      alignItems: 'center',
      backgroundColor: theme.doneBadgeBackground,
      borderColor: theme.success,
      borderRadius: 20,
      borderWidth: 1,
      marginTop: 12,
      paddingHorizontal: 18,
      paddingVertical: 17,
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
      backgroundColor: theme.surfaceHigh,
      borderColor: theme.ghostBorder,
      borderRadius: 24,
      borderWidth: 1,
      paddingHorizontal: 18,
      paddingVertical: 18,
      shadowColor: theme.blue,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.05,
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
    historyPageTitle: {
      fontFamily: 'serif',
      letterSpacing: -0.8,
    },
    historySummaryRow: {
      flexDirection: 'row',
      gap: 14,
      marginTop: 26,
    },
    historySummaryCard: {
      backgroundColor: theme.surface,
      borderColor: theme.ghostBorder,
      borderRadius: 22,
      borderWidth: 1,
      flex: 1,
      height: 104,
      overflow: 'hidden',
      justifyContent: 'space-between',
      paddingBottom: 14,
      paddingLeft: 20,
      paddingRight: 18,
      paddingTop: 14,
      position: 'relative',
      shadowColor: theme.amber,
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.08,
      shadowRadius: 22,
    },
    historySummaryCardWarm: {
      shadowColor: theme.amber,
    },
    historySummaryCardRose: {
      shadowColor: theme.blue,
    },
    historySummaryAccent: {
      backgroundColor: theme.amber,
      borderBottomLeftRadius: 22,
      borderTopLeftRadius: 22,
      bottom: 0,
      left: 0,
      position: 'absolute',
      top: 0,
      width: 7,
    },
    historySummaryAccentRose: {
      backgroundColor: '#ffb4b4',
    },
    historySummaryLabel: {
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.6,
      lineHeight: 16,
      maxWidth: 96,
      textTransform: 'uppercase',
    },
    historySummaryValueRow: {
      alignItems: 'flex-end',
      flexDirection: 'row',
      gap: 8,
    },
    historySummaryValue: {
      color: theme.amberSoft,
      fontFamily: 'serif',
      fontSize: 40,
      fontWeight: '700',
      letterSpacing: -1,
      lineHeight: 42,
    },
    historySummaryGlyph: {
      color: theme.amber,
      fontSize: 16,
      fontWeight: '800',
      lineHeight: 18,
      marginBottom: 6,
    },
    historyOverviewLeadCard: {
      backgroundColor: theme.surface,
      borderColor: theme.ghostBorder,
      borderRadius: 28,
      borderWidth: 1,
      marginTop: 26,
      paddingHorizontal: 20,
      paddingVertical: 20,
      shadowColor: theme.amber,
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
    },
    historyOverviewLeadLabel: {
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.2,
      marginBottom: 10,
      textTransform: 'uppercase',
    },
    historyOverviewLeadValue: {
      color: theme.textPrimary,
      fontSize: 38,
      fontWeight: '800',
      letterSpacing: -1,
      lineHeight: 42,
    },
    historyOverviewLeadCaption: {
      color: theme.subtitle,
      fontSize: 14,
      lineHeight: 22,
      marginTop: 8,
    },
    historyOverviewGrid: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 14,
    },
    historyOverviewMetricCard: {
      backgroundColor: `${theme.surfaceHigh}f8`,
      borderColor: theme.ghostBorder,
      borderRadius: 22,
      borderWidth: 1,
      flex: 1,
      minHeight: 104,
      paddingHorizontal: 14,
      paddingVertical: 16,
    },
    historyOverviewMetricLabel: {
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.1,
      marginBottom: 10,
      textTransform: 'uppercase',
    },
    historyOverviewMetricValue: {
      color: theme.textPrimary,
      fontSize: 28,
      fontWeight: '800',
      letterSpacing: -0.4,
    },
    historyFilterCard: {
      marginTop: 24,
      padding: 0,
    },
    historySegmentRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 0,
      marginBottom: 12,
    },
    historySegmentChip: {
      alignItems: 'center',
      backgroundColor: `${theme.surfaceHighest}e8`,
      borderColor: theme.ghostBorder,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      minHeight: 48,
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    historySegmentChipSelected: {
      backgroundColor: `${theme.amber}1c`,
      borderColor: `${theme.amber}55`,
      shadowColor: theme.amber,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.14,
      shadowRadius: 16,
    },
    historySegmentChipText: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: '600',
    },
    historySegmentChipTextSelected: {
      color: theme.amberSoft,
      fontWeight: '700',
    },
    historyStatusIndicator: {
      borderRadius: 999,
      height: 8,
      width: 8,
    },
    historyStatusIndicatorDone: {
      backgroundColor: theme.blue,
    },
    historyStatusIndicatorFailed: {
      backgroundColor: '#ffb4b4',
    },
    historyFilterHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    historyFilterHeaderCopy: {
      flex: 1,
    },
    historyViewBadge: {
      alignSelf: 'flex-start',
      backgroundColor: `${theme.surfaceHigh}f4`,
      borderColor: theme.ghostBorder,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    historyViewBadgeText: {
      color: theme.blueSoft,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    historyQuestCard: {
      backgroundColor: theme.surface,
      borderColor: theme.ghostBorder,
      borderRadius: 28,
      borderWidth: 1,
      marginTop: 16,
      paddingHorizontal: 18,
      paddingVertical: 18,
      shadowColor: theme.blue,
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
    },
    historyGroupSection: {
      marginTop: 22,
    },
    historyGroupLabel: {
      color: theme.subtitle,
      fontFamily: 'serif',
      fontSize: 22,
      fontStyle: 'italic',
      lineHeight: 28,
      marginBottom: 16,
      marginLeft: 6,
    },
    historyBadgeRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
    },
    historyBadgeGroup: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    historyTagBadge: {
      backgroundColor: `${theme.blue}18`,
      borderColor: `${theme.blue}42`,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    historyTagBadgeText: {
      color: theme.blueSoft,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    historyPathBadge: {
      backgroundColor: `${theme.amber}16`,
      borderColor: `${theme.amber}42`,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    historyPathBadgeText: {
      color: theme.amberSoft,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    historyStatusRail: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
      marginLeft: 12,
    },
    historyStatusIcon: {
      color: theme.blueSoft,
      fontSize: 13,
      fontWeight: '800',
    },
    historyStatusText: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.1,
      textTransform: 'uppercase',
    },
    historyStatusTextDone: {
      color: theme.blueSoft,
    },
    historyStatusTextFailed: {
      color: theme.amberSoft,
    },
    historyQuestTitle: {
      color: theme.textPrimary,
      fontFamily: 'serif',
      fontSize: 25,
      fontWeight: '700',
      letterSpacing: -0.5,
      lineHeight: 32,
      marginTop: 20,
    },
    historyQuestDescription: {
      color: theme.subtitle,
      fontSize: 16,
      lineHeight: 22,
      marginTop: 12,
      maxWidth: '92%',
    },
    historyQuestDivider: {
      backgroundColor: theme.ghostBorder,
      height: 1,
      marginTop: 18,
      opacity: 0.9,
      width: '100%',
    },
    historyFooterRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 18,
    },
    historyResolvedRow: {
      alignItems: 'center',
      flexDirection: 'row',
      flex: 1,
      gap: 10,
      marginRight: 12,
    },
    historyResolvedIcon: {
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: '700',
    },
    historyResolvedText: {
      color: theme.subtitle,
      fontSize: 15,
      fontWeight: '600',
    },
    historyXpBadge: {
      alignItems: 'center',
      backgroundColor: `${theme.blue}18`,
      borderColor: `${theme.blue}42`,
      borderRadius: 14,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 42,
      minWidth: 110,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    historyXpBadgeText: {
      color: theme.blueSoft,
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: 0.2,
    },
    historySupportRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 14,
    },
    historySupportText: {
      color: theme.textMuted,
      fontSize: 12,
      lineHeight: 18,
    },
    streakMetricStack: {
      gap: 12,
      marginTop: 28,
    },
    streakSpotlightCard: {
      backgroundColor: theme.surface,
      borderColor: theme.ghostBorder,
      borderRadius: 26,
      borderWidth: 1,
      paddingHorizontal: 20,
      paddingVertical: 18,
      shadowColor: theme.blue,
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.08,
      shadowRadius: 22,
    },
    streakSpotlightCardPrimary: {
      backgroundColor: `${theme.amber}10`,
      borderColor: `${theme.amber}42`,
      shadowColor: theme.amber,
      shadowOpacity: 0.12,
    },
    streakSpotlightLabel: {
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.2,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    streakSpotlightValue: {
      color: theme.textPrimary,
      fontSize: 28,
      fontWeight: '800',
      letterSpacing: -0.6,
    },
    streakSpotlightValuePrimary: {
      color: theme.amberSoft,
    },
    streakSpotlightBody: {
      color: theme.subtitle,
      fontSize: 14,
      lineHeight: 22,
      marginTop: 10,
    },
    calendarHeaderRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 22,
    },
    calendarNavRow: {
      flexDirection: 'row',
      gap: 12,
    },
    streakCalendarCard: {
      backgroundColor: theme.surface,
      borderColor: theme.ghostBorder,
      borderRadius: 28,
      borderWidth: 1,
      marginTop: 28,
      paddingHorizontal: 18,
      paddingVertical: 18,
      shadowColor: theme.amber,
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
    },
    streakCalendarMonth: {
      color: theme.textPrimary,
      fontFamily: 'serif',
      fontSize: 24,
      fontWeight: '700',
      letterSpacing: -0.6,
      lineHeight: 30,
    },
    calendarNavButton: {
      alignItems: 'center',
      backgroundColor: `${theme.surfaceHigh}fc`,
      borderColor: `${theme.blue}32`,
      borderRadius: 14,
      borderWidth: 1,
      height: 46,
      justifyContent: 'center',
      width: 46,
    },
    calendarNavButtonText: {
      color: theme.blue,
      fontSize: 22,
      fontWeight: '700',
    },
    calendarWeekRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    calendarWeekday: {
      color: theme.subtitle,
      flex: 1,
      fontSize: 13,
      fontWeight: '700',
      textAlign: 'center',
      textTransform: 'uppercase',
    },
    calendarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    calendarDay: {
      alignItems: 'center',
      borderRadius: 14,
      borderWidth: 1,
      height: 48,
      justifyContent: 'center',
      position: 'relative',
      width: '12.8%',
    },
    calendarDayCurrentMonth: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    calendarDayOutsideMonth: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      opacity: 0.58,
    },
    calendarDayMomentum: {
      backgroundColor: `${theme.amber}20`,
      borderColor: `${theme.amber}82`,
      shadowColor: theme.amber,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.18,
      shadowRadius: 14,
    },
    calendarDayActive: {
      backgroundColor: `${theme.success}18`,
      borderColor: `${theme.success}72`,
      shadowColor: theme.success,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.16,
      shadowRadius: 14,
    },
    calendarDayToday: {
      borderColor: theme.blue,
      borderWidth: 2,
      shadowColor: theme.blue,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
    },
    calendarDayText: {
      color: theme.textMuted,
      fontSize: 16,
      fontWeight: '600',
    },
    calendarDayTextOutsideMonth: {
      color: theme.placeholder,
    },
    calendarDayTextMomentum: {
      color: theme.textPrimary,
      fontWeight: '700',
    },
    calendarDayTextActive: {
      color: theme.textPrimary,
      fontWeight: '700',
    },
    calendarDayTextToday: {
      color: theme.textPrimary,
    },
    calendarTodayDot: {
      borderRadius: 999,
      height: 9,
      position: 'absolute',
      right: -2,
      top: -2,
      width: 9,
    },
    calendarTodayDotActive: {
      backgroundColor: theme.blue,
    },
    calendarTodayDotPassive: {
      backgroundColor: theme.blue,
    },
    achievementGrid: {
      gap: 12,
      marginTop: 8,
    },
    achievementCard: {
      borderRadius: 24,
      borderWidth: 1,
      overflow: 'hidden',
      paddingHorizontal: 18,
      paddingVertical: 18,
    },
    achievementCardUnlocked: {
      backgroundColor: theme.surfaceHigh,
      borderColor: `${theme.amber}66`,
      shadowColor: theme.amber,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
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
      color: theme.subtitle,
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
      color: theme.textMuted,
    },
    achievementStatus: {
      alignSelf: 'flex-start',
      borderRadius: 999,
      borderWidth: 1,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1.1,
      paddingHorizontal: 10,
      paddingVertical: 6,
      textTransform: 'uppercase',
    },
    achievementStatusUnlocked: {
      backgroundColor: `${theme.amber}18`,
      borderColor: `${theme.amber}4f`,
      color: theme.amber,
    },
    achievementStatusLocked: {
      backgroundColor: `${theme.surfaceHighest}e4`,
      borderColor: theme.ghostBorder,
      color: theme.textMuted,
    },
    streakInsightText: {
      color: theme.subtitle,
      fontSize: 15,
      lineHeight: 23,
    },
    detailsMetricGrid: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 22,
    },
    detailsMetricCard: {
      backgroundColor: `${theme.surfaceHigh}f8`,
      borderColor: theme.ghostBorder,
      borderRadius: 22,
      borderWidth: 1,
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    detailsMetricLabel: {
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.1,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    detailsMetricValue: {
      color: theme.textPrimary,
      fontSize: 21,
      fontWeight: '800',
      lineHeight: 26,
    },
    detailsTimelineStrip: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
    detailsTimelineItem: {
      backgroundColor: `${theme.surfaceHigh}f8`,
      borderColor: theme.ghostBorder,
      borderRadius: 20,
      borderWidth: 1,
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    detailsTimelineValue: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 20,
    },
    detailsGuidanceCard: {
      backgroundColor: `${theme.amber}0f`,
      borderColor: `${theme.amber}40`,
      borderRadius: 26,
      borderWidth: 1,
      marginTop: 24,
      paddingHorizontal: 20,
      paddingVertical: 18,
      shadowColor: theme.amber,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
    },
    detailsGuidanceTitle: {
      color: theme.textPrimary,
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: -0.3,
      marginBottom: 10,
    },
    detailsGuidanceText: {
      color: theme.subtitle,
      fontSize: 15,
      lineHeight: 23,
    },
    detailsComponentList: {
      gap: 12,
      marginTop: 2,
    },
    detailsComponentRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 12,
    },
    detailsComponentMarker: {
      alignItems: 'center',
      backgroundColor: `${theme.blue}18`,
      borderColor: `${theme.blue}42`,
      borderRadius: 999,
      borderWidth: 1,
      height: 30,
      justifyContent: 'center',
      width: 30,
    },
    detailsComponentMarkerText: {
      color: theme.blueSoft,
      fontSize: 13,
      fontWeight: '800',
    },
    detailsComponentText: {
      color: theme.textPrimary,
      flex: 1,
      fontSize: 14,
      lineHeight: 22,
      paddingTop: 4,
    },
  });
}

export default App;

























