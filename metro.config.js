// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Fix: expo-sqlite loads a .wasm file on web which Metro can't resolve.
// We stub it out with an empty module so the web bundle doesn't crash.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
};

// Redirect .wasm files to an empty stub on web
const originalResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Stub out the wa-sqlite WASM file for web
  if (moduleName.endsWith('.wasm')) {
    return {
      filePath: path.resolve(__dirname, '__mocks__/wasmStub.js'),
      type: 'sourceFile',
    };
  }
  if (originalResolver) {
    return originalResolver(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
