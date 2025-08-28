-- 数据库初始化脚本
-- 创建nest_tv数据库
CREATE DATABASE IF NOT EXISTS nest_tv CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE nest_tv;

-- 显示数据库信息
SELECT '数据库nest_tv创建成功' as message;

-- 查看数据库列表
SHOW DATABASES;