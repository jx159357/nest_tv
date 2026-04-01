import { createConnection } from 'typeorm';
import { User } from './src/entities/user.entity';
import { MediaResource } from './src/entities/media-resource.entity';
import { PlaySource } from './src/entities/play-source.entity';
import { WatchHistory } from './src/entities/watch-history.entity';
import { DownloadTask } from './src/entities/download-task.entity';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

/**
 * 初始化数据库表结构
 */
async function initializeDatabase() {
  console.log('🚀 开始初始化数据库表结构...\n');
  
  try {
    // 创建数据库连接
    const connection = await createConnection({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'nest_tv',
      synchronize: false, // 不自动同步，手动创建表
      logging: true,
      entities: [User, MediaResource, PlaySource, WatchHistory, DownloadTask],
    });

    console.log('✅ 数据库连接成功！');

    // 检查数据库是否存在，如果不存在则创建
    await connection.query(`
      CREATE DATABASE IF NOT EXISTS \`${process.env.DB_DATABASE || 'nest_tv'}\` 
      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    console.log('✅ 数据库已准备就绪');

    // 使用目标数据库
    await connection.query(`USE \`${process.env.DB_DATABASE || 'nest_tv'}\`;`);

    // 检查表是否已存在
    const [tables] = await connection.query(`
      SHOW TABLES LIKE '%';
    `);

    const tableNames = tables.map(t => Object.values(t)[0]);
    
    console.log(`\n📋 当前数据库中的表: ${tableNames.length > 0 ? tableNames.join(', ') : '无'}`);

    // 创建用户表
    if (!tableNames.includes('users')) {
      console.log('\n📝 创建用户表 (users)...');
      await connection.query(`
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          phone VARCHAR(20) NULL,
          nickname VARCHAR(100) NULL,
          role VARCHAR(20) DEFAULT 'user',
          isActive BOOLEAN DEFAULT true,
          avatar VARCHAR(255) NULL,
          lastLoginAt DATETIME NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('✅ 用户表创建成功');
    } else {
      console.log('✅ 用户表已存在，跳过创建');
    }

    // 创建影视资源表
    if (!tableNames.includes('media_resources')) {
      console.log('\n📝 创建影视资源表 (media_resources)...');
      await connection.query(`
        CREATE TABLE media_resources (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(200) NOT NULL,
          description TEXT NULL,
          type ENUM('movie', 'tv_series', 'variety', 'anime', 'documentary') NOT NULL,
          director VARCHAR(100) NULL,
          actors TEXT NULL,
          genres JSON NULL,
          releaseDate DATE NULL,
          quality ENUM('hd', 'full_hd', 'blue_ray', 'sd') DEFAULT 'hd',
          poster VARCHAR(500) NULL,
          backdrop VARCHAR(500) NULL,
          rating DECIMAL(3,1) DEFAULT 0.0,
          viewCount INT DEFAULT 0,
          isActive BOOLEAN DEFAULT true,
          source VARCHAR(50) NULL,
          metadata JSON NULL,
          episodeCount INT NULL,
          downloadUrls JSON NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('✅ 影视资源表创建成功');
    } else {
      console.log('✅ 影视资源表已存在，跳过创建');
    }

    // 创建播放源表
    if (!tableNames.includes('play_sources')) {
      console.log('\n📝 创建播放源表 (play_sources)...');
      await connection.query(`
        CREATE TABLE play_sources (
          id INT AUTO_INCREMENT PRIMARY KEY,
          url VARCHAR(500) NOT NULL,
          type ENUM('online', 'download', 'stream', 'third_party') NOT NULL,
          status ENUM('active', 'inactive', 'error', 'checking') DEFAULT 'checking',
          resolution VARCHAR(50) NULL,
          format VARCHAR(50) NULL,
          subtitleUrl TEXT NULL,
          priority INT DEFAULT 0,
          isAds BOOLEAN DEFAULT true,
          playCount INT DEFAULT 0,
          description TEXT NULL,
          sourceName VARCHAR(100) NULL,
          isActive BOOLEAN DEFAULT true,
          headers JSON NULL,
          expireDate DATE NULL,
          episodeNumber INT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          lastCheckedAt DATETIME NULL,
          mediaResourceId INT NOT NULL,
          FOREIGN KEY (mediaResourceId) REFERENCES media_resources(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('✅ 播放源表创建成功');
    } else {
      console.log('✅ 播放源表已存在，跳过创建');
    }

    // 创建观看历史表
    if (!tableNames.includes('watch_history')) {
      console.log('\n📝 创建观看历史表 (watch_history)...');
      await connection.query(`
        CREATE TABLE watch_history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          progress JSON NULL,
          watchDuration INT DEFAULT 0,
          isCompleted BOOLEAN DEFAULT false,
          episodeNumber INT NULL,
          playCount INT DEFAULT 1,
          lastPlayedAt DATETIME NULL,
          playSettings JSON NULL,
          notes TEXT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          userId INT NOT NULL,
          mediaResourceId INT NOT NULL,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (mediaResourceId) REFERENCES media_resources(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('✅ 观看历史表创建成功');
    } else {
      console.log('✅ 观看历史表已存在，跳过创建');
    }
    // 创建下载任务表
    if (!tableNames.includes('download_tasks')) {
      console.log('\\n📝 创建下载任务表 (download_tasks)...');
      await connection.query(`
        CREATE TABLE download_tasks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          clientId VARCHAR(80) NOT NULL,
          url TEXT NOT NULL,
          type ENUM('direct', 'torrent', 'magnet') DEFAULT 'direct',
          status ENUM('pending', 'downloading', 'paused', 'completed', 'error', 'cancelled') DEFAULT 'pending',
          progress INT DEFAULT 0,
          speed BIGINT DEFAULT 0,
          downloaded BIGINT DEFAULT 0,
          total BIGINT DEFAULT 0,
          fileName VARCHAR(255) NOT NULL,
          filePath VARCHAR(500) NULL,
          sourceLabel VARCHAR(120) NULL,
          handler ENUM('browser', 'system') DEFAULT 'browser',
          launchCount INT DEFAULT 0,
          lastLaunchedAt DATETIME NULL,
          completedAt DATETIME NULL,
          error TEXT NULL,
          metadata JSON NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          userId INT NOT NULL,
          mediaResourceId INT NULL,
          UNIQUE KEY unique_user_clientId (userId, clientId),
          INDEX idx_download_task_status (userId, status),
          INDEX idx_download_task_updated (userId, updatedAt),
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (mediaResourceId) REFERENCES media_resources(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('✅ 下载任务表创建成功');
    } else {
      console.log('✅ 下载任务表已存在，跳过创建');
    }

    // 创建关联表
    if (!tableNames.includes('users_favorites_media_resources')) {
      console.log('\n📝 创建用户收藏关联表...');
      await connection.query(`
        CREATE TABLE users_favorites_media_resources (
          userId INT NOT NULL,
          mediaResourceId INT NOT NULL,
          PRIMARY KEY (userId, mediaResourceId),
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (mediaResourceId) REFERENCES media_resources(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('✅ 用户收藏关联表创建成功');
    } else {
      console.log('✅ 用户收藏关联表已存在，跳过创建');
    }

    if (!tableNames.includes('users_configured_play_sources')) {
      console.log('\n📝 创建用户播放源配置关联表...');
      await connection.query(`
        CREATE TABLE users_configured_play_sources (
          userId INT NOT NULL,
          playSourceId INT NOT NULL,
          PRIMARY KEY (userId, playSourceId),
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (playSourceId) REFERENCES play_sources(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('✅ 用户播放源配置关联表创建成功');
    } else {
      console.log('✅ 用户播放源配置关联表已存在，跳过创建');
    }

    // 验证所有表都已创建
    const [finalTables] = await connection.query(`
      SHOW TABLES;
    `);
    
    console.log('\n🎊 数据库表结构初始化完成！');
    console.log('📋 所有数据表:');
    finalTables.forEach(table => {
      console.log(`   ✅ ${Object.values(table)[0]}`);
    });

    // 关闭连接
    await connection.close();
    console.log('\n🎉 数据库初始化完成！TypeORM将能正常连接并操作这些表。');
    
  } catch (error) {
    console.error('\n❌ 数据库初始化失败:', error.message);
    console.error('\n请确保:');
    console.log('1. MySQL服务正在运行');
    console.log('2. 数据库连接信息正确');
    console.log('3. 用户有创建数据库和表的权限');
    process.exit(1);
  }
}

// 运行初始化
initializeDatabase();

