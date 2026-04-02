const http = require('http');
const { Buffer } = require('buffer');
const fs = require('fs/promises');
const path = require('path');

const PORT = 4000;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const dataDirectory = path.join(__dirname, 'data');
const dataFilePath = path.join(dataDirectory, 'game-state.json');
const appConfigFilePath = path.join(dataDirectory, 'app-config.json');

const difficultyOptions = ['Easy', 'Medium', 'Hard', 'Epic'];
const categoryOptions = ['Main Quest', 'Side Quest'];
const sortOptions = [
  'Newest first',
  'Oldest first',
  'Difficulty ascending',
  'Difficulty descending',
  'Title A-Z',
];
const completionXpByDifficulty = {
  Easy: 10,
  Medium: 20,
  Hard: 35,
  Epic: 50,
};
const achievementDefinitions = [
  'first-quest',
  'quest-finisher',
  'rising-hero',
  'streak-keeper',
  'quest-master',
];
const rankThresholds = [
  { minimumXp: 100, title: 'Champion' },
  { minimumXp: 50, title: 'Knight' },
  { minimumXp: 20, title: 'Adventurer' },
  { minimumXp: 0, title: 'Novice' },
];

const defaultGameState = {
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

const defaultAppConfig = {
  configVersion: 1,
  boardKicker: 'Daily Quest Log',
  boardSubtitle: 'Turn your everyday tasks into a progression path worth chasing.',
  heroEyebrow: 'Hero Overview',
  realmSyncMessage: 'Refresh this screen to pull the latest board copy from the backend.',
  suggestionSectionTitle: 'Daily Suggestions',
  addQuestSectionTitle: 'Forge New Quest',
  filterSectionTitle: 'Search And Filter',
  mainQuestSectionTitle: 'Main Quest',
  sideQuestSectionTitle: 'Side Quests',
  completedQuestSectionTitle: 'Completed Quests',
  progressKicker: 'Profile',
  progressTitle: 'Hero Summary',
  progressSubtitle: 'Track the progress you have forged from quests already living in your current log.',
  progressHeroEyebrow: 'Current Progress',
  progressSectionTitle: 'Quest Progress',
  progressSectionIntro: 'This screen summarizes the quest board without creating any new data or changing your current flow.',
  achievementSectionTitle: 'Achievements',
  achievementSectionIntro: 'Badges unlock automatically from the progress you already build on the quest board.',
};

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
];

