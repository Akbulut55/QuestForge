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
  saveStoredGameState,
} from './src/storage/questStorage';

type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Epic';
type Category = 'Main Quest' | 'Side Quest';
type Status = 'Ready' | 'In Progress' | 'Completed';
type ScreenName = 'quest-board' | 'add-quest' | 'progress';
type RankTitle = 'Novice' | 'Adventurer' | 'Knight' | 'Champion';
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
};

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
};

type ProgressStats = {
  totalCreated: number;
  totalCompleted: number;
  activeCount: number;
  completedCount: number;
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
    background: '#131313',
    surfaceLow: '#1c1b1b',
    surface: '#201f1f',
    surfaceHigh: '#2a2a2a',
    surfaceHighest: '#353534',
    textPrimary: '#e5e2e1',
    textMuted: '#d4c5ab',
    amber: '#ffbf00',
    amberSoft: '#ffe2ab',
    blue: '#00d2fd',
    blueSoft: '#a2e7ff',
    success: '#88d498',
    ghostBorder: 'rgba(156, 143, 120, 0.18)',
    subtitle: '#b3aba0',
    placeholder: '#7e766b',
    buttonText: '#402d00',
    buttonDisabled: '#6e5b22',
    activeBadgeBackground: 'rgba(255, 191, 0, 0.16)',
    doneBadgeBackground: 'rgba(136, 212, 152, 0.16)',
  },
  light: {
    background: '#f5efe4',
    surfaceLow: '#efe5d6',
    surface: '#fbf6ed',
    surfaceHigh: '#e6d9c5',
    surfaceHighest: '#dccbb2',
    textPrimary: '#2a2015',
    textMuted: '#7a6447',
    amber: '#c68a17',
    amberSoft: '#f0c879',
    blue: '#2e8da3',
    blueSoft: '#69bfd5',
    success: '#3c8a59',
    ghostBorder: 'rgba(122, 100, 71, 0.16)',
    subtitle: '#6f5d45',
    placeholder: '#917b61',
    buttonText: '#2a2015',
    buttonDisabled: '#b79c67',
    activeBadgeBackground: 'rgba(198, 138, 23, 0.14)',
    doneBadgeBackground: 'rgba(60, 138, 89, 0.14)',
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
  },
  {
    id: 'quest-2',
    title: 'Brew a Focus Potion',
    difficulty: 'Medium',
    xpReward: 20,
    status: 'Ready',
    category: 'Side Quest',
  },
  {
    id: 'quest-3',
    title: 'Sharpen the Study Blade',
    difficulty: 'Easy',
    xpReward: 10,
    status: 'Completed',
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
    unlockedAchievementIds: getUnlockedAchievementIds({
      hero,
      quests: normalizedQuests,
      existingUnlockedAchievementIds: state.unlockedAchievementIds ?? [],
    }),
  };
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

  return (
    <Pressable
      onPress={onToggleTheme}
      style={styles.themeToggleButton}
      testID="theme-toggle-button">
      <Text style={styles.themeToggleText}>{nextThemeLabel}</Text>
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
  hero,
  quests,
  styles,
  themeMode,
  onToggleTheme,
  onCompleteQuest,
  onEditQuest,
  onNavigateToAddQuest,
  onNavigateToProgress,
  completionFeedback,
}: {
  hero: HeroProgress;
  quests: Quest[];
  styles: ReturnType<typeof createStyles>;
  themeMode: ThemeMode;
  onToggleTheme: () => void;
  onCompleteQuest: (questId: string) => void;
  onEditQuest: (questId: string) => void;
  onNavigateToAddQuest: () => void;
  onNavigateToProgress: () => void;
  completionFeedback: CompletionFeedback | null;
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

  const visibleQuests = quests.filter(quest =>
    questMatchesFilters({
      quest,
      searchQuery,
      selectedCategoryFilter,
      selectedDifficultyFilter,
      selectedStatusFilter,
    }),
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

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.kicker}>Daily Quest Log</Text>
          <Text style={styles.title}>Quest Forge</Text>
        </View>
        <ThemeToggle
          onToggleTheme={onToggleTheme}
          styles={styles}
          themeMode={themeMode}
        />
      </View>

      <Text style={styles.subtitle}>
        Turn your everyday tasks into a progression path worth chasing.
      </Text>

      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroEyebrow}>Hero Overview</Text>
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

      <View style={styles.boardActionCard}>
        <Text style={styles.sectionTitle}>Forge New Quest</Text>
        <Text style={styles.formIntro}>
          Open the dedicated Add Quest screen to create a new mission for your
          quest log.
        </Text>
        <Pressable
          onPress={onNavigateToAddQuest}
          style={styles.primaryActionButton}
          testID="navigate-to-add-quest">
          <Text style={styles.primaryActionText}>Open Add Quest</Text>
        </Pressable>
        <Pressable
          onPress={onNavigateToProgress}
          style={styles.secondaryActionButton}
          testID="navigate-to-progress-screen">
          <Text style={styles.secondaryActionText}>Open Progress</Text>
        </Pressable>
      </View>

      <View style={styles.filterCard}>
        <Text style={styles.sectionTitle}>Search And Filter</Text>
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
      </View>

      {!hasVisibleQuests ? (
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateTitle}>No quests match your filters</Text>
          <Text style={styles.emptyStateText}>
            Try a different search or reset one of the filter chips.
          </Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Main Quest</Text>
        {mainQuests.map(quest => (
          <QuestCard
            key={quest.id}
            onComplete={onCompleteQuest}
            onEdit={onEditQuest}
            quest={quest}
            styles={styles}
          />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Side Quests</Text>
        {sideQuests.map(quest => (
          <QuestCard
            key={quest.id}
            onComplete={onCompleteQuest}
            onEdit={onEditQuest}
            quest={quest}
            styles={styles}
          />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Completed Quests</Text>
        {completedQuests.map(quest => (
          <QuestCard
            key={quest.id}
            onEdit={onEditQuest}
            quest={quest}
            styles={styles}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function ProgressScreen({
  hero,
  quests,
  unlockedAchievementIds,
  onBack,
  onToggleTheme,
  styles,
  themeMode,
}: {
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

      <Text style={styles.kicker}>Profile</Text>
      <Text style={styles.title}>Hero Summary</Text>
      <Text style={styles.subtitle}>
        Track the progress you have forged from quests already living in your
        current log.
      </Text>

      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroEyebrow}>Current Progress</Text>
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
        <Text style={styles.sectionTitle}>Quest Progress</Text>
        <Text style={styles.formIntro}>
          This screen summarizes the quest board without creating any new data
          or changing your current flow.
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

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <Text style={styles.formIntro}>
          Badges unlock automatically from the progress you already build on the
          quest board.
        </Text>

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
  onSave: (quest: Quest) => void;
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
      id: questToEdit?.id ?? createQuestId(),
      title,
      difficulty: selectedDifficulty,
      xpReward: completionXpByDifficulty[selectedDifficulty],
      status: questToEdit?.status ?? 'Ready',
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
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('quest-board');
  const [isHydrated, setIsHydrated] = useState(false);
  const [completionFeedback, setCompletionFeedback] =
    useState<CompletionFeedback | null>(null);
  const [editingQuestId, setEditingQuestId] = useState<string | null>(null);

  const currentTheme = themes[gameState.themeMode];
  const styles = createStyles(currentTheme);
  const questToEdit =
    editingQuestId === null
      ? null
      : gameState.quests.find(quest => quest.id === editingQuestId) ?? null;

  useEffect(() => {
    let isMounted = true;

    const hydrateGameState = async () => {
      const storedGameState = await loadStoredGameState<GameState>();
      const legacyQuests = storedGameState
        ? null
        : await loadLegacyStoredQuests<Quest>();

      if (!isMounted) {
        return;
      }

      if (storedGameState !== null) {
        setGameState(normalizeStoredGameState(storedGameState));
      } else if (legacyQuests !== null) {
        setGameState(migrateLegacyQuests(legacyQuests));
      }

      setIsHydrated(true);
    };

    hydrateGameState();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    saveStoredGameState(gameState);
  }, [gameState, isHydrated]);

  const returnToBoard = () => {
    setEditingQuestId(null);
    setCurrentScreen('quest-board');
  };

  const handleSaveQuest = (quest: Quest) => {
    const normalizedQuest = normalizeQuest(quest);

    setGameState(currentState => {
      const existingQuest = currentState.quests.find(
        currentQuest => currentQuest.id === normalizedQuest.id,
      );
      const nextQuests = existingQuest
        ? currentState.quests.map(currentQuest =>
            currentQuest.id === normalizedQuest.id
              ? normalizedQuest
              : currentQuest,
          )
        : [normalizedQuest, ...currentState.quests];
      const unlockedAchievementIds = getUnlockedAchievementIds({
        hero: currentState.hero,
        quests: nextQuests,
        existingUnlockedAchievementIds: currentState.unlockedAchievementIds,
      });

      return {
        ...currentState,
        quests: nextQuests,
        unlockedAchievementIds,
      };
    });
    returnToBoard();
  };

  const handleDeleteQuest = (questId: string) => {
    setGameState(currentState => {
      const nextQuests = currentState.quests.filter(quest => quest.id !== questId);

      return {
        ...currentState,
        quests: nextQuests,
        unlockedAchievementIds: getUnlockedAchievementIds({
          hero: currentState.hero,
          quests: nextQuests,
          existingUnlockedAchievementIds: currentState.unlockedAchievementIds,
        }),
      };
    });
    returnToBoard();
  };

  const handleCompleteQuest = (questId: string) => {
    setGameState(currentState => {
      const questToComplete = currentState.quests.find(
        quest => quest.id === questId,
      );

      if (!questToComplete || questToComplete.status === 'Completed') {
        return currentState;
      }

      const updatedXp =
        currentState.hero.xp +
        completionXpByDifficulty[questToComplete.difficulty];
      const updatedStreak = getNextStreakProgress(
        currentState.hero.streakCount,
        currentState.hero.lastCompletedDate,
        getDateKey(),
      );

      setCompletionFeedback({
        questTitle: questToComplete.title,
        xpGained: completionXpByDifficulty[questToComplete.difficulty],
      });

      return {
        ...currentState,
        hero: createHeroProgress(
          updatedXp,
          updatedStreak.streakCount,
          updatedStreak.lastCompletedDate,
        ),
        quests: currentState.quests.map(quest =>
          quest.id === questId ? { ...quest, status: 'Completed' } : quest,
        ),
        unlockedAchievementIds: getUnlockedAchievementIds({
          hero: createHeroProgress(
            updatedXp,
            updatedStreak.streakCount,
            updatedStreak.lastCompletedDate,
          ),
          quests: currentState.quests.map(quest =>
            quest.id === questId ? { ...quest, status: 'Completed' } : quest,
          ),
          existingUnlockedAchievementIds: currentState.unlockedAchievementIds,
        }),
      };
    });
  };

  const handleToggleTheme = () => {
    setGameState(currentState => ({
      ...currentState,
      themeMode: currentState.themeMode === 'dark' ? 'light' : 'dark',
    }));
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
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
        ) : (
          <>
            {currentScreen === 'quest-board' ? (
              <QuestBoardScreen
                completionFeedback={completionFeedback}
                hero={gameState.hero}
                onCompleteQuest={handleCompleteQuest}
                onEditQuest={questId => {
                  setEditingQuestId(questId);
                  setCurrentScreen('add-quest');
                }}
                onNavigateToAddQuest={() => {
                  setEditingQuestId(null);
                  setCurrentScreen('add-quest');
                }}
                onNavigateToProgress={() => setCurrentScreen('progress')}
                onToggleTheme={handleToggleTheme}
                quests={gameState.quests}
                styles={styles}
                themeMode={gameState.themeMode}
              />
            ) : currentScreen === 'progress' ? (
              <ProgressScreen
                hero={gameState.hero}
                onBack={() => setCurrentScreen('quest-board')}
                onToggleTheme={handleToggleTheme}
                quests={gameState.quests}
                styles={styles}
                themeMode={gameState.themeMode}
                unlockedAchievementIds={gameState.unlockedAchievementIds}
              />
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
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function createStyles(theme: ThemePalette) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 36,
    },
    loadingState: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
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
      backgroundColor: theme.surfaceHigh,
      borderColor: theme.ghostBorder,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    themeToggleText: {
      color: theme.textPrimary,
      fontSize: 13,
      fontWeight: '700',
    },
    backButton: {
      backgroundColor: theme.surfaceHigh,
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
      color: theme.textMuted,
      fontSize: 12,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
    },
    kicker: {
      color: theme.textMuted,
      fontSize: 13,
      letterSpacing: 2,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    title: {
      color: theme.textPrimary,
      fontSize: 36,
      fontWeight: '700',
      letterSpacing: -0.8,
    },
    subtitle: {
      color: theme.subtitle,
      fontSize: 15,
      lineHeight: 22,
      marginTop: 10,
      maxWidth: 320,
    },
    heroCard: {
      backgroundColor: theme.surface,
      borderColor: theme.ghostBorder,
      borderRadius: 24,
      borderWidth: 1,
      marginTop: 24,
      padding: 20,
      shadowColor: theme.amber,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
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
      backgroundColor: theme.amber,
      borderRadius: 20,
      height: 20,
      shadowColor: theme.amber,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      width: 20,
    },
    heroStatsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 22,
    },
    heroStat: {
      backgroundColor: theme.surfaceHigh,
      borderRadius: 18,
      flexGrow: 1,
      flexBasis: '30%',
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
    },
    completionBanner: {
      backgroundColor: theme.surface,
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
    },
    primaryActionButton: {
      alignItems: 'center',
      backgroundColor: theme.amber,
      borderRadius: 18,
      marginTop: 10,
      paddingHorizontal: 18,
      paddingVertical: 16,
    },
    primaryActionText: {
      color: theme.buttonText,
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 0.4,
    },
    secondaryActionButton: {
      alignItems: 'center',
      backgroundColor: theme.surfaceHigh,
      borderColor: theme.ghostBorder,
      borderRadius: 18,
      borderWidth: 1,
      marginTop: 12,
      paddingHorizontal: 18,
      paddingVertical: 16,
    },
    secondaryActionText: {
      color: theme.textPrimary,
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
      backgroundColor: theme.activeBadgeBackground,
      borderColor: theme.ghostBorder,
    },
    optionChipText: {
      color: theme.textMuted,
      fontSize: 14,
      fontWeight: '600',
    },
    optionChipTextSelected: {
      color: theme.amberSoft,
    },
    saveButton: {
      alignItems: 'center',
      backgroundColor: theme.amber,
      borderRadius: 18,
      marginTop: 22,
      paddingHorizontal: 18,
      paddingVertical: 16,
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
    },
    questCardCompleted: {
      backgroundColor: theme.surfaceHighest,
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
      backgroundColor: theme.activeBadgeBackground,
    },
    statusBadgeDone: {
      backgroundColor: theme.doneBadgeBackground,
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
      backgroundColor: theme.surfaceHigh,
      borderRadius: 16,
      flex: 1,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    metaPillHighlight: {
      backgroundColor: `${theme.blue}20`,
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
      backgroundColor: theme.surfaceHigh,
      borderColor: theme.ghostBorder,
      borderRadius: 16,
      borderWidth: 1,
      marginTop: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    completeButtonText: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '700',
    },
    cardSecondaryButton: {
      alignItems: 'center',
      backgroundColor: theme.surfaceHigh,
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
