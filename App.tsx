import React, { useEffect, useState } from 'react';
import {
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
type ScreenName = 'quest-board' | 'add-quest';
type RankTitle = 'Novice' | 'Adventurer' | 'Knight' | 'Champion';

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
};

type GameState = {
  hero: HeroProgress;
  quests: Quest[];
};

const theme = {
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
  ghostBorder: 'rgba(156, 143, 120, 0.18)',
  success: '#88d498',
};

const difficultyOptions: Difficulty[] = ['Easy', 'Medium', 'Hard', 'Epic'];
const categoryOptions: Category[] = ['Main Quest', 'Side Quest'];

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

const rankThresholds: Array<{ minimumXp: number; title: RankTitle }> = [
  { minimumXp: 100, title: 'Champion' },
  { minimumXp: 50, title: 'Knight' },
  { minimumXp: 20, title: 'Adventurer' },
  { minimumXp: 0, title: 'Novice' },
];

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

function createHeroProgress(xp: number): HeroProgress {
  return {
    xp,
    rankTitle: getRankTitleForXp(xp),
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
  const startingXp = calculateCompletedQuestXp(normalizedQuests);

  return {
    hero: createHeroProgress(startingXp),
    quests: normalizedQuests,
  };
}

function migrateLegacyQuests(quests: Quest[]): GameState {
  const normalizedQuests = quests.map(normalizeQuest);
  const heroXp = calculateCompletedQuestXp(normalizedQuests);

  return {
    hero: createHeroProgress(heroXp),
    quests: normalizedQuests,
  };
}

function normalizeStoredGameState(state: GameState): GameState {
  const normalizedQuests = state.quests.map(normalizeQuest);
  const normalizedXp =
    typeof state.hero?.xp === 'number'
      ? state.hero.xp
      : calculateCompletedQuestXp(normalizedQuests);

  return {
    hero: createHeroProgress(normalizedXp),
    quests: normalizedQuests,
  };
}

function HeroStat({
  label,
  value,
  accentStyle,
}: {
  label: string;
  value: string;
  accentStyle?: object;
}) {
  return (
    <View style={styles.heroStat}>
      <Text style={styles.heroStatLabel}>{label}</Text>
      <Text style={[styles.heroStatValue, accentStyle]}>{value}</Text>
    </View>
  );
}

function SectionPicker({
  label,
  options,
  selectedValue,
  onSelect,
  testIdPrefix,
}: {
  label: string;
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
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

function QuestCard({
  quest,
  onComplete,
}: {
  quest: Quest;
  onComplete?: (questId: string) => void;
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
    </View>
  );
}

function QuestBoardScreen({
  hero,
  quests,
  onCompleteQuest,
  onNavigateToAddQuest,
}: {
  hero: HeroProgress;
  quests: Quest[];
  onCompleteQuest: (questId: string) => void;
  onNavigateToAddQuest: () => void;
}) {
  const mainQuests = quests.filter(
    quest => quest.category === 'Main Quest' && quest.status !== 'Completed',
  );
  const sideQuests = quests.filter(
    quest => quest.category === 'Side Quest' && quest.status !== 'Completed',
  );
  const completedQuests = quests.filter(quest => quest.status === 'Completed');

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.kicker}>Daily Quest Log</Text>
      <Text style={styles.title}>Quest Forge</Text>
      <Text style={styles.subtitle}>
        Turn your everyday tasks into a progression path worth chasing.
      </Text>

      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroEyebrow}>Hero Overview</Text>
            <Text style={styles.heroTitle}>
              Rank Title: {hero.rankTitle}
            </Text>
          </View>
          <View style={styles.heroOrb} />
        </View>

        <View style={styles.heroStatsRow}>
          <HeroStat
            label="Level"
            value={getLevelForXp(hero.xp)}
            accentStyle={styles.levelAccent}
          />
          <HeroStat
            label="XP"
            value={`${hero.xp}`}
            accentStyle={styles.xpAccent}
          />
        </View>
      </View>

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
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Main Quest</Text>
        {mainQuests.map(quest => (
          <QuestCard
            key={quest.id}
            onComplete={onCompleteQuest}
            quest={quest}
          />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Side Quests</Text>
        {sideQuests.map(quest => (
          <QuestCard
            key={quest.id}
            onComplete={onCompleteQuest}
            quest={quest}
          />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Completed Quests</Text>
        {completedQuests.map(quest => (
          <QuestCard key={quest.id} quest={quest} />
        ))}
      </View>
    </ScrollView>
  );
}

function AddQuestScreen({
  onBack,
  onSave,
}: {
  onBack: () => void;
  onSave: (quest: Quest) => void;
}) {
  const [questTitle, setQuestTitle] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty>('Easy');
  const [selectedCategory, setSelectedCategory] =
    useState<Category>('Side Quest');

  const canSaveQuest = questTitle.trim().length > 0;

  const handleSaveQuest = () => {
    const title = questTitle.trim();

    if (!title) {
      return;
    }

    onSave({
      id: createQuestId(),
      title,
      difficulty: selectedDifficulty,
      xpReward: completionXpByDifficulty[selectedDifficulty],
      status: 'Ready',
      category: selectedCategory,
    });

    setQuestTitle('');
    setSelectedDifficulty('Easy');
    setSelectedCategory('Side Quest');
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
      </View>

      <Text style={styles.kicker}>Add Quest</Text>
      <Text style={styles.title}>Forge New Quest</Text>
      <Text style={styles.subtitle}>
        Create a new mission and send it back to the Quest Board instantly.
      </Text>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Quest Details</Text>
        <Text style={styles.formIntro}>
          Keep this screen focused on creating one new quest at a time.
        </Text>

        <View style={styles.formField}>
          <Text style={styles.formLabel}>Quest Title</Text>
          <TextInput
            onChangeText={setQuestTitle}
            placeholder="Enter a new quest title"
            placeholderTextColor="#7e766b"
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
          testIdPrefix="difficulty-option"
        />

        <SectionPicker
          label="Category"
          onSelect={value => setSelectedCategory(value as Category)}
          options={categoryOptions}
          selectedValue={selectedCategory}
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
          <Text style={styles.saveButtonText}>Save Quest</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function App() {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState);
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('quest-board');
  const [isHydrated, setIsHydrated] = useState(false);

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

  const handleSaveQuest = (quest: Quest) => {
    setGameState(currentState => ({
      ...currentState,
      quests: [normalizeQuest(quest), ...currentState.quests],
    }));
    setCurrentScreen('quest-board');
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
        currentState.hero.xp + completionXpByDifficulty[questToComplete.difficulty];

      return {
        hero: createHeroProgress(updatedXp),
        quests: currentState.quests.map(quest =>
          quest.id === questId ? { ...quest, status: 'Completed' } : quest,
        ),
      };
    });
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={theme.background} />
        {!isHydrated ? (
          <View style={styles.loadingState}>
            <Text style={styles.loadingKicker}>Restoring Quest Log</Text>
            <Text style={styles.loadingTitle}>Quest Forge</Text>
          </View>
        ) : (
          <>
            {currentScreen === 'quest-board' ? (
              <QuestBoardScreen
                hero={gameState.hero}
                onCompleteQuest={handleCompleteQuest}
                onNavigateToAddQuest={() => setCurrentScreen('add-quest')}
                quests={gameState.quests}
              />
            ) : (
              <AddQuestScreen
                onBack={() => setCurrentScreen('quest-board')}
                onSave={handleSaveQuest}
              />
            )}
          </>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
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
  screenHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
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
    color: '#b3aba0',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    maxWidth: 300,
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
    gap: 12,
    marginTop: 22,
  },
  heroStat: {
    backgroundColor: theme.surfaceHigh,
    borderRadius: 18,
    flex: 1,
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
  boardActionCard: {
    backgroundColor: theme.surface,
    borderColor: theme.ghostBorder,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 28,
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
    color: '#402d00',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.4,
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
    color: '#b3aba0',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 18,
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
    backgroundColor: 'rgba(255, 191, 0, 0.16)',
    borderColor: 'rgba(255, 191, 0, 0.26)',
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
    backgroundColor: '#6e5b22',
    opacity: 0.55,
  },
  saveButtonText: {
    color: '#402d00',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  section: {
    marginTop: 28,
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
    backgroundColor: 'rgba(255, 191, 0, 0.16)',
  },
  statusBadgeDone: {
    backgroundColor: 'rgba(136, 212, 152, 0.16)',
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
    backgroundColor: 'rgba(0, 210, 253, 0.12)',
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
});

export default App;
