const http = require('http');
const { Buffer } = require('buffer');
const fs = require('fs/promises');
const path = require('path');

const PORT = 4000;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const dataDirectory = path.join(__dirname, 'data');
const dataFilePath = path.join(dataDirectory, 'game-state.json');
const appConfigFilePath = path.join(dataDirectory, 'app-config.json');
const questPoolFilePath = path.join(dataDirectory, 'quest-pool.json');

const difficultyOptions = ['Easy', 'Medium', 'Hard', 'Epic'];
const categoryOptions = ['Main Quest', 'Side Quest'];
const questTagOptions = [
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
const defaultQuestSectionOrder = ['main', 'side', 'completed'];
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
    name: 'Crimson Vault',
    dark: {
      background: '#140C10',
      surfaceLow: '#1D1218',
      surface: '#271822',
      surfaceHigh: '#32202D',
      surfaceHighest: '#40283A',
      textPrimary: '#FFF7F9',
      textMuted: '#D4B7C2',
      primaryAccent: '#E5485D',
      primaryAccentSoft: '#5E1F2B',
      secondaryAccent: '#F29C38',
      secondaryAccentSoft: '#5A3616',
      success: '#45C486',
      border: '#563546',
      subtitle: '#EACFDA',
      placeholder: '#A68895',
      buttonText: '#FFF8FA',
    },
    light: {
      background: '#FFF8FA',
      surfaceLow: '#FCEEF2',
      surface: '#FFFFFF',
      surfaceHigh: '#FFF0F3',
      surfaceHighest: '#EEF6FC',
      textPrimary: '#3A2028',
      textMuted: '#7D626C',
      primaryAccent: '#CF2F49',
      primaryAccentSoft: '#FFD6DE',
      secondaryAccent: '#D47A16',
      secondaryAccentSoft: '#F7DFC2',
      success: '#2DAA66',
      border: '#ECD8DF',
      subtitle: '#5A3A45',
      placeholder: '#9A828C',
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
};

function toRgba(hex, alpha) {
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

function buildThemePaletteFromPreset(presetPalette) {
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

const themePackMetadata = {
  'celestial-bazaar': {
    presetKey: 'celestialBazaar',
    description: 'Gold market glow and crimson sparks.',
    surfaceTone: {
      dark: 'Starlit Silk',
      light: 'Bazaar Marble',
    },
  },
  'moon-garden': {
    presetKey: 'moonGarden',
    description: 'Mint moonlight and orchid mist.',
    surfaceTone: {
      dark: 'Garden Glass',
      light: 'Moon Petal',
    },
  },
  'sunrise-forge': {
    presetKey: 'sunriseForge',
    description: 'Ember orange and forge gold.',
    surfaceTone: {
      dark: 'Molten Steel',
      light: 'Sunwashed Clay',
    },
  },
  'arcade-nova': {
    presetKey: 'arcadeNova',
    description: 'Neon cyan and magenta pulse.',
    surfaceTone: {
      dark: 'Nova Chrome',
      light: 'Pixel Pearl',
    },
  },
  'royal-tide': {
    presetKey: 'royalTide',
    description: 'Tidal blue and royal violet.',
    surfaceTone: {
      dark: 'Tide Crest',
      light: 'Royal Mist',
    },
  },
  'crimson-vault': {
    presetKey: 'crimsonVault',
    description: 'Crimson steel and violet vault.',
    surfaceTone: {
      dark: 'Vault Velvet',
      light: 'Rose Ledger',
    },
  },
  sunspire: {
    presetKey: 'sunspire',
    description: 'Sun gold and sky current.',
    surfaceTone: {
      dark: 'Solar Brass',
      light: 'Dawn Porcelain',
    },
  },
  'verdant-rune': {
    presetKey: 'verdantRune',
    description: 'Verdant emerald and rune lilac.',
    surfaceTone: {
      dark: 'Runed Canopy',
      light: 'Spring Marble',
    },
  },
};

const themeCatalog = Object.fromEntries(
  Object.entries(themePackMetadata).map(([themePackId, metadata]) => {
    const preset = questForgeThemePresets[metadata.presetKey];

    return [
      themePackId,
      {
        name: preset.name,
        description: metadata.description,
        accentEnergy: {
          dark: `${preset.name} ${preset.dark.primaryAccent}`,
          light: `${preset.name} ${preset.light.primaryAccent}`,
        },
        surfaceTone: metadata.surfaceTone,
        previewSwatches: {
          dark: [
            preset.dark.primaryAccent,
            preset.dark.secondaryAccent,
            preset.dark.surface,
          ],
          light: [
            preset.light.primaryAccent,
            preset.light.secondaryAccent,
            preset.light.surface,
          ],
        },
        palette: {
          dark: buildThemePaletteFromPreset(preset.dark),
          light: buildThemePaletteFromPreset(preset.light),
        },
      },
    ];
  }),
);
const themePackOptions = Object.keys(themeCatalog);
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
];

const defaultGameState = {
  hero: {
    xp: 10,
    rankTitle: 'Novice',
    streakCount: 0,
    lastCompletedDate: null,
    activeDateKeys: [getDateKey()],
  },
  quests: [
    {
      id: 'quest-1',
      title: 'Defeat the Laundry Dragon',
      description:
        'Clear the laundry pile, sort the essentials, and leave the guild hall ready for the next work cycle.',
      tag: 'Chores',
      dueDate: null,
      startedAt: new Date().toISOString(),
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
  ],
  themeMode: 'dark',
  themePackId: 'celestial-bazaar',
  unlockedAchievementIds: ['first-quest', 'quest-finisher'],
  sortOption: 'Newest first',
};

const defaultAppConfig = {
  configVersion: 1,
  boardKicker: 'Daily Quest Log',
  boardSubtitle: 'Turn your everyday tasks into a progression path worth chasing.',
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
  progressSubtitle: 'See how your quests, streaks, and ranks are shaping your legend.',
  progressHeroEyebrow: 'Current Progress',
  progressSectionTitle: 'Quest Progress',
  progressSectionIntro: 'Review your totals, streaks, and milestones in one place.',
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

function createRelativeDueDate(hoursFromNow) {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
}

const defaultQuestPoolTemplateBlueprints = {
  General: [
    {
      slug: 'survey-quest-ledger',
      title: 'Survey the Quest Ledger',
      description:
        'Review active, stalled, and overdue quests before choosing your next move.',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
    {
      slug: 'choose-keystone-task',
      title: 'Choose the Keystone Task',
      description:
        'Pick the single quest that deserves your full attention first.',
      difficulty: 'Easy',
      category: 'Main Quest',
    },
    {
      slug: 'tidy-digital-satchel',
      title: 'Tidy the Digital Satchel',
      description:
        'Clear stray downloads, screenshots, and loose files from your digital bag.',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
    {
      slug: 'name-next-win',
      title: 'Name the Next Win',
      description:
        'Write down one concrete win you want to finish before the day ends.',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
    {
      slug: 'close-loose-thread',
      title: 'Close the Loose Thread',
      description:
        'Finish one nagging unfinished task that keeps draining your attention.',
      difficulty: 'Medium',
      category: 'Side Quest',
    },
    {
      slug: 'prepare-launch-pad',
      title: "Prepare Tomorrow's Launch Pad",
      description:
        'Leave one important quest set up so tomorrow starts with momentum.',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
  ],
  Chores: [
    {
      slug: 'reclaim-kitchen-counter',
      title: 'Reclaim the Kitchen Counter',
      description:
        'Clear and wipe the kitchen counter so the space feels usable again.',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
    {
      slug: 'sweep-hearth-paths',
      title: 'Sweep the Hearth Paths',
      description:
        'Sweep or vacuum the main walking areas to reset the home base.',
      difficulty: 'Medium',
      category: 'Side Quest',
    },
    {
      slug: 'empty-recycling-cache',
      title: 'Empty the Recycling Cache',
      description:
        'Take out the recycling before it turns into a stacked side quest.',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
    {
      slug: 'reset-bathroom-mirror',
      title: 'Reset the Bathroom Mirror',
      description:
        'Wipe down the sink, mirror, and quick-touch surfaces.',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
    {
      slug: 'change-bedroll-linen',
      title: 'Change the Bedroll Linen',
      description:
        'Swap the sheets and pillowcases to refresh your rest zone.',
      difficulty: 'Medium',
      category: 'Side Quest',
    },
    {
      slug: 'sort-laundry-queue',
      title: 'Sort the Laundry Queue',
      description:
        'Separate clothes and start the next laundry cycle without delay.',
      difficulty: 'Medium',
      category: 'Side Quest',
    },
    {
      slug: 'wipe-dust-sigils',
      title: 'Wipe the Dust Sigils',
      description:
        'Dust one visible zone so the room feels less cluttered and stale.',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
  ],
  Work: [
    {
      slug: 'draft-client-update',
      title: 'Draft the Client Update',
      description:
        'Write a clean status update that makes the next decision easy.',
      difficulty: 'Medium',
      category: 'Main Quest',
      dueHours: 4,
    },
    {
      slug: 'review-sprint-board',
      title: 'Review the Sprint Board',
      description:
        'Sort active work and move blocked tasks into a visible lane.',
      difficulty: 'Medium',
      category: 'Main Quest',
    },
    {
      slug: 'prepare-meeting-brief',
      title: 'Prepare the Meeting Brief',
      description:
        'Gather the talking points, questions, and desired outcomes before the call.',
      difficulty: 'Medium',
      category: 'Main Quest',
      dueHours: 6,
    },
    {
      slug: 'ship-status-summary',
      title: 'Ship the Status Summary',
      description:
        'Send the project summary while the context is still fresh.',
      difficulty: 'Hard',
      category: 'Main Quest',
      dueHours: 3,
    },
    {
      slug: 'organize-project-drive',
      title: 'Organize the Project Drive',
      description:
        'Rename and file the documents the team keeps searching for.',
      difficulty: 'Medium',
      category: 'Side Quest',
    },
    {
      slug: 'refine-portfolio-case-study',
      title: 'Refine the Portfolio Case Study',
      description:
        'Improve one work sample so it better shows your thinking and results.',
      difficulty: 'Hard',
      category: 'Main Quest',
    },
    {
      slug: 'close-approval-loop',
      title: 'Close the Approval Loop',
      description:
        'Follow up on a review, sign-off, or blocker that is holding progress back.',
      difficulty: 'Medium',
      category: 'Main Quest',
    },
    {
      slug: 'outline-next-deliverable',
      title: 'Outline the Next Deliverable',
      description:
        'Break the next work deliverable into a clear first draft plan.',
      difficulty: 'Hard',
      category: 'Main Quest',
    },
  ],
  Study: [
    {
      slug: 'revise-lecture-chapter',
      title: 'Revise One Lecture Chapter',
      description:
        'Review one chapter or lecture section and capture the key ideas.',
      difficulty: 'Medium',
      category: 'Main Quest',
    },
    {
      slug: 'solve-problem-set-round',
      title: 'Solve a Problem Set Round',
      description:
        'Work through a focused set of questions without switching context.',
      difficulty: 'Hard',
      category: 'Main Quest',
    },
    {
      slug: 'build-flashcards-notes',
      title: 'Build Flashcards from Notes',
      description:
        "Turn today's notes into quick prompts you can review later.",
      difficulty: 'Easy',
      category: 'Side Quest',
    },
    {
      slug: 'summarize-reading',
      title: "Summarize Today's Reading",
      description:
        'Write a short summary that proves you understood the material.',
      difficulty: 'Medium',
      category: 'Side Quest',
    },
    {
      slug: 'timed-practice-quiz',
      title: 'Complete a Timed Practice Quiz',
      description:
        'Run a full practice quiz before the study window closes.',
      difficulty: 'Hard',
      category: 'Main Quest',
      dueHours: 2,
    },
    {
      slug: 'review-weak-topic-list',
      title: 'Review the Weak Topic List',
      description:
        'Find the areas you still avoid and choose one to revisit.',
      difficulty: 'Medium',
      category: 'Side Quest',
    },
    {
      slug: 'annotate-course-slides',
      title: 'Annotate the Course Slides',
      description:
        'Mark the slides with examples, reminders, and likely exam points.',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
    {
      slug: 'teach-topic-back',
      title: 'Teach the Topic Back',
      description:
        'Explain the topic aloud as if you are teaching it to someone else.',
      difficulty: 'Hard',
      category: 'Main Quest',
    },
  ],
  Health: [
    {
      slug: 'refill-mana-flask',
      title: 'Refill the Mana Flask',
      description:
        'Refill your water bottle and reset your desk before the next focus session begins.',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
    {
      slug: 'prep-balanced-meal',
      title: 'Prep a Balanced Meal',
      description:
        'Assemble one solid meal instead of postponing it again.',
      difficulty: 'Medium',
      category: 'Main Quest',
    },
    {
      slug: 'take-sunlight-circuit',
      title: 'Take the Sunlight Circuit',
      description:
        'Step outside for daylight and a short walk to reset your energy.',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
    {
      slug: 'stretch-stiff-muscles',
      title: 'Stretch the Stiff Muscles',
      description:
        "Spend ten minutes releasing the tension you've been carrying.",
      difficulty: 'Easy',
      category: 'Side Quest',
    },
    {
      slug: 'schedule-checkup-ping',
      title: 'Schedule the Checkup Ping',
      description:
        'Book or plan the health appointment you keep delaying.',
      difficulty: 'Medium',
      category: 'Main Quest',
    },
    {
      slug: 'pack-healthy-snack-kit',
      title: 'Pack the Healthy Snack Kit',
      description:
        'Set up a better snack option before hunger wrecks your focus.',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
    {
      slug: 'log-water-meals',
      title: 'Log the Water and Meals',
      description:
        'Track the basics for the day so you can notice your patterns.',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
  ],
  Fitness: [
    {
      slug: 'lift-iron-sigils',
      title: 'Lift the Iron Sigils',
      description:
        'Complete a short workout or movement session to keep momentum alive.',
      difficulty: 'Hard',
      category: 'Main Quest',
    },
    {
      slug: 'walk-cardio-circuit',
      title: 'Walk the Cardio Circuit',
      description:
        'Hit a brisk walk and let your body carry the stress out.',
      difficulty: 'Medium',
      category: 'Side Quest',
    },
    {
      slug: 'mobility-reset',
      title: 'Complete a Mobility Reset',
      description:
        'Open your hips, shoulders, and back before stiffness wins.',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
    {
      slug: 'train-core-ward',
      title: 'Train the Core Ward',
      description:
        'Do a focused core routine that reinforces posture and stability.',
      difficulty: 'Medium',
      category: 'Side Quest',
    },
    {
      slug: 'short-hiit-burst',
      title: 'Finish a Short HIIT Burst',
      description:
        'Use one intense fitness block to spike energy and focus.',
      difficulty: 'Hard',
      category: 'Main Quest',
    },
    {
      slug: 'recovery-steps',
      title: 'Cool Down with Recovery Steps',
      description:
        'Walk and stretch long enough to bring your system back down.',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
  ],
  Errands: [
    {
      slug: 'prepare-market-run',
      title: 'Prepare the Market Run',
      description:
        'Handle the errands that unblock the rest of the week.',
      difficulty: 'Medium',
      category: 'Side Quest',
      dueHours: 5,
    },
    {
      slug: 'pick-up-supplies',
      title: 'Pick Up the Missing Supplies',
      description:
        'Grab the items that are quietly stalling other tasks.',
      difficulty: 'Medium',
      category: 'Side Quest',
      dueHours: 3,
    },
    {
      slug: 'return-borrowed-relic',
      title: 'Return the Borrowed Relic',
      description:
        'Return the borrowed item before it lives in your bag forever.',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
    {
      slug: 'drop-off-parcel',
      title: 'Drop Off the Parcel',
      description:
        'Finish the delivery run before the pickup window closes.',
      difficulty: 'Medium',
      category: 'Side Quest',
      dueHours: 4,
    },
    {
      slug: 'refill-monthly-essentials',
      title: 'Refill the Monthly Essentials',
      description:
        'Restock the basics before you are forced into a rushed trip.',
      difficulty: 'Medium',
      category: 'Side Quest',
    },
    {
      slug: 'resolve-pharmacy-stop',
      title: 'Resolve the Pharmacy Stop',
      description:
        'Handle the prescription or pharmacy errand that is still pending.',
      difficulty: 'Medium',
      category: 'Side Quest',
      dueHours: 8,
    },
  ],
  Home: [
    {
      slug: 'restore-entryway',
      title: 'Restore the Entryway',
      description:
        'Clear shoes, bags, and clutter so the entrance feels open again.',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
    {
      slug: 'clear-fridge-shelf',
      title: 'Clear the Fridge Shelf',
      description:
        'Throw out stale items and make space for real meals.',
      difficulty: 'Medium',
      category: 'Side Quest',
    },
    {
      slug: 'reset-living-room',
      title: 'Reset the Living Room',
      description:
        'Put the main room back into a state you want to return to.',
      difficulty: 'Medium',
      category: 'Side Quest',
    },
    {
      slug: 'water-indoor-grove',
      title: 'Water the Indoor Grove',
      description:
        'Take care of the plants before neglect starts to show.',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
    {
      slug: 'organize-tool-drawer',
      title: 'Organize the Tool Drawer',
      description:
        "Sort the tools so the next repair doesn't become a scavenger hunt.",
      difficulty: 'Medium',
      category: 'Side Quest',
    },
    {
      slug: 'declutter-storage-zone',
      title: 'Declutter One Storage Zone',
      description:
        'Clear one shelf, bin, or drawer instead of trying to do the whole house.',
      difficulty: 'Hard',
      category: 'Main Quest',
    },
    {
      slug: 'ready-guest-corner',
      title: 'Ready the Guest Corner',
      description:
        'Refresh the room or corner so it is actually ready for company.',
      difficulty: 'Medium',
      category: 'Side Quest',
    },
  ],
  Focus: [
    {
      slug: 'train-focus-familiar',
      title: 'Train the Focus Familiar',
      description:
        'Silence distractions and prepare one clean work block with a single outcome.',
      difficulty: 'Medium',
      category: 'Side Quest',
    },
    {
      slug: 'seal-notification-gate',
      title: 'Seal the Notification Gate',
      description:
        'Silence nonessential alerts so you can keep one thought alive.',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
    {
      slug: 'deep-work-block',
      title: 'Run a 45-Minute Deep Work Block',
      description:
        'Stay with one difficult task for a full focused cycle.',
      difficulty: 'Hard',
      category: 'Main Quest',
      dueHours: 1,
    },
    {
      slug: 'single-tab-session',
      title: 'Finish a Single-Tab Session',
      description:
        'Work from one tab and one goal until the session ends.',
      difficulty: 'Medium',
      category: 'Side Quest',
    },
    {
      slug: 'clear-distraction-list',
      title: 'Clear the Distraction List',
      description:
        'Write down tempting side tasks so they stop interrupting your main quest.',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
    {
      slug: 'protect-first-hour',
      title: 'Protect the First Hour',
      description:
        'Use the first hour of the day on meaningful work before everything else arrives.',
      difficulty: 'Hard',
      category: 'Main Quest',
    },
  ],
  Planning: [
    {
      slug: 'map-day-ahead',
      title: 'Map the Day Ahead',
      description:
        'Sketch the top priorities for today so the main quest line stays clear.',
      difficulty: 'Easy',
      category: 'Main Quest',
    },
    {
      slug: 'weekly-master-plan',
      title: 'Forge a Weekly Master Plan',
      description:
        'Lay out your week with deadlines, recovery time, and one stretch goal.',
      difficulty: 'Epic',
      category: 'Main Quest',
    },
    {
      slug: 'set-top-three',
      title: 'Set the Top Three Priorities',
      description:
        'Choose the three outcomes that matter most before the day gets noisy.',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
    {
      slug: 'plan-budget-week',
      title: 'Plan the Budget Week',
      description:
        'Assign money to the week before it quietly disappears.',
      difficulty: 'Medium',
      category: 'Main Quest',
    },
    {
      slug: 'review-calendar-crossroads',
      title: 'Review the Calendar Crossroads',
      description:
        'Scan the next seven days for conflicts, deadlines, and prep needs.',
      difficulty: 'Medium',
      category: 'Side Quest',
    },
    {
      slug: 'break-big-goal-steps',
      title: 'Break the Big Goal into Steps',
      description:
        'Cut a large quest into smaller parts you can actually start.',
      difficulty: 'Hard',
      category: 'Main Quest',
    },
    {
      slug: 'schedule-recovery-window',
      title: 'Schedule a Recovery Window',
      description:
        'Protect downtime before the week turns into pure reaction.',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
  ],
  Creative: [
    {
      slug: 'shape-creative-relic',
      title: 'Shape a Creative Relic',
      description:
        'Make visible progress on a design, sketch, draft, or passion project.',
      difficulty: 'Hard',
      category: 'Main Quest',
    },
    {
      slug: 'sketch-three-concepts',
      title: 'Sketch Three Quick Concepts',
      description:
        'Generate rough ideas before chasing the polished version.',
      difficulty: 'Medium',
      category: 'Side Quest',
    },
    {
      slug: 'write-rough-first-draft',
      title: 'Write a Rough First Draft',
      description:
        'Get the first version onto the page without editing mid-flow.',
      difficulty: 'Hard',
      category: 'Main Quest',
    },
    {
      slug: 'build-moodboard-fragment',
      title: 'Build a Moodboard Fragment',
      description:
        'Collect references that lock in the visual tone of the project.',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
    {
      slug: 'record-demo-idea',
      title: 'Record a Demo Idea',
      description:
        'Capture the idea while it still sounds alive in your head.',
      difficulty: 'Medium',
      category: 'Side Quest',
    },
    {
      slug: 'polish-showcase-piece',
      title: 'Polish a Showcase Piece',
      description:
        'Refine one finished creative piece so it feels ready to share.',
      difficulty: 'Hard',
      category: 'Main Quest',
    },
  ],
  Finance: [
    {
      slug: 'collect-expense-receipts',
      title: 'Collect the Expense Receipts',
      description:
        'Gather the finance trail before admin tasks become a bigger boss fight.',
      difficulty: 'Medium',
      category: 'Side Quest',
    },
    {
      slug: 'reconcile-weekly-spending',
      title: 'Reconcile the Weekly Spending',
      description:
        'Check where your money went and correct the drift early.',
      difficulty: 'Medium',
      category: 'Main Quest',
    },
    {
      slug: 'pay-waiting-bill',
      title: 'Pay the Waiting Bill',
      description:
        "Handle the bill before it becomes tomorrow's problem.",
      difficulty: 'Medium',
      category: 'Main Quest',
      dueHours: 12,
    },
    {
      slug: 'review-subscription-ledger',
      title: 'Review the Subscription Ledger',
      description:
        'Cancel or confirm the recurring costs you barely notice anymore.',
      difficulty: 'Hard',
      category: 'Main Quest',
    },
    {
      slug: 'update-savings-tracker',
      title: 'Update the Savings Tracker',
      description:
        "Log this week's progress so the long game stays visible.",
      difficulty: 'Easy',
      category: 'Side Quest',
    },
    {
      slug: 'sort-tax-folder',
      title: 'Sort the Tax Folder',
      description:
        'Put the important finance records where future-you can find them.',
      difficulty: 'Medium',
      category: 'Side Quest',
    },
  ],
  Social: [
    {
      slug: 'send-check-in-message',
      title: 'Send the Check-In Message',
      description:
        'Reach out to someone you value instead of letting the thread fade.',
      difficulty: 'Easy',
      category: 'Side Quest',
      dueHours: 8,
    },
    {
      slug: 'plan-catch-up-call',
      title: 'Plan a Catch-Up Call',
      description:
        'Set a real time to reconnect instead of saying someday.',
      difficulty: 'Medium',
      category: 'Side Quest',
    },
    {
      slug: 'reply-missed-thread',
      title: 'Reply to the Missed Thread',
      description:
        'Answer the message you meant to return to days ago.',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
    {
      slug: 'thank-helpful-ally',
      title: 'Thank a Helpful Ally',
      description:
        'Send a genuine thank-you to someone who made your week easier.',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
    {
      slug: 'confirm-group-plan',
      title: 'Confirm the Group Plan',
      description:
        'Lock the details so the social plan actually happens.',
      difficulty: 'Medium',
      category: 'Side Quest',
      dueHours: 6,
    },
    {
      slug: 'celebrate-guildmate-win',
      title: 'Celebrate a Guildmate Win',
      description:
        "Notice someone else's progress and tell them it mattered.",
      difficulty: 'Easy',
      category: 'Side Quest',
    },
  ],
  Admin: [
    {
      slug: 'clear-inbox-cavern',
      title: 'Clear the Inbox Cavern',
      description:
        'Answer or archive the messages that keep pulling your attention away.',
      difficulty: 'Hard',
      category: 'Main Quest',
    },
    {
      slug: 'rename-loose-files',
      title: 'Rename the Loose Files',
      description:
        'Give the scattered files sensible names before they become impossible to find.',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
    {
      slug: 'update-password-ledger',
      title: 'Update the Password Ledger',
      description:
        'Refresh one weak login and store it properly.',
      difficulty: 'Medium',
      category: 'Side Quest',
    },
    {
      slug: 'archive-completed-paperwork',
      title: 'Archive the Completed Paperwork',
      description:
        'File the finished documents so your active pile stays clean.',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
    {
      slug: 'submit-pending-form',
      title: 'Submit the Pending Form',
      description:
        'Complete and send the form that has been sitting unfinished.',
      difficulty: 'Medium',
      category: 'Main Quest',
      dueHours: 10,
    },
    {
      slug: 'clean-browser-tabs',
      title: 'Clean the Browser Tabs',
      description:
        'Close or bookmark the tabs that are draining your working memory.',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
    {
      slug: 'backup-important-folder',
      title: 'Back Up the Important Folder',
      description:
        'Create a backup before a small problem becomes a disaster.',
      difficulty: 'Medium',
      category: 'Main Quest',
    },
  ],
  'Self Care': [
    {
      slug: 'protect-evening-wind-down',
      title: 'Protect the Evening Wind-Down',
      description:
        'Create a calm finish to the day so tomorrow begins with more energy.',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
    {
      slug: 'quiet-reset-break',
      title: 'Take a Quiet Reset Break',
      description:
        'Step away long enough for your stress to come down a level.',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
    {
      slug: 'journal-days-lessons',
      title: "Journal the Day's Lessons",
      description:
        'Write a few lines about what worked, what drained you, and what to change.',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
    {
      slug: 'read-for-calm',
      title: 'Read for Calm for 20 Minutes',
      description:
        'Choose a quiet read instead of one more scroll session.',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
    {
      slug: 'screen-free-reset',
      title: 'Do a Screen-Free Reset',
      description:
        'Leave every glowing screen alone for a short recovery block.',
      difficulty: 'Medium',
      category: 'Side Quest',
    },
    {
      slug: 'prepare-sleep-routine',
      title: 'Prepare a Restful Sleep Routine',
      description:
        'Set the room and your routine so falling asleep takes less effort.',
      difficulty: 'Medium',
      category: 'Main Quest',
    },
    {
      slug: 'breathwork-reset',
      title: 'Clear the Mind with Breathwork',
      description:
        'Use guided breathing to settle your mind before the next push.',
      difficulty: 'Easy',
      category: 'Side Quest',
    },
  ],
};

const defaultQuestPoolTemplates = Object.entries(
  defaultQuestPoolTemplateBlueprints,
).flatMap(([tag, templates]) =>
  templates.map(({ slug, dueHours, ...template }) => ({
    id: `template-${slug}`,
    ...template,
    tag,
    dueDate:
      typeof dueHours === 'number' ? createRelativeDueDate(dueHours) : null,
  })),
);

function createQuestId() {
  return `quest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createQuestPoolTemplateId() {
  return `template-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

function normalizeDueDate(dueDate) {
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

function normalizeResolvedDate(resolvedDate) {
  return normalizeDueDate(resolvedDate);
}

function normalizeStartedAt(startedAt) {
  return normalizeDueDate(startedAt);
}

function parseDueMoment(dueDate) {
  const normalizedDueDate = normalizeDueDate(dueDate);

  if (!normalizedDueDate) {
    return null;
  }

  if (parseDateKey(normalizedDueDate)) {
    return {
      isDateOnly: true,
      date: parseDateKey(normalizedDueDate),
      value: normalizedDueDate,
    };
  }

  return {
    isDateOnly: false,
    date: new Date(normalizedDueDate),
    value: normalizedDueDate,
  };
}

function formatDueDateLabel(dueDate) {
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

function getQuestReminderLeadTimeMs(quest) {
  const dueMoment = parseDueMoment(quest?.dueDate);

  if (!dueMoment || dueMoment.isDateOnly) {
    return null;
  }

  const startedAt = normalizeStartedAt(quest?.startedAt);
  const referenceTimeMs = startedAt
    ? new Date(startedAt).getTime()
    : typeof quest?.createdAt === 'number'
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

function getQuestDueStateLabel(quest, todayKey = getDateKey()) {
  const dueMoment = parseDueMoment(quest?.dueDate);

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

  if (reminderLeadTimeMs !== null && dueTimeDifferenceMs <= reminderLeadTimeMs) {
    return 'Due Soon';
  }

  if (getDateKey(dueMoment.date) === todayKey) {
    return 'Due Today';
  }

  return 'Upcoming';
}

function getQuestResolvedDate(quest) {
  if (quest.status === 'Completed') {
    return normalizeResolvedDate(quest.completedAt);
  }

  if (quest.status === 'Failed') {
    return normalizeResolvedDate(quest.failedAt);
  }

  return null;
}

function normalizeActiveDateKeys(activeDateKeys) {
  if (!Array.isArray(activeDateKeys)) {
    return [];
  }

  return Array.from(
    new Set(
      activeDateKeys
        .map(activeDateKey => normalizeResolvedDate(activeDateKey))
        .filter(activeDateKey => activeDateKey !== null),
    ),
  ).sort();
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

function createHeroProgress(
  xp,
  streakCount = 0,
  lastCompletedDate = null,
  activeDateKeys = [],
) {
  const normalizedStreak = normalizeStreakProgress(streakCount, lastCompletedDate);

  return {
    xp,
    rankTitle: getRankTitleForXp(xp),
    streakCount: normalizedStreak.streakCount,
    lastCompletedDate: normalizedStreak.lastCompletedDate,
    activeDateKeys: normalizeActiveDateKeys(activeDateKeys),
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
  const status = ['Ready', 'In Progress', 'Completed', 'Failed'].includes(quest?.status)
    ? quest.status
    : 'Ready';
  const title = typeof quest?.title === 'string' && quest.title.trim().length > 0
    ? quest.title.trim()
    : 'Untitled Quest';

  return {
    id: typeof quest?.id === 'string' && quest.id.length > 0 ? quest.id : createQuestId(),
    title,
    description:
      typeof quest?.description === 'string' ? quest.description.trim() : '',
    tag:
      typeof quest?.tag === 'string' && quest.tag.trim().length > 0
        ? quest.tag.trim()
        : 'General',
    dueDate: normalizeDueDate(quest?.dueDate),
    startedAt:
      status === 'In Progress'
        ? normalizeStartedAt(quest?.startedAt) ??
          (typeof quest?.createdAt === 'number'
            ? new Date(quest.createdAt).toISOString()
            : new Date().toISOString())
        : normalizeStartedAt(quest?.startedAt),
    difficulty,
    xpReward: completionXpByDifficulty[difficulty],
    status,
    category,
    completedAt:
      status === 'Completed'
        ? normalizeResolvedDate(quest?.completedAt) ?? getDateKey()
        : null,
    failedAt:
      status === 'Failed'
        ? normalizeResolvedDate(quest?.failedAt) ?? getDateKey()
        : null,
    dueSoonReminderAt:
      typeof quest?.dueSoonReminderAt === 'string' &&
      quest.dueSoonReminderAt.trim().length > 0
        ? quest.dueSoonReminderAt.trim()
        : null,
    overdueReminderAt:
      typeof quest?.overdueReminderAt === 'string' &&
      quest.overdueReminderAt.trim().length > 0
        ? quest.overdueReminderAt.trim()
        : null,
    createdAt: typeof quest?.createdAt === 'number' ? quest.createdAt : Date.now(),
  };
}

function normalizeQuestPoolTemplate(template) {
  const difficulty = difficultyOptions.includes(template?.difficulty)
    ? template.difficulty
    : 'Easy';
  const category = categoryOptions.includes(template?.category)
    ? template.category
    : 'Side Quest';

  return {
    id:
      typeof template?.id === 'string' && template.id.trim().length > 0
        ? template.id.trim()
        : createQuestPoolTemplateId(),
    title:
      typeof template?.title === 'string' && template.title.trim().length > 0
        ? template.title.trim()
        : 'Untitled Quest',
    description:
      typeof template?.description === 'string' ? template.description.trim() : '',
    tag:
      typeof template?.tag === 'string' && template.tag.trim().length > 0
        ? template.tag.trim()
        : 'General',
    dueDate: normalizeDueDate(template?.dueDate),
    difficulty,
    category,
  };
}

function normalizeQuestPool(questPoolTemplates) {
  const normalizedDefaultTemplates = defaultQuestPoolTemplates.map(
    normalizeQuestPoolTemplate,
  );

  if (!Array.isArray(questPoolTemplates)) {
    return normalizedDefaultTemplates;
  }

  const normalizedStoredTemplates = questPoolTemplates.map(
    normalizeQuestPoolTemplate,
  );
  const defaultTemplateIds = new Set(
    normalizedDefaultTemplates.map(template => template.id),
  );
  const storedTemplatesById = new Map(
    normalizedStoredTemplates.map(template => [template.id, template]),
  );
  const mergedDefaultTemplates = normalizedDefaultTemplates.map(
    template => storedTemplatesById.get(template.id) ?? template,
  );
  const customTemplates = normalizedStoredTemplates.filter(
    template => !defaultTemplateIds.has(template.id),
  );

  return [...mergedDefaultTemplates, ...customTemplates];
}

function getProgressStats(quests) {
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
    gameState?.hero?.activeDateKeys ??
      normalizedQuests
        .map(quest => getQuestResolvedDate(quest))
        .filter(activeDateKey => activeDateKey !== null),
  );

  return {
    hero,
    quests: normalizedQuests,
    themeMode: gameState?.themeMode === 'light' ? 'light' : 'dark',
    themePackId: normalizeThemePackId(gameState?.themePackId),
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

function normalizeQuestSectionOrder(questSectionOrder) {
  if (!Array.isArray(questSectionOrder)) {
    return defaultQuestSectionOrder;
  }

  const normalizedOrder = questSectionOrder.filter(sectionKey =>
    defaultQuestSectionOrder.includes(sectionKey),
  );
  const uniqueOrder = normalizedOrder.filter(
    (sectionKey, index) => normalizedOrder.indexOf(sectionKey) === index,
  );

  return uniqueOrder.length === defaultQuestSectionOrder.length
    ? uniqueOrder
    : defaultQuestSectionOrder;
}

function getDailySuggestions(dateKey, quests, questPoolTemplates) {
  if (!Array.isArray(questPoolTemplates) || questPoolTemplates.length === 0) {
    return [];
  }

  const existingQuestTitles = new Set(
    quests.map(quest => quest.title.trim().toLowerCase()),
  );
  const startingIndex =
    Number(dateKey.replace(/-/g, '')) % questPoolTemplates.length;
  const suggestions = [];

  for (let offset = 0; offset < questPoolTemplates.length; offset += 1) {
    const suggestion =
      questPoolTemplates[(startingIndex + offset) % questPoolTemplates.length];
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

function createRealmSeed(dateKey) {
  const numericSeed = Number(dateKey.replace(/-/g, ''));

  return `0x${numericSeed.toString(16).toUpperCase()}`;
}

function buildRealmCodex(gameState, appConfig) {
  const suggestionDateKey = getDateKey();
  const realmSeed = createRealmSeed(suggestionDateKey);
  const featureFlags = [
    {
      id: 'realm-sync-card',
      label: 'Realm Sync Panel',
      status: appConfig.featureFlags.showRealmSyncCard ? 'Enabled' : 'Hidden',
    },
    {
      id: 'suggestion-section',
      label: 'Suggestion Feed',
      status: appConfig.featureFlags.showSuggestionSection ? 'Enabled' : 'Hidden',
    },
    {
      id: 'filter-section',
      label: 'Search And Filter',
      status: appConfig.featureFlags.showFilterSection ? 'Enabled' : 'Hidden',
    },
    {
      id: 'achievement-section',
      label: 'Achievement Ledger',
      status: appConfig.featureFlags.showAchievementSection ? 'Enabled' : 'Hidden',
    },
    {
      id: 'add-quest-screen',
      label: 'Add Quest Screen',
      status: appConfig.featureFlags.showAddQuestScreen ? 'Enabled' : 'Hidden',
    },
    {
      id: 'progress-screen',
      label: 'Progress Screen',
      status: appConfig.featureFlags.showProgressScreen ? 'Enabled' : 'Hidden',
    },
    {
      id: 'realm-codex-screen',
      label: 'Realm Codex Screen',
      status: appConfig.featureFlags.showRealmCodexScreen ? 'Enabled' : 'Hidden',
    },
    {
      id: 'theme-sanctum-screen',
      label: 'Theme Sanctum Screen',
      status: appConfig.featureFlags.showThemeSanctumScreen ? 'Enabled' : 'Hidden',
    },
  ];
  const modules = [
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
      status: appConfig.featureFlags.showAddQuestScreen ? 'Live' : 'Dormant',
    },
    {
      id: 'hero-archive',
      name: 'Hero Archive',
      description: 'Progress summary and hero record ledger.',
      status: appConfig.featureFlags.showProgressScreen ? 'Live' : 'Dormant',
    },
    {
      id: 'suggestion-feed',
      name: 'Suggestion Feed',
      description: 'Backend-issued daily quest recommendations.',
      status: appConfig.featureFlags.showSuggestionSection ? 'Live' : 'Dormant',
    },
    {
      id: 'achievement-ledger',
      name: 'Achievement Ledger',
      description: 'Badge and milestone visibility inside Progress.',
      status: appConfig.featureFlags.showAchievementSection ? 'Live' : 'Dormant',
    },
    {
      id: 'realm-codex',
      name: 'Realm Codex',
      description: 'Backend-driven realm status and module telemetry.',
      status: appConfig.featureFlags.showRealmCodexScreen ? 'Live' : 'Dormant',
    },
    {
      id: 'theme-sanctum',
      name: 'Theme Sanctum',
      description: 'Backend-guided overview of the app\'s active visual essence.',
      status: appConfig.featureFlags.showThemeSanctumScreen ? 'Live' : 'Dormant',
    },
    {
      id: 'realm-sync',
      name: 'Realm Sync',
      description: 'Pulls the latest backend copy into the running app.',
      status: appConfig.featureFlags.showRealmSyncCard ? 'Live' : 'Dormant',
    },
  ];

  return {
    kicker: 'Realm Codex',
    title: "The Weaver's Codex",
    subtitle:
      'A live readout of the backend state currently shaping Quest Forge inside the app.',
    heartbeatLabel: 'Sanctum Heartbeat',
    heartbeatStatus: 'Stable',
    syncLatencyMs: 32 + gameState.quests.length * 4 + appConfig.configVersion,
    summarySectionTitle: 'Realm Summary',
    summarySectionIntro:
      'This screen is backed by live server data so the app can reveal system state without another client rewrite.',
    featureFlagsSectionTitle: 'Active Realm Flags',
    featureFlagsSectionIntro:
      'Each flag shows which surfaces the backend currently exposes inside the player app.',
    modulesSectionTitle: 'Connected Modules',
    modulesSectionIntro:
      'These are the current app surfaces and systems wired into the active backend flow.',
    configVersion: appConfig.configVersion,
    realmSeed,
    activeTheme: gameState.themeMode === 'dark' ? 'Dark Mode' : 'Light Mode',
    activeSort: gameState.sortOption,
    questCount: gameState.quests.length,
    suggestionSeed: suggestionDateKey,
    featureFlags,
    modules,
  };
}

function getThemePackDefinition(themePackId) {
  return themeCatalog[normalizeThemePackId(themePackId)] ?? themeCatalog['celestial-bazaar'];
}

function buildThemePalette(themePackId, themeMode) {
  const normalizedThemeMode = themeMode === 'light' ? 'light' : 'dark';
  const themePackDefinition = getThemePackDefinition(themePackId);

  return themePackDefinition.palette[normalizedThemeMode];
}

function buildThemePaletteResponse(gameState) {
  return {
    themeMode: gameState.themeMode,
    themePackId: normalizeThemePackId(gameState.themePackId),
    themePalette: buildThemePalette(gameState.themePackId, gameState.themeMode),
  };
}

function buildThemeSanctum(gameState, appConfig) {
  const activeThemePackId = normalizeThemePackId(gameState.themePackId);
  const activeThemePack = getThemePackDefinition(activeThemePackId);
  const normalizedThemeMode = gameState.themeMode === 'light' ? 'light' : 'dark';

  return {
    kicker: 'Theme Sanctum',
    title: 'The Color Forge',
    subtitle:
      'Choose the essence pack that now drives Quest Forge across every screen.',
    activeThemeLabel: activeThemePack.name,
    activeModeLabel:
      gameState.themeMode === 'dark' ? 'Dark Alchemist' : 'Light Alchemist',
    accentEnergyLabel: activeThemePack.accentEnergy[normalizedThemeMode],
    surfaceToneLabel: activeThemePack.surfaceTone[normalizedThemeMode],
    accentPreviewColor: activeThemePack.previewSwatches[normalizedThemeMode][0],
    realmNotesLabel: `v${appConfig.configVersion}`,
    availableEssencesTitle: 'Available Essences',
    availableEssencesIntro:
      'Five Stitch-guided essence packs live in the backend and update the full app palette together.',
    availableThemePacks: themePackOptions.map(themePackId => {
      const themePackDefinition = getThemePackDefinition(themePackId);

      return {
        id: themePackId,
        name: themePackDefinition.name,
        description: themePackDefinition.description,
        accentEnergy: themePackDefinition.accentEnergy[normalizedThemeMode],
        surfaceTone: themePackDefinition.surfaceTone[normalizedThemeMode],
        previewSwatches: themePackDefinition.previewSwatches[normalizedThemeMode],
        statusLabel: activeThemePackId === themePackId ? 'Current' : 'Select',
      };
    }),
  };
}

function getQuestProgressPercent(status) {
  if (status === 'Completed') {
    return 100;
  }

  if (status === 'Failed') {
    return 100;
  }

  if (status === 'In Progress') {
    return 68;
  }

  return 24;
}

function getQuestGuidanceText(quest) {
  const statusGuidance =
    quest.status === 'Completed'
      ? 'This quest is already complete, so any next step is about reflection or refinement.'
      : quest.status === 'Failed'
        ? 'This quest was marked as failed, so the next move is to learn from it or forge a better version.'
        : quest.status === 'In Progress'
        ? 'Momentum is already gathering around this quest, so keep the next action small and focused.'
        : 'This quest is prepared and waiting for the first deliberate move.';
  const categoryGuidance =
    quest.category === 'Main Quest'
      ? 'As a main quest, it pushes the realm forward and deserves your clearest attention block.'
      : 'As a side quest, it strengthens the guild quietly without needing to dominate the whole day.';
  const difficultyGuidance =
    quest.difficulty === 'Epic'
      ? 'Epic difficulty means it is worth breaking the quest into meaningful focus sessions.'
      : quest.difficulty === 'Hard'
        ? 'Hard difficulty suggests protecting time and reducing distractions before you begin.'
        : quest.difficulty === 'Medium'
          ? 'Medium difficulty fits well into a steady work sprint with one clear outcome.'
          : 'Easy difficulty makes this a strong quick win when you need momentum.';

  return `${statusGuidance} ${categoryGuidance} ${difficultyGuidance}`;
}

function buildQuestDetails(quest) {
  const questProgressPercent = getQuestProgressPercent(quest.status);
  const hasQuestNotes = typeof quest.description === 'string' && quest.description.length > 0;
  const primaryActionType =
    quest.status === 'Completed' || quest.status === 'Failed'
      ? 'none'
      : quest.status === 'In Progress'
        ? 'complete'
        : 'start';
  const dueDate = normalizeDueDate(quest.dueDate);

  return {
    kicker: 'Quest Details',
    title: quest.title,
    subtitle:
      'Open one quest in focus, inspect its notes, and decide the next move in the journey.',
    questId: quest.id,
    statusLabel: quest.status,
    categoryLabel: quest.category,
    tagLabel: quest.tag,
    summaryEyebrow: 'Quest Summary',
    summaryTitle:
      quest.status === 'Completed'
        ? 'Quest Complete'
        : quest.status === 'Failed'
          ? 'Quest Failed'
        : quest.status === 'In Progress'
          ? 'Quest In Progress'
          : 'Quest Ready',
    difficultyLabel: quest.difficulty,
    xpRewardLabel: `+${quest.xpReward} XP`,
    ritualProgressLabel: 'Quest Progress',
    ritualProgressPercent: questProgressPercent,
    progressStatusText:
      quest.status === 'Completed'
        ? 'This quest already lives in the completed ledger and its reward has been claimed.'
        : quest.status === 'Failed'
          ? 'This quest now lives in the history ledger as a failed attempt.'
        : quest.status === 'In Progress'
          ? 'This quest is active now, so completing it will seal the quest and grant the reward.'
          : 'This quest is ready to begin whenever the guild needs it to move.',
    guidanceTitle: hasQuestNotes ? 'Quest Notes' : 'Quest Guidance',
    guidanceText: hasQuestNotes ? quest.description : getQuestGuidanceText(quest),
    dueDateLabel: formatDueDateLabel(dueDate),
    dueStateLabel: getQuestDueStateLabel(quest),
    primaryActionLabel:
      quest.status === 'Completed'
        ? 'Quest Complete'
        : quest.status === 'Failed'
          ? 'Quest Failed'
        : quest.status === 'In Progress'
          ? 'Complete Quest'
          : 'Start Quest',
    primaryActionType,
    tertiaryActionType:
      quest.status === 'Ready' || quest.status === 'In Progress' ? 'fail' : 'none',
    tertiaryActionLabel: 'Mark Failed',
    secondaryActionLabel: 'Edit Quest',
    canComplete: quest.status !== 'Completed' && quest.status !== 'Failed',
  };
}

function buildQuestPool(questPoolTemplates) {
  const categories = Array.from(
    new Set(questPoolTemplates.map(template => template.tag)),
  ).sort((left, right) => left.localeCompare(right));

  return {
    kicker: 'Quest Pool',
    title: 'Quest Pool',
    subtitle: 'Keep reliable quests ready for the board.',
    searchPlaceholder: 'Search Quests...',
    categories: ['All', ...categories],
    templates: questPoolTemplates.map(template => ({
      id: template.id,
      title: template.title,
      description: template.description,
      tag: template.tag,
      dueDate: normalizeDueDate(template.dueDate),
      difficulty: template.difficulty,
      category: template.category,
    })),
  };
}

function normalizeThemePackId(themePackId) {
  return themePackOptions.includes(themePackId)
    ? themePackId
    : 'celestial-bazaar';
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
    boardHeroTitlePrefix: normalizeTextField(
      appConfig?.boardHeroTitlePrefix,
      defaultAppConfig.boardHeroTitlePrefix,
    ),
    boardHeroInsight: normalizeTextField(
      appConfig?.boardHeroInsight,
      defaultAppConfig.boardHeroInsight,
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
    questSectionOrder: normalizeQuestSectionOrder(appConfig?.questSectionOrder),
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
    featureFlags: {
      showRealmSyncCard:
        typeof appConfig?.featureFlags?.showRealmSyncCard === 'boolean'
          ? appConfig.featureFlags.showRealmSyncCard
          : defaultAppConfig.featureFlags.showRealmSyncCard,
      showSuggestionSection:
        typeof appConfig?.featureFlags?.showSuggestionSection === 'boolean'
          ? appConfig.featureFlags.showSuggestionSection
          : defaultAppConfig.featureFlags.showSuggestionSection,
      showFilterSection:
        typeof appConfig?.featureFlags?.showFilterSection === 'boolean'
          ? appConfig.featureFlags.showFilterSection
          : defaultAppConfig.featureFlags.showFilterSection,
      showAchievementSection:
        typeof appConfig?.featureFlags?.showAchievementSection === 'boolean'
          ? appConfig.featureFlags.showAchievementSection
          : defaultAppConfig.featureFlags.showAchievementSection,
      showAddQuestScreen:
        typeof appConfig?.featureFlags?.showAddQuestScreen === 'boolean'
          ? appConfig.featureFlags.showAddQuestScreen
          : defaultAppConfig.featureFlags.showAddQuestScreen,
      showProgressScreen:
        typeof appConfig?.featureFlags?.showProgressScreen === 'boolean'
          ? appConfig.featureFlags.showProgressScreen
          : defaultAppConfig.featureFlags.showProgressScreen,
      showRealmCodexScreen:
        typeof appConfig?.featureFlags?.showRealmCodexScreen === 'boolean'
          ? appConfig.featureFlags.showRealmCodexScreen
          : defaultAppConfig.featureFlags.showRealmCodexScreen,
      showThemeSanctumScreen:
        typeof appConfig?.featureFlags?.showThemeSanctumScreen === 'boolean'
          ? appConfig.featureFlags.showThemeSanctumScreen
          : defaultAppConfig.featureFlags.showThemeSanctumScreen,
    },
  };
}

function buildNextGameState(currentGameState, updates) {
  const nextHero = updates.hero ?? currentGameState.hero;
  const nextQuests = updates.quests ?? currentGameState.quests;

  return normalizeGameState({
    hero: nextHero,
    quests: nextQuests,
    themeMode: updates.themeMode ?? currentGameState.themeMode,
    themePackId: updates.themePackId ?? currentGameState.themePackId,
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
    (typeof questDraft.description === 'undefined' ||
      typeof questDraft.description === 'string') &&
    (typeof questDraft.tag === 'undefined' ||
      questTagOptions.includes(questDraft.tag)) &&
    (typeof questDraft.dueDate === 'undefined' ||
      questDraft.dueDate === null ||
      (typeof questDraft.dueDate === 'string' &&
        questDraft.dueDate.trim().length === 0) ||
      normalizeDueDate(questDraft.dueDate) !== null) &&
    difficultyOptions.includes(questDraft.difficulty) &&
    categoryOptions.includes(questDraft.category)
  );
}

function isValidThemeMode(themeMode) {
  return themeMode === 'dark' || themeMode === 'light';
}

function isValidThemePackId(themePackId) {
  return themePackOptions.includes(themePackId);
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

async function writeQuestPool(questPoolTemplates) {
  await writeJsonFile(questPoolFilePath, questPoolTemplates);
}

async function readQuestPool() {
  const normalizedQuestPool = normalizeQuestPool(
    await readJsonFile(
      questPoolFilePath,
      normalizeQuestPool(defaultQuestPoolTemplates),
    ),
  );

  await writeQuestPool(normalizedQuestPool);

  return normalizedQuestPool;
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
  const detailsMatch = url.match(/^\/quests\/([^/]+)\/details$/);

  if (detailsMatch) {
    return {
      questId: decodeURIComponent(detailsMatch[1]),
      action: 'details',
    };
  }

  const completeMatch = url.match(/^\/quests\/([^/]+)\/complete$/);

  if (completeMatch) {
    return {
      questId: decodeURIComponent(completeMatch[1]),
      action: 'complete',
    };
  }

  const startMatch = url.match(/^\/quests\/([^/]+)\/start$/);

  if (startMatch) {
    return {
      questId: decodeURIComponent(startMatch[1]),
      action: 'start',
    };
  }

  const failMatch = url.match(/^\/quests\/([^/]+)\/fail$/);

  if (failMatch) {
    return {
      questId: decodeURIComponent(failMatch[1]),
      action: 'fail',
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

function getQuestPoolTemplateRouteMatch(url) {
  const templateMatch = url.match(/^\/quest-pool\/([^/]+)$/);

  if (!templateMatch) {
    return null;
  }

  return {
    templateId: decodeURIComponent(templateMatch[1]),
  };
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  const requestUrl = req.url || '';
  const questRouteMatch = getQuestRouteMatch(requestUrl);
  const questPoolTemplateRouteMatch = getQuestPoolTemplateRouteMatch(requestUrl);

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
      const [gameState, questPoolTemplates] = await Promise.all([
        readGameState(),
        readQuestPool(),
      ]);
      const suggestionDateKey = getDateKey();
      sendJson(res, 200, {
        suggestionDateKey,
        suggestions: getDailySuggestions(
          suggestionDateKey,
          gameState.quests,
          questPoolTemplates,
        ),
      });
    } catch (error) {
      sendJson(res, 500, {
        error: 'Unable to read daily suggestions.',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return;
  }

  if (req.url === '/quest-pool' && req.method === 'GET') {
    try {
      const questPoolTemplates = await readQuestPool();

      sendJson(res, 200, buildQuestPool(questPoolTemplates));
    } catch (error) {
      sendJson(res, 500, {
        error: 'Unable to read quest pool.',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return;
  }

  if (req.url === '/quest-pool' && req.method === 'POST') {
    try {
      const templateDraft = await readRequestBody(req);

      if (!isValidQuestDraft(templateDraft)) {
        sendJson(res, 400, {
          error: 'Invalid quest pool template payload.',
        });
        return;
      }

      const currentQuestPool = await readQuestPool();
      const nextQuestPool = normalizeQuestPool([
        {
          id: createQuestPoolTemplateId(),
          title: templateDraft.title,
          description: templateDraft.description,
          tag: templateDraft.tag,
          dueDate: templateDraft.dueDate,
          difficulty: templateDraft.difficulty,
          category: templateDraft.category,
        },
        ...currentQuestPool,
      ]);

      await writeQuestPool(nextQuestPool);
      sendJson(res, 200, buildQuestPool(nextQuestPool));
    } catch (error) {
      sendJson(res, 500, {
        error: 'Unable to create quest pool template.',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return;
  }

  if (req.url === '/quest-pool/reset' && req.method === 'POST') {
    try {
      const nextQuestPool = normalizeQuestPool(defaultQuestPoolTemplates);

      await writeQuestPool(nextQuestPool);
      sendJson(res, 200, buildQuestPool(nextQuestPool));
    } catch (error) {
      sendJson(res, 500, {
        error: 'Unable to reset quest pool.',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return;
  }

  if (questPoolTemplateRouteMatch && req.method === 'PUT') {
    try {
      const templateDraft = await readRequestBody(req);

      if (!isValidQuestDraft(templateDraft)) {
        sendJson(res, 400, {
          error: 'Invalid quest pool template payload.',
        });
        return;
      }

      const currentQuestPool = await readQuestPool();
      const templateToUpdate = currentQuestPool.find(
        template => template.id === questPoolTemplateRouteMatch.templateId,
      );

      if (!templateToUpdate) {
        sendJson(res, 404, {
          error: 'Quest pool template not found.',
        });
        return;
      }

      const nextQuestPool = normalizeQuestPool(
        currentQuestPool.map(template =>
          template.id === questPoolTemplateRouteMatch.templateId
            ? {
                ...template,
                title: templateDraft.title,
                description: templateDraft.description,
                tag: templateDraft.tag,
                dueDate: templateDraft.dueDate,
                difficulty: templateDraft.difficulty,
                category: templateDraft.category,
              }
            : template,
        ),
      );

      await writeQuestPool(nextQuestPool);
      sendJson(res, 200, buildQuestPool(nextQuestPool));
    } catch (error) {
      sendJson(res, 500, {
        error: 'Unable to update quest pool template.',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return;
  }

  if (req.url === '/realm-codex' && req.method === 'GET') {
    try {
      const [gameState, appConfig] = await Promise.all([
        readGameState(),
        readAppConfig(),
      ]);
      sendJson(res, 200, buildRealmCodex(gameState, appConfig));
    } catch (error) {
      sendJson(res, 500, {
        error: 'Unable to read realm codex.',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return;
  }

  if (req.url === '/theme-sanctum' && req.method === 'GET') {
    try {
      const [gameState, appConfig] = await Promise.all([
        readGameState(),
        readAppConfig(),
      ]);
      sendJson(res, 200, buildThemeSanctum(gameState, appConfig));
    } catch (error) {
      sendJson(res, 500, {
        error: 'Unable to read theme sanctum.',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return;
  }

  if (req.url === '/theme-palette' && req.method === 'GET') {
    try {
      const gameState = await readGameState();
      sendJson(res, 200, buildThemePaletteResponse(gameState));
    } catch (error) {
      sendJson(res, 500, {
        error: 'Unable to read theme palette.',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return;
  }

  if (questRouteMatch?.action === 'details' && req.method === 'GET') {
    try {
      const currentGameState = await readGameState();
      const quest = currentGameState.quests.find(
        currentQuest => currentQuest.id === questRouteMatch.questId,
      );

      if (!quest) {
        sendJson(res, 404, {
          error: 'Quest not found.',
        });
        return;
      }

      sendJson(res, 200, buildQuestDetails(quest));
    } catch (error) {
      sendJson(res, 500, {
        error: 'Unable to read quest details.',
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

  if (req.url === '/progress/reset' && req.method === 'POST') {
    try {
      const nextGameState = normalizeGameState({
        hero: {
          xp: 0,
          rankTitle: 'Novice',
          streakCount: 0,
          lastCompletedDate: null,
          activeDateKeys: [],
        },
        quests: [],
        themeMode: 'dark',
        themePackId: 'celestial-bazaar',
        unlockedAchievementIds: [],
        sortOption: 'Newest first',
      });

      await writeGameState(nextGameState);
      sendJson(res, 200, { gameState: nextGameState });
    } catch (error) {
      sendJson(res, 500, {
        error: 'Unable to reset progress.',
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
        description: questDraft.description,
        tag: questDraft.tag,
        dueDate: questDraft.dueDate,
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
        description: questDraft.description,
        tag: questDraft.tag,
        dueDate: questDraft.dueDate,
        difficulty: questDraft.difficulty,
        category: questDraft.category,
        dueSoonReminderAt:
          normalizeDueDate(questDraft.dueDate) === questToUpdate.dueDate
            ? questToUpdate.dueSoonReminderAt
            : null,
        overdueReminderAt:
          normalizeDueDate(questDraft.dueDate) === questToUpdate.dueDate
            ? questToUpdate.overdueReminderAt
            : null,
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

      if (questToComplete.status !== 'In Progress') {
        sendJson(res, 200, {
          gameState: currentGameState,
          completionFeedback: null,
        });
        return;
      }

      const xpGained = completionXpByDifficulty[questToComplete.difficulty];
      const completionDateKey = getDateKey();
      const updatedStreak = getNextStreakProgress(
        currentGameState.hero.streakCount,
        currentGameState.hero.lastCompletedDate,
        completionDateKey,
      );
      const nextHero = createHeroProgress(
        currentGameState.hero.xp + xpGained,
        updatedStreak.streakCount,
        updatedStreak.lastCompletedDate,
        [
          ...(currentGameState.hero.activeDateKeys ?? []),
          completionDateKey,
        ],
      );
      const nextGameState = buildNextGameState(currentGameState, {
        hero: nextHero,
        quests: currentGameState.quests.map(quest =>
          quest.id === questRouteMatch.questId
            ? {
                ...quest,
                status: 'Completed',
                completedAt: completionDateKey,
                failedAt: null,
                dueSoonReminderAt: null,
                overdueReminderAt: null,
              }
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

  if (questRouteMatch?.action === 'start' && req.method === 'POST') {
    try {
      const currentGameState = await readGameState();
      const questToStart = currentGameState.quests.find(
        quest => quest.id === questRouteMatch.questId,
      );

      if (!questToStart) {
        sendJson(res, 404, {
          error: 'Quest not found.',
        });
        return;
      }

      if (questToStart.status !== 'Ready') {
        sendJson(res, 200, {
          gameState: currentGameState,
        });
        return;
      }

      const nextGameState = buildNextGameState(currentGameState, {
        quests: currentGameState.quests.map(quest =>
          quest.id === questRouteMatch.questId
            ? {
                ...quest,
                status: 'In Progress',
                startedAt: new Date().toISOString(),
                dueSoonReminderAt: null,
                overdueReminderAt: null,
              }
            : quest,
        ),
      });

      await writeGameState(nextGameState);
      sendJson(res, 200, { gameState: nextGameState });
    } catch (error) {
      sendJson(res, 500, {
        error: 'Unable to start quest.',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return;
  }

  if (questRouteMatch?.action === 'fail' && req.method === 'POST') {
    try {
      const currentGameState = await readGameState();
      const questToFail = currentGameState.quests.find(
        quest => quest.id === questRouteMatch.questId,
      );

      if (!questToFail) {
        sendJson(res, 404, {
          error: 'Quest not found.',
        });
        return;
      }

      if (questToFail.status === 'Completed' || questToFail.status === 'Failed') {
        sendJson(res, 200, {
          gameState: currentGameState,
        });
        return;
      }

      const failedDateKey = getDateKey();
      const nextGameState = buildNextGameState(currentGameState, {
        quests: currentGameState.quests.map(quest =>
          quest.id === questRouteMatch.questId
            ? {
                ...quest,
                status: 'Failed',
                completedAt: null,
                failedAt: failedDateKey,
                dueSoonReminderAt: null,
                overdueReminderAt: null,
              }
            : quest,
        ),
      });

      await writeGameState(nextGameState);
      sendJson(res, 200, { gameState: nextGameState });
    } catch (error) {
      sendJson(res, 500, {
        error: 'Unable to fail quest.',
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

  if (req.url === '/preferences/theme-pack' && req.method === 'PUT') {
    try {
      const payload = await readRequestBody(req);

      if (!isValidThemePackId(payload?.themePackId)) {
        sendJson(res, 400, {
          error: 'Invalid theme pack payload.',
        });
        return;
      }

      const currentGameState = await readGameState();
      const nextGameState = buildNextGameState(currentGameState, {
        themePackId: payload.themePackId,
      });

      await writeGameState(nextGameState);
      sendJson(res, 200, { gameState: nextGameState });
    } catch (error) {
      sendJson(res, 500, {
        error: 'Unable to update theme pack.',
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
