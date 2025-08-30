# 🐳 Nest TV Docker 部署指南

本项目提供完整的Docker容器化部署方案，支持开发环境和生产环境。

## 📋 目录

- [🔧 系统要求](#-系统要求)
- [📦 开发环境部署](#-开发环境部署)
- [🏭 生产环境部署](#-生产环境部署)
- [🔍 常用命令](#-常用命令)
- [🐛 故障排除](#-故障排除)

## 🔧 系统要求

### 必需软件
- [Docker](https://docs.docker.com/get-docker/) 版本 ≥ 20.10
- [Docker Compose](https://docs.docker.com/compose/) 版本 ≥ 2.20
- [Git](https://git-scm.com/) 版本 ≥ 2.30

### 硬件要求
- **开发环境**: 2GB+ RAM, 2CPU+ cores
- **生产环境**: 4GB+ RAM, 4CPU+ cores
- **磁盘空间**: 10GB+ 可用空间

## 📦 开发环境部署

### 1. 克隆项目
```bash
# 克隆项目到本地
git clone https://github.com/yourusername/nest_tv.git
cd nest_tv

# 安装依赖（如果需要）
cd backend && npm install
cd ../frontend && npm install
```

### 2. 配置环境变量
```bash
# 复制环境变量模板
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 根据需要修改配置
vim backend/.env
vim frontend/.env
```

### 3. 启动开发环境
```bash
# 在项目根目录执行
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f api
docker-compose logs -f frontend
```

### 4. 访问应用
- **前端**: http://localhost:3000
- **后端API**: http://localhost:3335
- **API文档**: http://localhost:3335/api

### 开发环境特性
- 🔁 **热重载**: 代码修改自动重启
- 🐛 **调试模式**: 完整的错误信息和调试工具
- 📊 **开发数据库**: 独立的开发数据库
- 🔄 **快速重启**: 单个服务重启

## 🏭 生产环境部署

### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Docker和Docker Compose
sudo apt install docker.io docker-compose -y

# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
docker-compose --version
```

### 2. 部署项目

#### 方式一：使用docker-compose.prod.yml（推荐）

```bash
# 上传项目文件到服务器
scp -r nest_tv user@your-server:/home/user/

# 登录服务器
ssh user@your-server

# 进入项目目录
cd nest_tv

# 配置生产环境变量
cp .env.production .env
vim .env  # 修改必要配置

# 启动所有服务
docker-compose -f docker-compose.prod.yml up -d

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps
```

#### 方式二：分步部署

```bash
# 1. 构建后端镜像
docker build -t nest_tv_backend:latest ./backend

# 2. 构建前端镜像
docker build -t nest_tv_frontend:latest ./frontend

# 3. 启动数据库
docker run -d --name nest_tv_mysql \
  -e MYSQL_ROOT_PASSWORD=root_password_prod \
  -e MYSQL_DATABASE=nest_tv \
  -e MYSQL_USER=nest_user \
  -e MYSQL_PASSWORD=nest_password \
  -p 3307:3306 \
  -v mysql_data:/var/lib/mysql \
  mysql:8.0 --default-authentication-plugin=mysql_native_password

# 4. 启动Redis
docker run -d --name nest_tv_redis \
  -p 6380:6379 \
  -v redis_data:/data \
  redis:7-alpine --appendonly yes

# 5. 启动后端服务
docker run -d --name nest_tv_api \
  -p 3335:3335 \
  -e NODE_ENV=production \
  --link nest_tv_mysql:mysql \
  --link nest_tv_redis:redis \
  nest_tv_backend:latest

# 6. 启动前端服务
docker run -d --name nest_tv_frontend \
  -p 80:80 \
  --link nest_tv_api:api \
  nest_tv_frontend:latest
```

### 3. 配置反向代理（Nginx）

```nginx
# /etc/nginx/sites-available/nest_tv.conf
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    # SSL证书配置
    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:ECDHE_RSA_AES_128_GCM_SHA256:ECDHE_RSA_AES_256_GCM_SHA384';
    ssl_prefer_server_ciphers on;
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # 客户端最大请求体大小
    client_max_body_size 100M;
    
    # 代理配置
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $cookie_nocache;
        proxy_no_cache $cookie_nocache;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_buffer_size 4k;
        proxy_buffers 4 32k;
        proxy_busy_buffers_size 64k;
    }
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/json
        application/xml+rss
        image/svg+xml;
    gzip_min_length 1000;
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # 健康检查
    location /health {
        access_log off;
        return 200 "healthy";
        add_header Content-Type text/plain;
    }
}
```

### 4. SSL证书配置

#### 使用Let's Encrypt（免费）
```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx -y

# 申请证书
sudo certbot --nginx -d yourdomain.com --email admin@yourdomain.com --agree-tos --redirect --hsts

# 自动续期
sudo crontab -e "0 12 * * * /usr/bin/certbot renew --quiet"
```

#### 使用云服务商SSL证书
1. 购买SSL证书（如：Namecheap, GoDaddy, SSL.com）
2. 下载证书文件（.crt, .key）
3. 上传到服务器 `/etc/ssl/yourdomain.com/`
4. 配置Nginx使用证书文件

### 5. 数据库迁移

```bash
# 进入后端容器
docker exec -it nest_tv_api bash

# 运行数据库迁移
npm run migration:run

# 如果有TypeORM同步问题
npm run typeorm:sync

# 退出容器
exit
```

### 6. 验证部署

```bash
# 检查所有服务状态
docker-compose -f docker-compose.prod.yml ps

# 检查服务健康状态
curl http://localhost/health
curl http://localhost:3335/health
curl -I http://localhost:3000

# 查看应用日志
docker-compose -f docker-compose.prod.yml logs -f api --tail=50
docker-compose -f docker-compose.prod.yml logs -f frontend --tail=50

# 数据库连接测试
docker exec nest_tv_mysql mysql -unest_user -pnest_password -e "SELECT 1;"

# Redis连接测试
docker exec nest_tv_redis redis-cli ping
```

## 🔍 常用命令

### 服务管理
```bash
# 启动所有服务
docker-compose up -d

# 启动特定服务
docker-compose up -d api mysql redis

# 停止所有服务
docker-compose down

# 停止并删除卷
docker-compose down -v

# 重新构建并启动
docker-compose up -d --build

# 查看服务状态
docker-compose ps

# 查看实时日志
docker-compose logs -f api
docker-compose logs -f api --tail=100

# 进入服务容器
docker exec -it nest_tv_api bash
docker exec -it nest_tv_mysql mysql -unest_user -p

# 复制文件到容器
docker cp ./local/file.txt nest_tv_api:/app/file.txt

# 从容器复制文件
docker cp nest_tv_api:/app/file.txt ./local/
```

### 生产环境命令
```bash
# 使用生产配置文件
docker-compose -f docker-compose.prod.yml up -d

# 查看生产服务状态
docker-compose -f docker-compose.prod.yml ps

# 生产环境日志
docker-compose -f docker-compose.prod.yml logs -f api

# 生产环境重启
docker-compose -f docker-compose.prod.yml restart api

# 生产环境更新（重新构建）
docker-compose -f docker-compose.prod.yml up -d --build
```

### 数据库管理
```bash
# 数据库备份
docker exec nest_tv_mysql mysqldump -unest_user -pnest_password nest_tv > backup_$(date +%Y%m%d_%H%M%S).sql

# 数据库恢复
docker exec -i nest_tv_mysql mysql -unest_user -pnest_password nest_tv < backup_20240101_123045.sql

# 数据库清理
docker exec nest_tv_mysql mysql -unest_user -pnest_password -e "DROP DATABASE IF EXISTS nest_tv_temp; CREATE DATABASE nest_tv_temp;"

# 查看数据库大小
docker exec nest_tv_mysql mysql -unest_user -pnest_password -e "SELECT table_schema AS 'Database', ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' FROM information_schema.tables WHERE table_schema = 'nest_tv';"
```

### 性能监控
```bash
# 查看容器资源使用
docker stats

# 查看特定容器资源
docker stats nest_tv_api

# 容器性能分析
docker run --rm --pid=host -it --privileged \
  -v /:/host:/host \
  --pid=host \
  alpine:latest \
  nsenter -t 1 -m -p <container_pid>

# 查看容器日志大小
docker logs nest_tv_api 2>&1 | wc -c

# 清理未使用的Docker资源
docker system prune -f
docker volume prune -f
docker image prune -f
```

## 🐛 故障排除

### 常见问题及解决方案

#### 1. 容器启动失败
```bash
# 问题：容器启动后立即退出
# 解决：查看详细错误信息
docker-compose logs api

# 检查Dockerfile语法错误
docker build -t test ./backend

# 检查端口冲突
netstat -tuln | grep :3335

# 检查文件权限
ls -la backend/
```

#### 2. 数据库连接失败
```bash
# 问题：后端服务无法连接数据库
# 解决：检查数据库状态
docker-compose logs mysql

# 检查数据库网络连通性
docker exec nest_tv_api ping mysql

# 检查环境变量
docker exec nest_tv_api env | grep -i db

# 手动测试数据库连接
docker exec nest_tv_api mysql -h mysql -unest_user -pnest_password -e "SELECT 1;"

# 检查数据库初始化状态
docker exec nest_tv_mysql mysql -uroot -proot_password_prod -e "SHOW DATABASES; USE nest_tv; SHOW TABLES;"
```

#### 3. 前端无法访问后端API
```bash
# 问题：CORS错误或API连接失败
# 解决：检查网络配置
docker network ls
docker network inspect nest_tv_app-network

# 测试API连通性
docker exec nest_tv_frontend curl http://api:3335/health

# 检查代理配置
docker exec nest_tv_frontend cat /etc/nginx/conf.d/default.conf

# 检查防火墙设置
sudo ufw status
sudo iptables -L
```

#### 4. 内存不足问题
```bash
# 问题：容器因内存不足被杀掉
# 解决：增加内存限制
# 编辑docker-compose.prod.yml，调整deploy.resources.limits.memory

# 检查内存使用情况
docker stats --no-stream

# 启用内存交换
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 添加到/etc/fstab
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

#### 5. 磁盘空间不足
```bash
# 问题：磁盘空间不足导致容器启动失败
# 解决：清理磁盘空间
# 查看Docker磁盘使用
docker system df

# 清理未使用的镜像和容器
docker system prune -f

# 清理日志文件
docker exec nest_tv_api rm -rf logs/*.log

# 查看大文件
sudo find /var/lib/docker -type f -size +100M -exec ls -lh {} \;

# 扩展磁盘空间（根据云服务商文档）
```

#### 6. SSL证书问题
```bash
# 问题：SSL证书错误或不被信任
# 解决：验证证书配置
openssl x509 -in /path/to/cert.pem -text -noout

# 检查证书链是否完整
openssl verify -CAfile /path/to/ca-bundle.crt /path/to/cert.pem

# 测试SSL连接
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# 检查Nginx SSL配置
nginx -t
sudo nginx -s reload
```

### 性能优化建议

#### 数据库优化
```sql
-- 在MySQL中执行的优化语句
-- 创建索引（如果缺失）
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_media_resources_type ON media_resources(type);
CREATE INDEX idx_watch_history_user_id ON watch_history(userId);

-- 优化查询性能
ANALYZE TABLE users;
ANALYZE TABLE media_resources;
ANALYZE TABLE watch_history;
```

#### Redis优化
```bash
# Redis配置优化（在redis.conf中）
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

#### 应用性能优化
```javascript
// 在NestJS中的性能优化
// 1. 启用数据库查询缓存
// 2. 使用Redis缓存频繁访问的数据
// 3. 实施连接池管理
// 4. 启用Gzip压缩
// 5. 优化数据库查询
// 6. 使用CDN加速静态资源
```

### 监控和日志

#### 结构化日志
```yaml
# docker-compose.prod.yml 中添加日志配置
services:
  api:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        compress: "true"
    volumes:
      - /var/log/nest_tv:/app/logs
```

#### 监控堆栈集成
```yaml
# 在docker-compose.prod.yml 中添加Prometheus和Grafana
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    networks:
      - prod-network
  
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin_password
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - prod-network
    depends_on:
      - prometheus
```

### 备份和恢复策略

#### 自动备份脚本
```bash
#!/bin/bash
# backup.sh - 自动备份脚本

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_BACKUP_FILE="$BACKUP_DIR/mysql_$TIMESTAMP.sql"
REDIS_BACKUP_FILE="$BACKUP_DIR/redis_$TIMESTAMP.rdb"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 数据库备份
docker exec nest_tv_mysql mysqldump \
  -unest_user \
  -pnest_password \
  --single-transaction \
  --routines \
  --triggers \
  nest_tv > $DB_BACKUP_FILE

# Redis备份
docker exec nest_tv_redis redis-cli \
  --rdb $REDIS_BACKUP_FILE \
  --lastsave

# 压缩备份文件
gzip $DB_BACKUP_FILE
gzip $REDIS_BACKUP_FILE

# 清理30天前的备份
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $TIMESTAMP"
```

#### 恢复脚本
```bash
#!/bin/bash
# restore.sh - 恢复脚本

BACKUP_FILE=$1
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file>"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

# 停止应用服务
docker-compose -f docker-compose.prod.yml stop api

# 数据库恢复
if [[ $BACKUP_FILE == *.sql.gz ]]; then
  gzip -d $BACKUP_FILE | docker exec -i nest_tv_mysql mysql -unest_user -pnest_password nest_tv
elif [[ $BACKUP_FILE == *.rdb.gz ]]; then
  gzip -d $BACKUP_FILE > /tmp/redis_backup.rdb
  docker cp /tmp/redis_backup.rdb nest_tv_redis:/data/dump.rdb
  docker restart nest_tv_redis
  rm /tmp/redis_backup.rdb
fi

# 重启应用服务
docker-compose -f docker-compose.prod.yml start api

echo "Restore completed from: $BACKUP_FILE"
```

---

## 🎉 部署完成！

按照以上步骤，你已经成功将Nest TV项目部署到生产环境。现在你可以：

1. **访问应用**: https://yourdomain.com
2. **监控服务**: 使用Docker命令或Grafana监控面板
3. **管理日志**: 查看结构化日志文件
4. **定期备份**: 设置自动备份脚本
5. **性能优化**: 根据监控数据进行优化

### 后续优化建议

1. **CDN集成**: 使用CloudFlare或AWS CloudFront加速静态资源
2. **负载均衡**: 在多台服务器间分配流量
3. **自动扩容**: 基于CPU/内存使用自动增减容器
4. **安全加固**: WAF防火墙、定期安全扫描
5. **灾备方案**: 跨区域备份、多可用区部署

### 联系和支持

如果遇到问题，请：
1. 查看本文档的故障排除部分
2. 检查Docker和Nginx的官方文档
3. 查看项目的GitHub Issues
4. 联系技术支持

---

**部署愉快！** 🚀