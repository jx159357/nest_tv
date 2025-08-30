#!/bin/bash

# =============================================================================
# Nest TV Docker 自动部署脚本
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
PROJECT_NAME="nest_tv"
BACKEND_IMAGE="$PROJECT_NAME-backend"
FRONTEND_IMAGE="$PROJECT_NAME-frontend"

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}  🐳 Nest TV Docker 自动部署脚本${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# 检查Docker和Docker Compose
check_docker() {
    echo -e "${YELLOW}🔍 检查Docker安装...${NC}"
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker未安装，请先安装Docker${NC}"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose未安装，请先安装Docker Compose${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Docker和Docker Compose已安装${NC}"
    echo ""
}

# 清理旧容器和镜像
cleanup_old() {
    echo -e "${YELLOW}🧹 清理旧的容器和镜像...${NC}"
    
    # 停止并删除旧容器
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # 删除旧镜像（保留latest标签的）
    images_to_remove=$(docker images | grep "$PROJECT_NAME" | grep -v "latest" | awk '{print $3}' || true)
    if [ ! -z "$images_to_remove" ]; then
        echo -e "${YELLOW}发现旧镜像，正在删除...${NC}"
        echo "$images_to_remove" | xargs -r docker rmi 2>/dev/null || true
    fi
    
    # 清理未使用的Docker资源
    docker system prune -f 2>/dev/null || true
    
    echo -e "${GREEN}✅ 清理完成${NC}"
    echo ""
}

# 构建镜像
build_images() {
    echo -e "${YELLOW}🏗️  构建Docker镜像...${NC}"
    
    # 构建后端镜像
    echo -e "${BLUE}📦 构建后端镜像...${NC}"
    docker build -t "$BACKEND_IMAGE:latest" ./backend
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 后端镜像构建失败${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ 后端镜像构建完成${NC}"
    
    # 构建前端镜像
    echo -e "${BLUE}📱 构建前端镜像...${NC}"
    docker build -t "$FRONTEND_IMAGE:latest" ./frontend
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 前端镜像构建失败${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ 前端镜像构建完成${NC}"
    echo ""
}

# 启动服务
start_services() {
    echo -e "${YELLOW}🚀 启动服务...${NC}"
    
    # 启动所有服务
    docker-compose up -d
    
    # 等待服务启动
    echo -e "${BLUE}⏳ 等待服务启动...${NC}"
    sleep 10
    
    # 检查服务状态
    echo -e "${BLUE}🔍 检查服务状态...${NC}"
    
    # 检查API服务
    if docker-compose ps -q api | grep -q "running"; then
        echo -e "${GREEN}✅ API服务运行正常${NC}"
    else
        echo -e "${RED}❌ API服务启动失败${NC}"
        echo -e "${YELLOW}查看日志: docker-compose logs api${NC}"
        exit 1
    fi
    
    # 检查前端服务
    if docker-compose ps -q frontend | grep -q "running"; then
        echo -e "${GREEN}✅ 前端服务运行正常${NC}"
    else
        echo -e "${RED}❌ 前端服务启动失败${NC}"
        echo -e "${YELLOW}查看日志: docker-compose logs frontend${NC}"
        exit 1
    fi
    
    # 检查MySQL服务
    if docker-compose ps -q mysql | grep -q "running"; then
        echo -e "${GREEN}✅ MySQL服务运行正常${NC}"
    else
        echo -e "${RED}❌ MySQL服务启动失败${NC}"
        echo -e "${YELLOW}查看日志: docker-compose logs mysql${NC}"
        exit 1
    fi
    
    # 检查Redis服务
    if docker-compose ps -q redis | grep -q "running"; then
        echo -e "${GREEN}✅ Redis服务运行正常${NC}"
    else
        echo -e "${RED}❌ Redis服务启动失败${NC}"
        echo -e "${YELLOW}查看日志: docker-compose logs redis${NC}"
        exit 1
    fi
    
    echo ""
}

# 健康检查
health_check() {
    echo -e "${YELLOW}🏥 健康检查...${NC}"
    
    # 等待服务完全就绪
    echo -e "${BLUE}⏳ 等待服务就绪...${NC}"
    sleep 20
    
    # 检查API健康状态
    api_health=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3335/health || echo "000")
    if [ "$api_health" = "200" ]; then
        echo -e "${GREEN}✅ API健康检查通过${NC}"
    else
        echo -e "${RED}❌ API健康检查失败 (HTTP $api_health)${NC}"
        echo -e "${YELLOW}查看日志: docker-compose logs api${NC}"
        return 1
    fi
    
    # 检查前端健康状态
    frontend_health=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health || echo "000")
    if [ "$frontend_health" = "200" ]; then
        echo -e "${GREEN}✅ 前端健康检查通过${NC}"
    else
        echo -e "${YELLOW}⚠️ 前端健康检查异常 (HTTP $frontend_health)${NC}"
        echo -e "${YELLOW}这通常是正常的，因为前端可能需要更多时间加载${NC}"
    fi
    
    # 检查MySQL连接
    if docker-compose exec -T mysql mysqladmin ping -h localhost -unest_user -pnest_password &> /dev/null; then
        echo -e "${GREEN}✅ MySQL连接正常${NC}"
    else
        echo -e "${RED}❌ MySQL连接失败${NC}"
        return 1
    fi
    
    # 检查Redis连接
    if docker-compose exec -T redis redis-cli ping | grep -q "PONG"; then
        echo -e "${GREEN}✅ Redis连接正常${NC}"
    else
        echo -e "${RED}❌ Redis连接失败${NC}"
        return 1
    fi
    
    echo ""
}

# 显示服务信息
show_info() {
    echo -e "${BLUE}============================================================================${NC}"
    echo -e "${BLUE}  🎉 部署完成！${NC}"
    echo -e "${BLUE}============================================================================${NC}"
    echo ""
    echo -e "${GREEN}📱 访问地址:${NC}"
    echo -e "   前端应用: ${GREEN}http://localhost:3000${NC}"
    echo -e "   后端API:  ${GREEN}http://localhost:3335${NC}"
    echo -e "   API文档:  ${GREEN}http://localhost:3335/api${NC}"
    echo ""
    echo -e "${YELLOW}🔧 管理命令:${NC}"
    echo -e "   查看状态: ${YELLOW}docker-compose ps${NC}"
    echo -e "   查看日志: ${YELLOW}docker-compose logs <service>${NC}"
    echo -e "   重启服务: ${YELLOW}docker-compose restart <service>${NC}"
    echo -e "   停止服务: ${YELLOW}docker-compose down${NC}"
    echo -e "   删除容器: ${YELLOW}docker-compose down -v${NC}"
    echo ""
    echo -e "${BLUE}📊 监控命令:${NC}"
    echo -e "   实时日志: ${YELLOW}docker-compose logs -f <service>${NC}"
    echo -e "   资源使用: ${YELLOW}docker stats${NC}"
    echo -e "   容器详情: ${YELLOW}docker inspect <container>${NC}"
    echo ""
    echo -e "${BLUE}🗄 数据库管理:${NC}"
    echo -e "   进入MySQL: ${YELLOW}docker-compose exec mysql mysql -unest_user -pnest_password${NC}"
    echo -e "   数据库备份: ${YELLOW}docker-compose exec mysql mysqldump -unest_user -pnest_password nest_tv > backup.sql${NC}"
    echo ""
    echo -e "${BLUE}📦 Redis管理:${NC}"
    echo -e "   进入Redis: ${YELLOW}docker-compose exec redis redis-cli${NC}"
    echo -e "   Redis备份: ${YELLOW}docker-compose exec redis redis-cli SAVE${NC}"
    echo ""
    
    # 显示容器状态
    echo -e "${YELLOW}📋 容器状态:${NC}"
    docker-compose ps
    echo ""
}

# 主执行流程
main() {
    echo -e "${GREEN}🚀 开始部署 Nest TV 应用...${NC}"
    echo ""
    
    check_docker
    cleanup_old
    build_images
    start_services
    health_check
    show_info
    
    echo -e "${GREEN}🎊 所有服务已成功启动！${NC}"
    echo -e "${BLUE}应用现在可以在 http://localhost:3000 访问${NC}"
    echo ""
}

# 错误处理
error_handler() {
    echo -e "${RED}❌ 部署过程中发生错误${NC}"
    echo -e "${YELLOW}请检查错误信息并重试${NC}"
    echo -e "${BLUE}如需帮助，请查看部署文档${NC}"
    exit 1
}

# 设置错误捕获
trap error_handler ERR

# 执行主函数
main

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}  部署脚本执行完成${NC}"
echo -e "${BLUE}============================================================================${NC}"