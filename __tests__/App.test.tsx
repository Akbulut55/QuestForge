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
  loadStoredQuests,
  QUESTS_STORAGE_KEY,
} from '../src/storage/questStorage';

const mockAsyncStorage =
  require('@react-native-async-storage/async-storage').default;

const flushAsyncWork = () =>
  new Promise<void>(resolve => {
    setTimeout(() => resolve(), 0);
  });

beforeEach(() => {
  mockAsyncStorage.getItem.mockReset();
  mockAsyncStorage.setItem.mockReset();
  mockAsyncStorage.getItem.mockResolvedValue(null);
  mockAsyncStorage.setItem.mockResolvedValue(undefined);
});

test('loads persisted quests from AsyncStorage', async () => {
  mockAsyncStorage.getItem.mockResolvedValue(
    JSON.stringify([
      {
        title: 'Persisted Raid Plan',
        difficulty: 'Hard',
        xpReward: 80,
        status: 'Ready',
        category: 'Main Quest',
      },
    ]),
  );

  const storedQuests = await loadStoredQuests();

  expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(QUESTS_STORAGE_KEY);
  expect(storedQuests).toEqual([
    {
      title: 'Persisted Raid Plan',
      difficulty: 'Hard',
      xpReward: 80,
      status: 'Ready',
      category: 'Main Quest',
    },
  ]);
});

test('saves new quests back to storage after adding them in the app', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });

  await ReactTestRenderer.act(async () => {
    await flushAsyncWork();
  });

  let root = tree!.root;

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'navigate-to-add-quest' }).props.onPress();
  });

  root = tree!.root;

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'quest-title-input' }).props.onChangeText(
      'Prepare final demo',
    );
  });

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'difficulty-option-epic' }).props.onPress();
    root.findByProps({ testID: 'category-option-main-quest' }).props.onPress();
  });

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'save-quest-button' }).props.onPress();
  });

  root = tree!.root;

  expect(
    root.findAll(node => node.props.children === 'Prepare final demo').length,
  ).toBeGreaterThan(0);
  expect(mockAsyncStorage.setItem).toHaveBeenLastCalledWith(
    QUESTS_STORAGE_KEY,
    expect.stringContaining('Prepare final demo'),
  );
});
