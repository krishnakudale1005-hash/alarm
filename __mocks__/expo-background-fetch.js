// Mock for expo-background-fetch
const BackgroundFetchStatus = {
  Denied: 1,
  Restricted: 2,
  Available: 3,
};

const BackgroundFetchResult = {
  NoData: 1,
  NewData: 2,
  Failed: 3,
};

module.exports = {
  BackgroundFetchStatus,
  BackgroundFetchResult,
  registerTaskAsync: jest.fn().mockResolvedValue(undefined),
  unregisterTaskAsync: jest.fn().mockResolvedValue(undefined),
  getStatusAsync: jest.fn().mockResolvedValue(BackgroundFetchStatus.Available),
};
