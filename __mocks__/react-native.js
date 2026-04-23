// Minimal React Native mock for component tests
const React = require('react');

const View = ({ children, testID, style, ...props }) =>
  React.createElement('View', { testID, style, ...props }, children);

const Text = ({ children, testID, style, ...props }) =>
  React.createElement('Text', { testID, style, ...props }, children);

const TouchableOpacity = ({ children, testID, onPress, style, ...props }) =>
  React.createElement('TouchableOpacity', { testID, onPress, style, ...props }, children);

const Switch = ({ testID, value, onValueChange, ...props }) =>
  React.createElement('Switch', { testID, value, onValueChange, ...props });

const StyleSheet = {
  create: (styles) => styles,
  flatten: (style) => (Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style || {}),
};

const Platform = {
  OS: 'ios',
  select: (obj) => obj.ios || obj.default,
};

const Alert = {
  alert: jest.fn(),
};

module.exports = {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Platform,
  Alert,
  FlatList: View,
  ScrollView: View,
  Modal: View,
  TextInput: View,
  Animated: {
    Value: jest.fn(() => ({ interpolate: jest.fn() })),
    timing: jest.fn(() => ({ start: jest.fn() })),
    loop: jest.fn(() => ({ start: jest.fn() })),
    sequence: jest.fn(() => ({ start: jest.fn() })),
    View,
  },
  Dimensions: {
    get: () => ({ width: 375, height: 812 }),
  },
  BackHandler: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
};
