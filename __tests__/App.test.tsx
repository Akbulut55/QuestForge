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

import App from '../App';
import {
  GAME_STATE_STORAGE_KEY,
  LEGACY_QUESTS_STORAGE_KEY,
  loadLegacyStoredQuests,
  loadStoredGameState,
} from '../src/storage/questStorage';

const mockAsyncStorage =
  require('@react-native-async-storage/async-storage').default;

const flushAsyncWork = () =>
  new Promise<void>(resolve => {
    setTimeout(() => resolve(), 0);
  });

const flushMicrotasks = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

beforeEach(() => {
  mockAsyncStorage.getItem.mockReset();
  mockAsyncStorage.setItem.mockReset();
  mockAsyncStorage.getItem.mockResolvedValue(null);
  mockAsyncStorage.setItem.mockResolvedValue(undefined);
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

test('completing a quest awards XP, updates rank, and saves game state', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });

  await ReactTestRenderer.act(async () => {
    await flushAsyncWork();
  });

  let root = tree!.root;
  const initialRender = JSON.stringify(tree!.toJSON());

  expect(initialRender).toContain('"Novice"');

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'complete-quest-quest-1' }).props.onPress();
  });

  root = tree!.root;
  const completedRender = JSON.stringify(tree!.toJSON());

  expect(
    root.findByProps({ testID: 'completion-feedback-banner' }),
  ).toBeTruthy();
  expect(completedRender).toContain('"Knight"');
  expect(completedRender).toContain('"60"');
  expect(completedRender).toContain('"Quest Complete"');
  expect(completedRender).toContain('"Defeat the Laundry Dragon"');
  expect(completedRender).toContain('"+"');
  expect(completedRender).toContain('"50"');
  expect(completedRender).toContain('" XP gained"');
  expect(() =>
    root.findByProps({ testID: 'complete-quest-quest-1' }),
  ).toThrow();
  expect(mockAsyncStorage.setItem).toHaveBeenLastCalledWith(
    GAME_STATE_STORAGE_KEY,
    expect.stringContaining('"xp":60'),
  );
  expect(mockAsyncStorage.setItem).toHaveBeenLastCalledWith(
    GAME_STATE_STORAGE_KEY,
    expect.stringContaining('"rankTitle":"Knight"'),
  );
  expect(mockAsyncStorage.setItem).toHaveBeenLastCalledWith(
    GAME_STATE_STORAGE_KEY,
    expect.stringContaining('"streakCount":1'),
  );
});

test('search and filters work together on the quest board', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });

  await ReactTestRenderer.act(async () => {
    await flushAsyncWork();
  });

  let root = tree!.root;

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

  root = tree!.root;

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

test('theme toggle switches modes and persists the selected theme', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });

  await ReactTestRenderer.act(async () => {
    await flushAsyncWork();
  });

  let root = tree!.root;

  expect(
    root.findAll(node => node.props.children === 'Switch to Light Mode').length,
  ).toBeGreaterThan(0);

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'theme-toggle-button' }).props.onPress();
  });

  root = tree!.root;

  expect(
    root.findAll(node => node.props.children === 'Switch to Dark Mode').length,
  ).toBeGreaterThan(0);
  expect(mockAsyncStorage.setItem).toHaveBeenLastCalledWith(
    GAME_STATE_STORAGE_KEY,
    expect.stringContaining('"themeMode":"light"'),
  );

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'navigate-to-add-quest' }).props.onPress();
  });

  root = tree!.root;

  expect(
    root.findAll(node => node.props.children === 'Switch to Dark Mode').length,
  ).toBeGreaterThan(0);
});

test('progress screen shows derived hero and quest summary stats', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });

  await ReactTestRenderer.act(async () => {
    await flushAsyncWork();
  });

  let root = tree!.root;

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'navigate-to-progress-screen' }).props.onPress();
  });

  root = tree!.root;
  const progressRender = JSON.stringify(tree!.toJSON());

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
    root.findAll(node => node.props.children === 'Total Quests Completed').length,
  ).toBeGreaterThan(0);
  expect(root.findAll(node => node.props.children === '1').length).toBeGreaterThan(0);
  expect(
    root.findAll(node => node.props.children === 'Active Quests').length,
  ).toBeGreaterThan(0);
  expect(root.findAll(node => node.props.children === '2').length).toBeGreaterThan(0);
  expect(
    root.findAll(node => node.props.children === 'Completed Quests').length,
  ).toBeGreaterThan(0);
  expect(
    root.findAll(node => node.props.children === 'Switch to Light Mode').length,
  ).toBeGreaterThan(0);

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'back-from-progress-screen' }).props.onPress();
  });

  root = tree!.root;

  expect(
    root.findAll(node => node.props.children === 'Open Add Quest').length,
  ).toBeGreaterThan(0);
});

