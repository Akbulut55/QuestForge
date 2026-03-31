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

import App from '../App';

test('renders the board and lets a new quest be added', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<App />);
  });

  const root = tree!.root;
  const input = root.findByProps({ testID: 'quest-title-input' });
  const difficulty = root.findByProps({ testID: 'difficulty-option-epic' });
  const category = root.findByProps({ testID: 'category-option-main-quest' });
  const saveButton = root.findByProps({ testID: 'save-quest-button' });

  await ReactTestRenderer.act(() => {
    input.props.onChangeText('Prepare final demo');
  });

  await ReactTestRenderer.act(() => {
    difficulty.props.onPress();
    category.props.onPress();
  });

  await ReactTestRenderer.act(() => {
    saveButton.props.onPress();
  });

  const newQuestNodes = tree!.root.findAll(
    node => node.props.children === 'Prepare final demo',
  );

  expect(newQuestNodes.length).toBeGreaterThan(0);
  expect(tree!.root.findByProps({ testID: 'quest-title-input' }).props.value).toBe(
    '',
  );
});
