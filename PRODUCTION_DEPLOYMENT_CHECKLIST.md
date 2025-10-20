# Nest TV 生产环境部署检查清单

## 🔍 部署前检查

### ✅ 安全检查
- [ ] 更改所有默认密码（数据库、JWT密钥等）
- [ ] 配置HTTPS证书和SSL/TLS设置
- [ ] 设置防火墙规则，只开放必要端口
- [ ] 配置CORS白名单，限制允许的域名
- [ ] 启用安全头设置（HSTS、CSP等）
- [ ] 验证JWT配置和密钥强度
- [ ] 检查数据库连接安全性
- [ ] 禁用开发环境的调试功能

### ✅ 环境配置
- [ ] 设置NODE_ENV=production
- [ ] 配置生产环境数据库连接
- [ ] 设置Redis连接（如果使用）
- [ ] 配置日志路径和轮转策略
- [ ] 设置监控和告警系统
- [ ] 配置备份策略
- [ ] 验证所有环境变量已设置

### ✅ 数据库配置
- [ ] 创建生产环境数据库
- [ ] 配置数据库用户权限
- [ ] 优化连接池设置
- [ ] 创建必要索引
- [ ] 设置备份计划
- [ ] 测试数据库连接和性能
- [ ] 验证数据迁移脚本

### ✅ 应用配置
- [ ] 构建生产版本代码
- [ ] 配置反向代理（Nginx/Apache）
- [ ] 设置静态文件服务
- [ ] 配置缓存策略
- [ ] 启用Gzip压缩
- [ ] 设置请求限流
- [ ] 配置健康检查端点

## 🚀 部署步骤

### 1. 服务器准备
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要软件
sudo apt install -y nginx nodejs npm mysql-server redis-server

# 配置防火墙
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 2. 数据库设置
```bash
# MySQL安全配置
sudo mysql_secure_installation

# 创建数据库和用户
mysql -u root -p
CREATE DATABASE nest_tv;
CREATE USER 'nesttv_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON nest_tv.* TO 'nesttv_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. 应用部署
```bash
# 克隆代码
git clone <repository-url>
cd nest_tv

# 安装依赖
npm ci --production

# 构建应用
npm run build

# 配置环境变量
cp .env.example .env
# 编辑.env文件设置生产环境配置

# 启动应用（使用PM2）
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 4. Nginx配置
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://localhost:3334;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads/ {
        alias /var/www/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 📊 监控和维护

### ✅ 监控配置
- [ ] 设置应用性能监控（APM）
- [ ] 配置错误日志收集
- [ ] 设置资源使用监控
- [ ] 配置告警通知
- [ ] 设置健康检查脚本
- [ ] 配置日志聚合分析

### ✅ 备份策略
- [ ] 数据库自动备份
- [ ] 文件系统备份
- [ ] 配置文件备份
- [ ] 测试恢复流程
- [ ] 设置异地备份
- [ ] 备份加密

### ✅ 性能优化
- [ ] 启用数据库查询缓存
- [ ] 配置Redis缓存
- [ ] 设置CDN（如需要）
- [ ] 优化静态资源压缩
- [ ] 配置负载均衡
- [ ] 设置自动扩展

## 🧪 测试验证

### ✅ 功能测试
- [ ] 验证用户注册登录
- [ ] 测试影视资源CRUD
- [ ] 验证搜索功能
- [ ] 测试文件上传
- [ ] 验证权限控制
- [ ] 测试并发访问

### ✅ 性能测试
- [ ] 负载测试
- [ ] 压力测试
- [ ] 响应时间测试
- [ ] 数据库性能测试
- [ ] 内存使用测试
- [ ] 并发用户测试

### ✅ 安全测试
- [ ] SQL注入测试
- [ ] XSS防护测试
- [ ] CSRF防护测试
- [ ] 认证授权测试
- [ ] 文件上传安全测试
- [ ] API限流测试

## 📋 运维检查清单

### 日常检查
- [ ] 检查应用运行状态
- [ ] 查看错误日志
- [ ] 监控资源使用情况
- [ ] 验证备份完成
- [ ] 检查SSL证书有效期
- [ ] 更新安全补丁

### 周期检查
- [ ] 数据库性能分析
- [ ] 日志清理和归档
- [ ] 缓存优化
- [ ] 安全漏洞扫描
- [ ] 依赖包更新
- [ ] 容量规划评估

## 🚨 故障处理

### 常见问题解决
1. **应用无法启动**
   - 检查环境变量配置
   - 验证数据库连接
   - 查看应用日志

2. **数据库连接失败**
   - 检查数据库服务状态
   - 验证连接字符串
   - 检查防火墙设置

3. **性能问题**
   - 检查数据库慢查询
   - 监控内存使用
   - 分析CPU使用率

4. **安全告警**
   - 查看访问日志
   - 检查异常访问模式
   - 更新安全规则

## 📞 联系信息

- 开发团队：[联系方式]
- 运维团队：[联系方式] 
- 安全团队：[联系方式]
- 管理层：[联系方式]

---

**重要提醒**：
- 部署前请在测试环境充分验证
- 保留完整的部署记录
- 建立应急响应机制
- 定期进行安全审计