test('editing a quest updates its details and persists the changes', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });

  await ReactTestRenderer.act(async () => {
    await flushAsyncWork();
  });

  let root = tree!.root;

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'edit-quest-quest-2' }).props.onPress();
  });

  root = tree!.root;

  expect(
    root.findAll(node => node.props.children === 'Refine Quest Details').length,
  ).toBeGreaterThan(0);

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
  });

  root = tree!.root;
  const editedRender = JSON.stringify(tree!.toJSON());

  expect(
    root.findAll(
      node => node.props.children === 'Brew an Archmage Focus Potion',
    ).length,
  ).toBeGreaterThan(0);
  expect(
    root.findAll(node => node.props.children === 'Brew a Focus Potion').length,
  ).toBe(0);
  expect(mockAsyncStorage.setItem).toHaveBeenLastCalledWith(
    GAME_STATE_STORAGE_KEY,
    expect.stringContaining('Brew an Archmage Focus Potion'),
  );
  expect(mockAsyncStorage.setItem).toHaveBeenLastCalledWith(
    GAME_STATE_STORAGE_KEY,
    expect.stringContaining('"difficulty":"Hard"'),
  );
  expect(mockAsyncStorage.setItem).toHaveBeenLastCalledWith(
    GAME_STATE_STORAGE_KEY,
    expect.stringContaining('"category":"Main Quest"'),
  );
  expect(editedRender).toContain('"Open Add Quest"');
});

test('deleting a quest from the edit screen removes it and persists the update', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });

  await ReactTestRenderer.act(async () => {
    await flushAsyncWork();
  });

  let root = tree!.root;

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'edit-quest-quest-2' }).props.onPress();
  });

  root = tree!.root;

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'delete-quest-button' }).props.onPress();
  });

  root = tree!.root;

  expect(
    root.findAll(node => node.props.children === 'Brew a Focus Potion').length,
  ).toBe(0);
  expect(
    root.findAll(node => node.props.children === 'Open Add Quest').length,
  ).toBeGreaterThan(0);
  expect(mockAsyncStorage.setItem).toHaveBeenLastCalledWith(
    GAME_STATE_STORAGE_KEY,
    expect.not.stringContaining('"id":"quest-2"'),
  );
});

test('completing multiple quests on the same day only increases the streak once', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });

  await ReactTestRenderer.act(async () => {
    await flushAsyncWork();
  });

  let root = tree!.root;

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'complete-quest-quest-1' }).props.onPress();
  });

  root = tree!.root;

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'complete-quest-quest-2' }).props.onPress();
  });

  expect(mockAsyncStorage.setItem).toHaveBeenLastCalledWith(
    GAME_STATE_STORAGE_KEY,
    expect.stringContaining('"streakCount":1'),
  );
});

test('streak resets on load after a missed day', async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-04-03T09:00:00'));

  mockAsyncStorage.getItem.mockImplementation(async (key: string) => {
    if (key === GAME_STATE_STORAGE_KEY) {
      return JSON.stringify({
        hero: {
          xp: 35,
          rankTitle: 'Adventurer',
          streakCount: 3,
          lastCompletedDate: '2026-04-01',
        },
        quests: [],
        themeMode: 'dark',
      });
    }

    return null;
  });

  try {
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<App />);
    });

    await ReactTestRenderer.act(async () => {
      await flushMicrotasks();
    });

    expect(mockAsyncStorage.setItem).toHaveBeenLastCalledWith(
      GAME_STATE_STORAGE_KEY,
      expect.stringContaining('"streakCount":0'),
    );
    expect(mockAsyncStorage.setItem).toHaveBeenLastCalledWith(
      GAME_STATE_STORAGE_KEY,
      expect.stringContaining('"lastCompletedDate":null'),
    );
  } finally {
    jest.useRealTimers();
  }
});

test('completing a quest on the next day increases the streak', async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-04-02T09:00:00'));

  mockAsyncStorage.getItem.mockImplementation(async (key: string) => {
    if (key === GAME_STATE_STORAGE_KEY) {
      return JSON.stringify({
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
          },
        ],
        themeMode: 'dark',
      });
    }

    return null;
  });

  try {
    let tree: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<App />);
    });

    await ReactTestRenderer.act(async () => {
      await flushMicrotasks();
    });

    const root = tree!.root;

    await ReactTestRenderer.act(async () => {
      root
        .findByProps({ testID: 'complete-quest-quest-next-day' })
        .props.onPress();
    });

    expect(mockAsyncStorage.setItem).toHaveBeenLastCalledWith(
      GAME_STATE_STORAGE_KEY,
      expect.stringContaining('"streakCount":2'),
    );
    expect(mockAsyncStorage.setItem).toHaveBeenLastCalledWith(
      GAME_STATE_STORAGE_KEY,
      expect.stringContaining('"lastCompletedDate":"2026-04-02"'),
    );
  } finally {
    jest.useRealTimers();
  }
});
