// Mock for expo-task-manager
module.exports = {
  defineTask: jest.fn(),
  isTaskRegisteredAsync: jest.fn().mockResolvedValue(false),
  unregisterAllTasksAsync: jest.fn().mockResolvedValue(undefined),
  getRegisteredTasksAsync: jest.fn().mockResolvedValue([]),
};
