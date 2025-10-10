import { vi } from 'vitest';
import { config } from '@vue/test-utils';

// 全局测试配置
config.global.mocks = {
  $t: key => key,
};

// 模拟 localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// 模拟 fetch API
global.fetch = vi.fn();

// 全局测试超时
vi.setConfig({
  testTimeout: 10000,
});

// 在所有测试之前运行
beforeAll(() => {
  // 可以在这里设置全局测试数据
});

// 在所有测试之后运行
afterAll(() => {
  // 可以在这里清理全局测试数据
});

// 在每个测试之前运行
beforeEach(() => {
  // 清理所有 mock 调用
  vi.clearAllMocks();

  // 清理 localStorage
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
});

// 在每个测试之后运行
afterEach(() => {
  // 清理测试数据
});
