-- 创建数据库
CREATE DATABASE IF NOT EXISTS nest_tv;

-- 使用数据库
USE nest_tv;

-- 创建用户表（如果不存在）
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(500) NULL,
  bio TEXT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建媒体资源表
CREATE TABLE IF NOT EXISTS media_resources (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(500) NOT NULL,
  description TEXT NULL,
  type ENUM('movie', 'tv_show', 'variety', 'documentary', 'anime', 'other') NOT NULL,
  poster VARCHAR(500) NULL,
  rating DECIMAL(3,1) DEFAULT 0.0,
  duration INT NULL,
  releaseDate DATE NULL,
  episodeCount INT NULL,
  viewCount INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FULLTEXT(title, description) -- 添加全文索引支持搜索
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建播放源表
CREATE TABLE IF NOT EXISTS play_sources (
  id INT PRIMARY KEY AUTO_INCREMENT,
  mediaId INT NOT NULL,
  sourceName VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  type ENUM('online', 'download', 'local', 'stream') NOT NULL DEFAULT 'online',
  quality ENUM('360p', '480p', '720p', '1080p', '4k', 'other') NULL,
  format ENUM('mp4', 'mkv', 'webm', 'avi', 'mov', 'flv', 'other') NULL,
  size BIGINT NULL,
  language VARCHAR(50) NULL,
  subtitleLanguage VARCHAR(50) NULL,
  isActive BOOLEAN DEFAULT TRUE,
  priority INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (mediaId) REFERENCES media_resources(id) ON DELETE CASCADE,
  INDEX idx_mediaId (mediaId),
  INDEX idx_priority (priority),
  INDEX idx_isActive (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建观看历史表
CREATE TABLE IF NOT EXISTS watch_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  mediaResourceId INT NOT NULL,
  playSourceId INT NULL,
  currentTime INT DEFAULT 0 COMMENT '当前观看时间（秒）',
  duration INT NULL COMMENT '总时长（秒）',
  isCompleted BOOLEAN DEFAULT FALSE COMMENT '是否观看完毕',
  episodeNumber INT NULL COMMENT '剧集号',
  lastWatchedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (mediaResourceId) REFERENCES media_resources(id) ON DELETE CASCADE,
  FOREIGN KEY (playSourceId) REFERENCES play_sources(id) ON DELETE SET NULL,
  INDEX idx_userId (userId),
  INDEX idx_mediaResourceId (mediaResourceId),
  INDEX idx_lastWatchedAt (lastWatchedAt),
  UNIQUE KEY unique_user_media_episode (userId, mediaResourceId, episodeNumber)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建推荐表
CREATE TABLE IF NOT EXISTS recommendations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  mediaResourceId INT NOT NULL,
  type ENUM('personalized', 'trending', 'editorial', 'similar', 'popular') NOT NULL DEFAULT 'personalized',
  score DECIMAL(5,2) DEFAULT 0.00 COMMENT '推荐分数',
  reason TEXT NULL COMMENT '推荐原因',
  isRead BOOLEAN DEFAULT FALSE COMMENT '是否已读',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (mediaResourceId) REFERENCES media_resources(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_type (type),
  INDEX idx_score (score),
  INDEX idx_createdAt (createdAt),
  UNIQUE KEY unique_user_media (userId, mediaResourceId, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建用户收藏的媒体资源关联表（多对多）
CREATE TABLE IF NOT EXISTS media_resources_favorites_users (
  userId INT NOT NULL,
  mediaResourceId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (userId, mediaResourceId),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (mediaResourceId) REFERENCES media_resources(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 同义表用于反向关联（TypeORM要求）
CREATE TABLE IF NOT EXISTS users_favorites_media_resources (
  mediaResourceId INT NOT NULL,
  userId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (mediaResourceId, userId),
  FOREIGN KEY (mediaResourceId) REFERENCES media_resources(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建用户配置的播放源关联表（多对多）
CREATE TABLE IF NOT EXISTS play_sources_configured_by_users (
  userId INT NOT NULL,
  playSourceId INT NOT NULL,
  priority INT DEFAULT 0 COMMENT '用户设置的优先级',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (userId, playSourceId),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (playSourceId) REFERENCES play_sources(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 同义表
CREATE TABLE IF NOT EXISTS users_configured_play_sources_play_sources (
  playSourceId INT NOT NULL,
  userId INT NOT NULL,
  priority INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (playSourceId, userId),
  FOREIGN KEY (playSourceId) REFERENCES play_sources(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建管理员角色表
CREATE TABLE IF NOT EXISTS admin_roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NULL,
  permissions JSON NULL COMMENT '权限列表JSON数组',
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建管理员权限表
CREATE TABLE IF NOT EXISTS admin_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(255) NOT NULL UNIQUE COMMENT '权限代码，如：user_create',
  name VARCHAR(255) NOT NULL COMMENT '权限名称',
  description TEXT NULL COMMENT '权限描述',
  resource VARCHAR(100) NULL COMMENT '关联资源，如：user、media等',
  action VARCHAR(50) NULL COMMENT '操作类型，如：create、read、update、delete',
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_resource (resource),
  INDEX idx_action (action),
  INDEX idx_isActive (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建管理员日志表
CREATE TABLE IF NOT EXISTS admin_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  action VARCHAR(100) NOT NULL COMMENT '操作类型',
  resource VARCHAR(100) NOT NULL COMMENT '操作资源',
  metadata JSON NULL COMMENT '操作元数据',
  description TEXT NULL COMMENT '操作描述',
  status ENUM('success', 'error', 'warning') DEFAULT 'success' COMMENT '操作状态',
  errorMessage TEXT NULL COMMENT '错误信息',
  requestInfo JSON NULL COMMENT '请求信息',
  roleId INT NOT NULL COMMENT '操作角色ID',
  userId INT NULL COMMENT '关联用户ID（如果适用）',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (roleId) REFERENCES admin_roles(id),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_action (action),
  INDEX idx_resource (resource),
  INDEX idx_status (status),
  INDEX idx_roleId (roleId),
  INDEX idx_userId (userId),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入初始管理员角色
INSERT IGNORE INTO admin_roles (id, name, description, permissions, isActive) VALUES 
(1, '超级管理员', '系统超级管理员，拥有所有权限', '["*"]', true),
(2, '内容管理员', '负责媒体内容管理', '["media_read", "media_create", "media_update", "media_delete"]', true),
(3, '用户管理员', '负责用户管理', '["user_read", "user_create", "user_update", "user_delete"]', true),
(4, '播放源管理员', '负责播放源管理', '["play_source_read", "play_source_create", "play_source_update", "play_source_delete"]', true),
(5, '观察管理员', '只读权限，查看系统数据', '["dashboard_read", "stats_read", "logs_read"]', true);

-- 插入初始管理员权限
INSERT IGNORE INTO admin_permissions (id, code, name, description, resource, action, isActive) VALUES 
(1, '*', '所有权限', '系统所有权限', NULL, NULL, true),
(2, 'dashboard_read', '查看仪表盘', '查看系统仪表盘数据', 'admin', 'read', true),
(3, 'stats_read', '查看统计', '查看系统统计数据', 'admin', 'read', true),
(4, 'logs_read', '查看日志', '查看系统操作日志', 'admin', 'read', true),
(5, 'user_read', '查看用户', '查看用户列表和详情', 'user', 'read', true),
(6, 'user_create', '创建用户', '创建新用户账户', 'user', 'create', true),
(7, 'user_update', '更新用户', '更新用户信息', 'user', 'update', true),
(8, 'user_delete', '删除用户', '删除用户账户', 'user', 'delete', true),
(9, 'media_read', '查看媒体', '查看媒体资源列表和详情', 'media', 'read', true),
(10, 'media_create', '创建媒体', '创建新媒体资源', 'media', 'create', true),
(11, 'media_update', '更新媒体', '更新媒体资源信息', 'media', 'update', true),
(12, 'media_delete', '删除媒体', '删除媒体资源', 'media', 'delete', true),
(13, 'play_source_read', '查看播放源', '查看播放源列表和详情', 'play_source', 'read', true),
(14, 'play_source_create', '创建播放源', '创建新播放源', 'play_source', 'create', true),
(15, 'play_source_update', '更新播放源', '更新播放源信息', 'play_source', 'update', true),
(16, 'play_source_delete', '删除播放源', '删除播放源', 'play_source', 'delete', true),
(17, 'watch_history_read', '查看观看历史', '查看用户观看历史', 'watch_history', 'read', true),
(18, 'watch_history_delete', '删除观看历史', '删除观看历史记录', 'watch_history', 'delete', true);

-- 创建一些示例数据（可选）
-- 创建示例用户（密码通过bcrypt哈希，实际使用时应该通过应用创建）
-- 注意：这里的密码是 '123456' 的bcrypt哈希值
INSERT IGNORE INTO users (id, username, email, password) VALUES 
(1, 'admin', 'admin@example.com', '$2b$12$EixZaY6n7lO9lBz1tZkMR/G5J4T7P5Y.GXx7a'),

-- 创建示例媒体资源
INSERT IGNORE INTO media_resources (id, title, description, type, poster, rating, duration, releaseDate, episodeCount, viewCount) VALUES 
(1, '示例电影', '这是一部示例电影，用于演示系统功能', 'movie', 'https://via.placeholder.com/600x900?text=Sample+Movie', 8.5, 7200, '2024-01-01', NULL, 156),
(2, '示例电视剧', '这是一部示例电视剧，包含多集内容', 'tv_show', 'https://via.placeholder.com/600x900?text=Sample+TV+Show', 9.2, 2700, '2024-01-01', 10, 89),
(3, '示例纪录片', '这是一部示例纪录片', 'documentary', 'https://via.placeholder.com/600x900?text=Sample+Documentary', 7.8, 5400, '2023-12-15', NULL, 45);

-- 创建示例播放源
INSERT IGNORE INTO play_sources (id, mediaId, sourceName, url, type, quality, format, priority) VALUES 
(1, 1, '示例播放源1', 'https://sample-videos.com/movie1.mp4', 'online', '1080p', 'mp4', 1),
(2, 1, '示例播放源2', 'https://sample-videos.com/movie1_720p.mp4', 'online', '720p', 'mp4', 2),
(3, 2, '示例播放源3', 'https://sample-videos.com/tv_show1.mp4', 'online', '1080p', 'mp4', 1),
(4, 3, '示例播放源4', 'https://sample-videos.com/documentary1.mp4', 'online', '720p', 'mp4', 1);

-- 创建示例推荐
INSERT IGNORE INTO recommendations (id, userId, mediaResourceId, type, score, reason) VALUES 
(1, 1, 1, 'personalized', 9.5, '基于您的观看历史和兴趣推荐'),
(2, 1, 2, 'trending', 9.2, '当前热门内容'),
(3, 1, 3, 'similar', 8.8, '与您观看过的内容相似');