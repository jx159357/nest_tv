import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// 测试数据库配置
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_USERNAME = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_DATABASE = 'nest_tv_test';
process.env.NODE_ENV = 'test';

// 全局测试超时设置
jest.setTimeout(30000);

// 在所有测试之前运行
beforeAll(async () => {
  // 可以在这里设置测试数据库
});

// 在所有测试之后运行
afterAll(async () => {
  // 可以在这里清理测试数据库
});

// 在每个测试之前运行
beforeEach(async () => {
  // 清理测试数据
});

// 在每个测试之后运行
afterEach(async () => {
  // 清理测试数据
});