function createQuestId() {
  return `quest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey) {
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

function getDateDifferenceInDays(fromDateKey, toDateKey) {
  const fromDate = parseDateKey(fromDateKey);
  const toDate = parseDateKey(toDateKey);

  if (!fromDate || !toDate) {
    return null;
  }

  return Math.round((toDate.getTime() - fromDate.getTime()) / DAY_IN_MS);
}

function normalizeStreakProgress(streakCount, lastCompletedDate) {
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

function getNextStreakProgress(streakCount, lastCompletedDate, completedDateKey) {
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

function getRankTitleForXp(xp) {
  return rankThresholds.find(threshold => xp >= threshold.minimumXp)?.title ?? 'Novice';
}

function createHeroProgress(xp, streakCount = 0, lastCompletedDate = null) {
  const normalizedStreak = normalizeStreakProgress(streakCount, lastCompletedDate);

  return {
    xp,
    rankTitle: getRankTitleForXp(xp),
    streakCount: normalizedStreak.streakCount,
    lastCompletedDate: normalizedStreak.lastCompletedDate,
  };
}

function calculateCompletedQuestXp(quests) {
  return quests.reduce((totalXp, quest) => {
    if (quest.status !== 'Completed') {
      return totalXp;
    }

    return totalXp + completionXpByDifficulty[quest.difficulty];
  }, 0);
}

function normalizeQuest(quest) {
  const difficulty = difficultyOptions.includes(quest?.difficulty)
    ? quest.difficulty
    : 'Easy';
  const category = categoryOptions.includes(quest?.category)
    ? quest.category
    : 'Side Quest';
  const status = ['Ready', 'In Progress', 'Completed'].includes(quest?.status)
    ? quest.status
    : 'Ready';
  const title = typeof quest?.title === 'string' && quest.title.trim().length > 0
    ? quest.title.trim()
    : 'Untitled Quest';

  return {
    id: typeof quest?.id === 'string' && quest.id.length > 0 ? quest.id : createQuestId(),
    title,
    difficulty,
    xpReward: completionXpByDifficulty[difficulty],
    status,
    category,
    createdAt: typeof quest?.createdAt === 'number' ? quest.createdAt : Date.now(),
  };
}

function getProgressStats(quests) {
  const totalCompleted = quests.filter(quest => quest.status === 'Completed').length;

  return {
    totalCreated: quests.length,
    totalCompleted,
    activeCount: quests.length - totalCompleted,
    completedCount: totalCompleted,
  };
}

function shouldUnlockAchievement({ achievementId, hero, quests, stats }) {
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
}) {
  const stats = getProgressStats(quests);
  const unlockedAchievementIds = new Set(existingUnlockedAchievementIds);

  achievementDefinitions.forEach(achievementId => {
    if (
      shouldUnlockAchievement({
        achievementId,
        hero,
        quests,
        stats,
      })
    ) {
      unlockedAchievementIds.add(achievementId);
    }
  });

  return achievementDefinitions.filter(achievementId =>
    unlockedAchievementIds.has(achievementId),
  );
}

function normalizeGameState(gameState) {
  const normalizedQuests = Array.isArray(gameState?.quests)
    ? gameState.quests.map(normalizeQuest)
    : [];
  const normalizedXp =
    typeof gameState?.hero?.xp === 'number'
      ? gameState.hero.xp
      : calculateCompletedQuestXp(normalizedQuests);
  const hero = createHeroProgress(
    normalizedXp,
    gameState?.hero?.streakCount,
    gameState?.hero?.lastCompletedDate ?? null,
  );

  return {
    hero,
    quests: normalizedQuests,
    themeMode: gameState?.themeMode === 'light' ? 'light' : 'dark',
    sortOption: sortOptions.includes(gameState?.sortOption)
      ? gameState.sortOption
      : 'Newest first',
    unlockedAchievementIds: getUnlockedAchievementIds({
      hero,
      quests: normalizedQuests,
      existingUnlockedAchievementIds: Array.isArray(
        gameState?.unlockedAchievementIds,
      )
        ? gameState.unlockedAchievementIds
        : [],
    }),
  };
}

function normalizeTextField(value, fallbackValue) {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : fallbackValue;
}

function getDailySuggestions(dateKey, quests) {
  const existingQuestTitles = new Set(
    quests.map(quest => quest.title.trim().toLowerCase()),
  );
  const startingIndex =
    Number(dateKey.replace(/-/g, '')) % suggestionTemplates.length;
  const suggestions = [];

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

function normalizeAppConfig(appConfig) {
  return {
    configVersion:
      typeof appConfig?.configVersion === 'number' && appConfig.configVersion > 0
        ? Math.floor(appConfig.configVersion)
        : defaultAppConfig.configVersion,
    boardKicker: normalizeTextField(
      appConfig?.boardKicker,
      defaultAppConfig.boardKicker,
    ),
    boardSubtitle: normalizeTextField(
      appConfig?.boardSubtitle,
      defaultAppConfig.boardSubtitle,
    ),
    heroEyebrow: normalizeTextField(
      appConfig?.heroEyebrow,
      defaultAppConfig.heroEyebrow,
    ),
    realmSyncMessage: normalizeTextField(
      appConfig?.realmSyncMessage,
      defaultAppConfig.realmSyncMessage,
    ),
    suggestionSectionTitle: normalizeTextField(
      appConfig?.suggestionSectionTitle,
      defaultAppConfig.suggestionSectionTitle,
    ),
    addQuestSectionTitle: normalizeTextField(
      appConfig?.addQuestSectionTitle,
      defaultAppConfig.addQuestSectionTitle,
    ),
    filterSectionTitle: normalizeTextField(
      appConfig?.filterSectionTitle,
      defaultAppConfig.filterSectionTitle,
    ),
    mainQuestSectionTitle: normalizeTextField(
      appConfig?.mainQuestSectionTitle,
      defaultAppConfig.mainQuestSectionTitle,
    ),
    sideQuestSectionTitle: normalizeTextField(
      appConfig?.sideQuestSectionTitle,
      defaultAppConfig.sideQuestSectionTitle,
    ),
    completedQuestSectionTitle: normalizeTextField(
      appConfig?.completedQuestSectionTitle,
      defaultAppConfig.completedQuestSectionTitle,
    ),
    progressKicker: normalizeTextField(
      appConfig?.progressKicker,
      defaultAppConfig.progressKicker,
    ),
    progressTitle: normalizeTextField(
      appConfig?.progressTitle,
      defaultAppConfig.progressTitle,
    ),
    progressSubtitle: normalizeTextField(
      appConfig?.progressSubtitle,
      defaultAppConfig.progressSubtitle,
    ),
    progressHeroEyebrow: normalizeTextField(
      appConfig?.progressHeroEyebrow,
      defaultAppConfig.progressHeroEyebrow,
    ),
    progressSectionTitle: normalizeTextField(
      appConfig?.progressSectionTitle,
      defaultAppConfig.progressSectionTitle,
    ),
    progressSectionIntro: normalizeTextField(
      appConfig?.progressSectionIntro,
      defaultAppConfig.progressSectionIntro,
    ),
    achievementSectionTitle: normalizeTextField(
      appConfig?.achievementSectionTitle,
      defaultAppConfig.achievementSectionTitle,
    ),
    achievementSectionIntro: normalizeTextField(
      appConfig?.achievementSectionIntro,
      defaultAppConfig.achievementSectionIntro,
    ),
  };
}

function buildNextGameState(currentGameState, updates) {
  const nextHero = updates.hero ?? currentGameState.hero;
  const nextQuests = updates.quests ?? currentGameState.quests;

  return normalizeGameState({
    hero: nextHero,
    quests: nextQuests,
    themeMode: updates.themeMode ?? currentGameState.themeMode,
    sortOption: updates.sortOption ?? currentGameState.sortOption,
    unlockedAchievementIds: getUnlockedAchievementIds({
      hero: nextHero,
      quests: nextQuests,
      existingUnlockedAchievementIds: currentGameState.unlockedAchievementIds,
    }),
  });
}

function isValidGameState(gameState) {
  return (
    typeof gameState === 'object' &&
    gameState !== null &&
    typeof gameState.hero === 'object' &&
    Array.isArray(gameState.quests) &&
    typeof gameState.themeMode === 'string'
  );
}

function isValidQuestDraft(questDraft) {
  return (
    typeof questDraft === 'object' &&
    questDraft !== null &&
    typeof questDraft.title === 'string' &&
    questDraft.title.trim().length > 0 &&
    difficultyOptions.includes(questDraft.difficulty) &&
    categoryOptions.includes(questDraft.category)
  );
}

function isValidThemeMode(themeMode) {
  return themeMode === 'dark' || themeMode === 'light';
}

function isValidSortOption(sortOption) {
  return sortOptions.includes(sortOption);
}

async function ensureJsonFile(filePath, defaultValue) {
  await fs.mkdir(dataDirectory, { recursive: true });

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2), 'utf8');
  }
}

async function readJsonFile(filePath, defaultValue) {
  await ensureJsonFile(filePath, defaultValue);
  const rawValue = await fs.readFile(filePath, 'utf8');

  return JSON.parse(rawValue);
}

async function writeJsonFile(filePath, value) {
  await ensureJsonFile(filePath, value);
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
}

async function writeGameState(gameState) {
  await writeJsonFile(dataFilePath, gameState);
}

async function readGameState() {
  const normalizedGameState = normalizeGameState(
    await readJsonFile(dataFilePath, normalizeGameState(defaultGameState)),
  );

  await writeGameState(normalizedGameState);

  return normalizedGameState;
}

async function writeAppConfig(appConfig) {
  await writeJsonFile(appConfigFilePath, appConfig);
}

async function readAppConfig() {
  const normalizedAppConfig = normalizeAppConfig(
    await readJsonFile(appConfigFilePath, normalizeAppConfig(defaultAppConfig)),
  );

  await writeAppConfig(normalizedAppConfig);

  return normalizedAppConfig;
}

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(body));
}

async function readRequestBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');

  return rawBody ? JSON.parse(rawBody) : null;
}

function getQuestRouteMatch(url) {
  const completeMatch = url.match(/^\/quests\/([^/]+)\/complete$/);

  if (completeMatch) {
    return {
      questId: decodeURIComponent(completeMatch[1]),
      action: 'complete',
    };
  }

  const questMatch = url.match(/^\/quests\/([^/]+)$/);

  if (questMatch) {
    return {
      questId: decodeURIComponent(questMatch[1]),
      action: 'quest',
    };
  }

  return null;
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (req.url === '/health' && req.method === 'GET') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (req.url === '/app-config' && req.method === 'GET') {
    try {
      const appConfig = await readAppConfig();
      sendJson(res, 200, appConfig);
    } catch (error) {
      sendJson(res, 500, {
        error: 'Unable to read app config.',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return;
  }

  if (req.url === '/daily-suggestions' && req.method === 'GET') {
    try {
      const gameState = await readGameState();
      const suggestionDateKey = getDateKey();
      sendJson(res, 200, {
        suggestionDateKey,
        suggestions: getDailySuggestions(suggestionDateKey, gameState.quests),
      });
    } catch (error) {
      sendJson(res, 500, {
        error: 'Unable to read daily suggestions.',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return;
  }

  if (req.url === '/game-state' && req.method === 'GET') {
    try {
      const gameState = await readGameState();
      sendJson(res, 200, gameState);
    } catch (error) {
      sendJson(res, 500, {
        error: 'Unable to read game state.',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return;
  }

  if (req.url === '/game-state' && req.method === 'PUT') {
    try {
      const nextGameState = await readRequestBody(req);

      if (!isValidGameState(nextGameState)) {
        sendJson(res, 400, {
          error: 'Invalid game state payload.',
        });
        return;
      }

      const normalizedGameState = normalizeGameState(nextGameState);
      await writeGameState(normalizedGameState);
      sendJson(res, 200, normalizedGameState);
    } catch (error) {
      sendJson(res, 500, {
        error: 'Unable to write game state.',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return;
  }

  if (req.url === '/quests' && req.method === 'POST') {
    try {
      const questDraft = await readRequestBody(req);

      if (!isValidQuestDraft(questDraft)) {
        sendJson(res, 400, {
          error: 'Invalid quest payload.',
        });
        return;
      }

      const currentGameState = await readGameState();
      const nextQuest = normalizeQuest({
        title: questDraft.title,
        difficulty: questDraft.difficulty,
        category: questDraft.category,
        status: 'Ready',
      });
      const nextGameState = buildNextGameState(currentGameState, {
        quests: [nextQuest, ...currentGameState.quests],
      });

      await writeGameState(nextGameState);
      sendJson(res, 200, { gameState: nextGameState });
    } catch (error) {
      sendJson(res, 500, {
        error: 'Unable to create quest.',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return;
  }

  const questRouteMatch = getQuestRouteMatch(req.url || '');

  if (questRouteMatch?.action === 'quest' && req.method === 'PUT') {
    try {
      const questDraft = await readRequestBody(req);

      if (!isValidQuestDraft(questDraft)) {
        sendJson(res, 400, {
          error: 'Invalid quest payload.',
        });
        return;
      }

      const currentGameState = await readGameState();
      const questToUpdate = currentGameState.quests.find(
        quest => quest.id === questRouteMatch.questId,
      );

      if (!questToUpdate) {
        sendJson(res, 404, {
          error: 'Quest not found.',
        });
        return;
      }

      const updatedQuest = normalizeQuest({
        ...questToUpdate,
        title: questDraft.title,
        difficulty: questDraft.difficulty,
        category: questDraft.category,
      });
      const nextGameState = buildNextGameState(currentGameState, {
        quests: currentGameState.quests.map(quest =>
          quest.id === questRouteMatch.questId ? updatedQuest : quest,
        ),
      });

      await writeGameState(nextGameState);
      sendJson(res, 200, { gameState: nextGameState });
    } catch (error) {
      sendJson(res, 500, {
        error: 'Unable to update quest.',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return;
  }

  if (questRouteMatch?.action === 'quest' && req.method === 'DELETE') {
    try {
      const currentGameState = await readGameState();
      const nextQuests = currentGameState.quests.filter(
        quest => quest.id !== questRouteMatch.questId,
      );

      if (nextQuests.length === currentGameState.quests.length) {
        sendJson(res, 404, {
          error: 'Quest not found.',
        });
        return;
      }

      const nextGameState = buildNextGameState(currentGameState, {
        quests: nextQuests,
      });

      await writeGameState(nextGameState);
      sendJson(res, 200, { gameState: nextGameState });
    } catch (error) {
      sendJson(res, 500, {
        error: 'Unable to delete quest.',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return;
  }

  if (questRouteMatch?.action === 'complete' && req.method === 'POST') {
    try {
      const currentGameState = await readGameState();
      const questToComplete = currentGameState.quests.find(
        quest => quest.id === questRouteMatch.questId,
      );

      if (!questToComplete) {
        sendJson(res, 404, {
          error: 'Quest not found.',
        });
        return;
      }

      if (questToComplete.status === 'Completed') {
        sendJson(res, 200, {
          gameState: currentGameState,
          completionFeedback: null,
        });
        return;
      }

      const xpGained = completionXpByDifficulty[questToComplete.difficulty];
      const updatedStreak = getNextStreakProgress(
        currentGameState.hero.streakCount,
        currentGameState.hero.lastCompletedDate,
        getDateKey(),
      );
      const nextHero = createHeroProgress(
        currentGameState.hero.xp + xpGained,
        updatedStreak.streakCount,
        updatedStreak.lastCompletedDate,
      );
      const nextGameState = buildNextGameState(currentGameState, {
        hero: nextHero,
        quests: currentGameState.quests.map(quest =>
          quest.id === questRouteMatch.questId
            ? { ...quest, status: 'Completed' }
            : quest,
        ),
      });

      await writeGameState(nextGameState);
      sendJson(res, 200, {
        gameState: nextGameState,
        completionFeedback: {
          questTitle: questToComplete.title,
          xpGained,
        },
      });
    } catch (error) {
      sendJson(res, 500, {
        error: 'Unable to complete quest.',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return;
  }

  if (req.url === '/preferences/theme' && req.method === 'PUT') {
    try {
      const payload = await readRequestBody(req);

      if (!isValidThemeMode(payload?.themeMode)) {
        sendJson(res, 400, {
          error: 'Invalid theme payload.',
        });
        return;
      }

      const currentGameState = await readGameState();
      const nextGameState = buildNextGameState(currentGameState, {
        themeMode: payload.themeMode,
      });

      await writeGameState(nextGameState);
      sendJson(res, 200, { gameState: nextGameState });
    } catch (error) {
      sendJson(res, 500, {
        error: 'Unable to update theme.',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return;
  }

  if (req.url === '/preferences/sort' && req.method === 'PUT') {
    try {
      const payload = await readRequestBody(req);

      if (!isValidSortOption(payload?.sortOption)) {
        sendJson(res, 400, {
          error: 'Invalid sort payload.',
        });
        return;
      }

      const currentGameState = await readGameState();
      const nextGameState = buildNextGameState(currentGameState, {
        sortOption: payload.sortOption,
      });

      await writeGameState(nextGameState);
      sendJson(res, 200, { gameState: nextGameState });
    } catch (error) {
      sendJson(res, 500, {
        error: 'Unable to update sort preference.',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return;
  }

  sendJson(res, 404, {
    error: 'Route not found.',
  });
});

server.listen(PORT, () => {
  console.log(`QuestForge backend running at http://localhost:${PORT}`);
});


