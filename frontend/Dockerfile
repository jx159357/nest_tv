# 构建阶段
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM nginx:alpine AS production

# 安装必要的工具
RUN apk add --no-cache curl

# 创建nginx配置文件
RUN echo 'server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html index.htm;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        image/svg+xml;

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API代理
    location /api/ {
        proxy_pass http://api:3335;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        proxy_set_header X-NginX-Proxy true;
    }

    # SPA路由支持
    location / {
        try_files $uri $uri/ /index.html =404;
    }

    # 健康检查
    location /health {
        access_log off;
        return 200 "healthy";
        add_header Content-Type text/plain;
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' ws: wss:; frame-ancestors 'none';" always;

    # 隐藏nginx版本
    server_tokens off;
}' > /etc/nginx/conf.d/default.conf

# 从构建阶段复制构建产物
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]