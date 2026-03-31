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

test('navigates to add quest, returns, and saves a quest back to the board', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<App />);
  });

  let root = tree!.root;

  expect(
    root.findAll(node => node.props.children === 'Open Add Quest').length,
  ).toBeGreaterThan(0);

  await ReactTestRenderer.act(() => {
    root.findByProps({ testID: 'navigate-to-add-quest' }).props.onPress();
  });

  root = tree!.root;

  expect(
    root.findAll(node => node.props.children === 'Forge New Quest').length,
  ).toBeGreaterThan(0);

  await ReactTestRenderer.act(() => {
    root.findByProps({ testID: 'back-to-quest-board' }).props.onPress();
  });

  root = tree!.root;

  expect(
    root.findAll(node => node.props.children === 'Open Add Quest').length,
  ).toBeGreaterThan(0);

  await ReactTestRenderer.act(() => {
    root.findByProps({ testID: 'navigate-to-add-quest' }).props.onPress();
  });

  root = tree!.root;

  await ReactTestRenderer.act(() => {
    root.findByProps({ testID: 'quest-title-input' }).props.onChangeText(
      'Prepare final demo',
    );
  });

  await ReactTestRenderer.act(() => {
    root.findByProps({ testID: 'difficulty-option-epic' }).props.onPress();
    root.findByProps({ testID: 'category-option-main-quest' }).props.onPress();
  });

  await ReactTestRenderer.act(() => {
    root.findByProps({ testID: 'save-quest-button' }).props.onPress();
  });

  root = tree!.root;

  expect(
    root.findAll(node => node.props.children === 'Prepare final demo').length,
  ).toBeGreaterThan(0);
  expect(
    root.findAll(node => node.props.children === 'Open Add Quest').length,
  ).toBeGreaterThan(0);
});
