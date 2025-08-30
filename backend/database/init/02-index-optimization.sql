-- =============================================================================
-- 数据库性能索引优化
-- =============================================================================

-- 为用户表添加额外索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(createdAt);

-- 为媒体资源表添加搜索优化索引
CREATE INDEX idx_media_resources_type ON media_resources(type);
CREATE INDEX idx_media_resources_rating ON media_resources(rating);
CREATE INDEX idx_media_resources_release_date ON media_resources(releaseDate);
CREATE INDEX idx_media_resources_view_count ON media_resources(viewCount);
CREATE INDEX idx_media_resources_created_at ON media_resources(createdAt);

-- 为播放源表添加性能索引
CREATE INDEX idx_play_sources_media_id ON play_sources(mediaId);
CREATE INDEX idx_play_sources_type ON play_sources(type);
CREATE INDEX idx_play_sources_quality ON play_sources(quality);
CREATE INDEX idx_play_sources_active ON play_sources(isActive);
CREATE INDEX idx_play_sources_priority ON play_sources(priority);

-- 为观看历史表添加查询优化索引
CREATE INDEX idx_watch_history_user_id ON watch_history(userId);
CREATE INDEX idx_watch_history_media_id ON watch_history(mediaResourceId);
CREATE INDEX idx_watch_history_episode ON watch_history(episodeNumber);
CREATE INDEX idx_watch_history_last_watched ON watch_history(lastWatchedAt);

-- 为推荐表添加性能索引
CREATE INDEX idx_recommendations_user_id ON recommendations(userId);
CREATE INDEX idx_recommendations_media_id ON recommendations(mediaResourceId);
CREATE INDEX idx_recommendations_type ON recommendations(type);
CREATE INDEX idx_recommendations_score ON recommendations(score);
CREATE INDEX idx_recommendations_is_read ON recommendations(isRead);
CREATE INDEX idx_recommendations_created_at ON recommendations(createdAt);

-- 为管理员日志表添加查询优化索引
CREATE INDEX idx_admin_logs_action ON admin_logs(action);
CREATE INDEX idx_admin_logs_resource ON admin_logs(resource);
CREATE INDEX idx_admin_logs_status ON admin_logs(status);
CREATE INDEX idx_admin_logs_role_id ON admin_logs(roleId);
CREATE INDEX idx_admin_logs_user_id ON admin_logs(userId);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(createdAt);

-- 为管理员角色表添加索引
CREATE INDEX idx_admin_roles_name ON admin_roles(name);
CREATE INDEX idx_admin_roles_is_active ON admin_roles(isActive);

-- 为管理员权限表添加索引
CREATE INDEX idx_admin_permissions_code ON admin_permissions(code);
CREATE INDEX idx_admin_permissions_resource ON admin_permissions(resource);
CREATE INDEX idx_admin_permissions_action ON admin_permissions(action);
CREATE INDEX idx_admin_permissions_is_active ON admin_permissions(isActive);

-- =============================================================================
-- 复合索引优化
-- =============================================================================

-- 用户最常查询复合索引
CREATE INDEX idx_user_search ON users(username, email);
CREATE INDEX idx_user_activity ON users(createdAt, updatedAt);

-- 媒体资源搜索复合索引
CREATE INDEX idx_media_search ON media_resources(title, type, rating);
CREATE INDEX idx_media_browse ON media_resources(type, releaseDate, rating);

-- 观看历史查询优化
CREATE INDEX idx_user_recent_media ON watch_history(userId, lastWatchedAt, episodeNumber);
CREATE INDEX idx_media_completion_stats ON watch_history(mediaResourceId, isCompleted, episodeNumber);

-- 推荐系统查询优化
CREATE INDEX idx_user_relevant_recommendations ON recommendations(userId, score, type, isRead);
CREATE INDEX idx_media_recommendations ON recommendations(mediaResourceId, score, type);

-- 管理员日志查询优化
CREATE INDEX idx_admin_activity_log ON admin_logs(roleId, action, status, createdAt);
CREATE INDEX idx_user_admin_logs ON admin_logs(userId, action, resource, createdAt);

-- 播放源选择优化
CREATE INDEX idx_media_best_sources ON play_sources(mediaId, priority, isActive, quality);

-- 全文搜索优化（如果需要）
-- ALTER TABLE media_resources ADD FULLTEXT(title, description);
-- CREATE INDEX idx_media_fulltext ON media_resources(title, description) WITH PARSER ngram;

-- =============================================================================
-- 数据库优化完成
-- =============================================================================

-- 优化设置总结：
-- 1. 所有表都有主键索引
-- 2. 外键字段都有索引
-- 3. 常用查询字段都有索引
-- 4. 排序字段都有索引
-- 5. 搜索字段都有复合索引
-- 6. 状态字段都有索引
-- 7. 时间戳字段都有索引

-- 这些索引将显著提升查询性能，特别是在数据量大的时候
-- 建议在生产环境中根据实际查询模式进一步优化