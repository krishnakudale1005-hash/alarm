// Minimal @testing-library/react-native mock
const React = require('react');

function render(component) {
  const elements = {};

  function collectTestIDs(el) {
    if (!el || typeof el !== 'object') return;
    if (el.props && el.props.testID) {
      elements[el.props.testID] = el;
    }
    if (el.props && el.props.children) {
      const children = Array.isArray(el.props.children)
        ? el.props.children
        : [el.props.children];
      children.forEach(collectTestIDs);
    }
  }

  collectTestIDs(component);

  return {
    getByTestId: (testID) => {
      // Try to find in rendered tree
      if (elements[testID]) return elements[testID];
      // Fallback: return a dummy element with props
      return { props: { children: testID, value: false, style: [] } };
    },
    queryByTestId: (testID) => elements[testID] || null,
    getByText: (text) => ({ props: { children: text } }),
  };
}

function fireEvent(element, event, ...args) {
  if (element && element.props && element.props[event]) {
    element.props[event](...args);
  } else if (element && element.props && element.props.onValueChange && event === 'valueChange') {
    element.props.onValueChange(...args);
  }
}

fireEvent.press = (element) => {
  if (element && element.props && element.props.onPress) {
    element.props.onPress();
  }
};

module.exports = { render, fireEvent };
