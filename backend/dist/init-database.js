"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./src/entities/user.entity");
const media_resource_entity_1 = require("./src/entities/media-resource.entity");
const play_source_entity_1 = require("./src/entities/play-source.entity");
const watch_history_entity_1 = require("./src/entities/watch-history.entity");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
async function initializeDatabase() {
    console.log('🚀 开始初始化数据库表结构...\n');
    try {
        const connection = await (0, typeorm_1.createConnection)({
            type: 'mysql',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            username: process.env.DB_USERNAME || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_DATABASE || 'nest_tv',
            synchronize: false,
            logging: true,
            entities: [user_entity_1.User, media_resource_entity_1.MediaResource, play_source_entity_1.PlaySource, watch_history_entity_1.WatchHistory],
        });
        console.log('✅ 数据库连接成功！');
        await connection.query(`
      CREATE DATABASE IF NOT EXISTS \`${process.env.DB_DATABASE || 'nest_tv'}\` 
      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
        console.log('✅ 数据库已准备就绪');
        await connection.query(`USE \`${process.env.DB_DATABASE || 'nest_tv'}\`;`);
        const [tables] = await connection.query(`
      SHOW TABLES LIKE '%';
    `);
        const tableNames = tables.map(t => Object.values(t)[0]);
        console.log(`\n📋 当前数据库中的表: ${tableNames.length > 0 ? tableNames.join(', ') : '无'}`);
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
        }
        else {
            console.log('✅ 用户表已存在，跳过创建');
        }
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
        }
        else {
            console.log('✅ 影视资源表已存在，跳过创建');
        }
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
        }
        else {
            console.log('✅ 播放源表已存在，跳过创建');
        }
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
        }
        else {
            console.log('✅ 观看历史表已存在，跳过创建');
        }
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
        }
        else {
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
        }
        else {
            console.log('✅ 用户播放源配置关联表已存在，跳过创建');
        }
        const [finalTables] = await connection.query(`
      SHOW TABLES;
    `);
        console.log('\n🎊 数据库表结构初始化完成！');
        console.log('📋 所有数据表:');
        finalTables.forEach(table => {
            console.log(`   ✅ ${Object.values(table)[0]}`);
        });
        await connection.close();
        console.log('\n🎉 数据库初始化完成！TypeORM将能正常连接并操作这些表。');
    }
    catch (error) {
        console.error('\n❌ 数据库初始化失败:', error.message);
        console.error('\n请确保:');
        console.log('1. MySQL服务正在运行');
        console.log('2. 数据库连接信息正确');
        console.log('3. 用户有创建数据库和表的权限');
        process.exit(1);
    }
}
initializeDatabase();
//# sourceMappingURL=init-database.js.map