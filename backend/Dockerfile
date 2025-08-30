# 使用官方Node.js 20镜像作为基础镜像
FROM node:20-alpine AS base

# 设置工作目录
WORKDIR /app

# 安装必要的系统依赖
RUN apk add --no-cache python3 make g++

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM node:20-alpine AS production

# 设置工作目录
WORKDIR /app

# 安装必要的系统依赖
RUN apk add --no-cache dumb-init

# 创建非root用户
RUN addgroup -g appuser && adduser -D -G appuser -s /bin/sh -u 1000 appuser

# 设置权限
RUN chown -R appuser:appuser /app
USER appuser

# 复制构建产物和依赖
COPY --from=base --chown=appuser:appuser /app/node_modules ./node_modules
COPY --from=base --chown=appuser:appuser /app/dist ./dist
COPY --from=base --chown=appuser:appuser /app/package.json ./package.json

# 暴露端口
EXPOSE 3335

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); const options = { hostname: 'localhost', port: 3335, path: '/', timeout: 3000 }; const req = http.request(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1)); req.end();"

# 启动应用
CMD ["node", "dist/main.js"]