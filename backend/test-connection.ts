import { createConnection } from 'typeorm';
import { createClient } from 'redis';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

/**
 * 数据库连接测试函数
 */
async function testDatabaseConnection() {
  console.log('🔍 测试MySQL数据库连接...');
  
  try {
    const connection = await createConnection({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'nest_tv',
      synchronize: false,
      logging: true,
    });

    console.log('✅ MySQL数据库连接成功！');
    console.log(`📊 数据库: ${process.env.DB_DATABASE}`);
    console.log(`🏠️  主机: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    
    await connection.close();
    return true;
  } catch (error) {
    console.error('❌ MySQL数据库连接失败:', error.message);
    return false;
  }
}

/**
 * Redis连接测试函数
 */
async function testRedisConnection() {
  console.log('\n🔍 测试Redis连接...');
  try {
    const client = createClient({
      url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`,
      password: process.env.REDIS_PASSWORD || undefined,
    });

    client.on('error', (err) => {
      console.error('Redis客户端错误:', err);
    });

    await client.connect();
    
    // 测试Redis命令
    const testResult = await client.ping();
    console.log('✅ Redis连接成功！');
    console.log(`🏓  Redis服务器响应: ${testResult}`);
    console.log(`🏠️  Redis主机: ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`);
    
    await client.disconnect();
    return true;
  } catch (error) {
    console.error('❌ Redis连接失败:', error.message);
    return false;
  }
}

/**
 * 创建数据库的函数
 */
async function createDatabase() {
  console.log('\n🔍 创建nest_tv数据库...');
  try {
    const connection = await createConnection({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'mysql', // 连接到mysql系统数据库
      synchronize: false,
      logging: true,
    });

    const query = `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_DATABASE || 'nest_tv'}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`;
    await connection.query(query);
    
    console.log('✅ 数据库创建成功！');
    await connection.close();
    return true;
  } catch (error) {
    console.error('❌ 数据库创建失败:', error.message);
    return false;
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('🚀 开始数据库和Redis连接测试\n');
  
  // 显示当前环境变量（隐藏密码）
  console.log('📋 环境变量配置:');
  console.log(`数据库主机: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`数据库端口: ${process.env.DB_PORT || '3306'}`);
  console.log(`数据库用户: ${process.env.DB_USERNAME || 'root'}`);
  console.log(`数据库名称: ${process.env.DB_DATABASE || 'nest_tv'}`);
  console.log(`Redis主机: ${process.env.REDIS_HOST || 'localhost'}`);
  console.log(`Redis端口: ${process.env.REDIS_PORT || '6379'}`);
  console.log('---');

  const dbSuccess = await testDatabaseConnection();
  const redisSuccess = await testRedisConnection();
  
  if (!dbSuccess) {
    console.log('\n📝 尝试创建数据库...');
    await createDatabase();
    console.log('\n🔄 重新测试数据库连接...');
    await testDatabaseConnection();
  }
  
  console.log('\n📊 测试结果汇总:');
  console.log(`MySQL数据库: ${dbSuccess ? '✅ 正常' : '❌ 失败'}`);
  console.log(`Redis缓存: ${redisSuccess ? '✅ 正常' : '❌ 失败'}`);
  
  if (dbSuccess && redisSuccess) {
    console.log('\n🎉 所有连接测试通过！可以启动后端项目了。');
    process.exit(0);
  } else {
    console.log('\n⚠️  请检查数据库和Redis服务是否正常运行，并确认环境变量配置正确。');
    process.exit(1);
  }
}

// 运行测试
runTests().catch((error) => {
  console.error('测试运行出错:', error);
  process.exit(1);
});