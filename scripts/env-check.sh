#!/bin/bash

# =============================================================================
# Nest TV 环境配置检查脚本
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置检查结果
CHECKS=()
FAILED_CHECKS=()
WARNINGS=()

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}  🔍 Nest TV 环境配置检查${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# 检查Node.js版本
check_node_version() {
    echo -e "${YELLOW}📦 检查 Node.js 版本...${NC}"
    
    if ! command -v node &> /dev/null; then
        CHECKS+=("❌ Node.js 未安装")
        FAILED_CHECKS+=("node")
        return 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1,2)
    REQUIRED_VERSION="20.0"
    
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
        VERSION_PARTS=(${NODE_VERSION//./ })
        MAJOR=${VERSION_PARTS[0]}
        MINOR=${VERSION_PARTS[1]}
        
        if [ "$MAJOR" -gt 20 ] || ([ "$MAJOR" -eq 20 ] && [ "$MINOR" -ge 0 ]); then
            CHECKS+=("✅ Node.js 版本 $(node --version) (满足要求 ≥ $REQUIRED_VERSION)")
            return 0
        fi
    fi
    
    CHECKS+=("❌ Node.js 版本 $(node --version) (不满足要求 ≥ $REQUIRED_VERSION)")
    FAILED_CHECKS+=("node_version")
    return 1
}

# 检查npm版本
check_npm_version() {
    echo -e "${YELLOW}📦 检查 npm 版本...${NC}"
    
    if ! command -v npm &> /dev/null; then
        CHECKS+=("❌ npm 未安装")
        FAILED_CHECKS+=("npm")
        return 1
    fi
    
    NPM_VERSION=$(npm --version | cut -d'.' -f1)
    REQUIRED_VERSION="8"
    
    if [ "$NPM_VERSION" -ge "$REQUIRED_VERSION" ]; then
        CHECKS+=("✅ npm 版本 $(npm --version) (满足要求 ≥ $REQUIRED_VERSION)")
        return 0
    fi
    
    CHECKS+=("❌ npm 版本 $(npm --version) (不满足要求 ≥ $REQUIRED_VERSION)")
    FAILED_CHECKS+=("npm_version")
    return 1
}

# 检查Git版本
check_git_version() {
    echo -e "${YELLOW}📦 检查 Git 版本...${NC}"
    
    if ! command -v git &> /dev/null; then
        WARNINGS+=("⚠️ Git 未安装（可选，但推荐）")
        return 0
    fi
    
    GIT_VERSION=$(git --version | awk '{print $3}' | cut -d'.' -f1,2)
    REQUIRED_VERSION="2.30"
    
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$GIT_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
        CHECKS+=("✅ Git 版本 $(git --version | awk '{print $3}') (满足要求 ≥ $REQUIRED_VERSION)")
        return 0
    fi
    
    WARNINGS+=("⚠️ Git 版本 $(git --version | awk '{print $3}') (不满足要求 ≥ $REQUIRED_VERSION)")
    return 1
}

# 检查Docker版本
check_docker_version() {
    echo -e "${YELLOW}🐳 检查 Docker 版本...${NC}"
    
    if ! command -v docker &> /dev/null; then
        WARNINGS+=("⚠️ Docker 未安装（可选，推荐用于生产部署）")
        return 0
    fi
    
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//' | cut -d'.' -f1,2)
    REQUIRED_VERSION="20.10"
    
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$DOCKER_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
        CHECKS+=("✅ Docker 版本 $(docker --version | awk '{print $3}' | sed 's/,//') (满足要求 ≥ $REQUIRED_VERSION)")
        return 0
    fi
    
    WARNINGS+=("⚠️ Docker 版本 $(docker --version | awk '{print $3}' | sed 's/,//') (不满足要求 ≥ $REQUIRED_VERSION)")
    return 1
}

# 检查Docker Compose版本
check_docker_compose_version() {
    echo -e "${YELLOW}🐳 检查 Docker Compose 版本...${NC}"
    
    if ! command -v docker-compose &> /dev/null; then
        WARNINGS+=("⚠️ Docker Compose 未安装（可选，推荐用于生产部署）")
        return 0
    fi
    
    COMPOSE_VERSION=$(docker-compose --version | awk '{print $3}' | sed 's/,//' | cut -d'.' -f1,2)
    REQUIRED_VERSION="2.20"
    
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$COMPOSE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
        CHECKS+=("✅ Docker Compose 版本 $(docker-compose --version | awk '{print $3}' | sed 's/,//') (满足要求 ≥ $REQUIRED_VERSION)")
        return 0
    fi
    
    WARNINGS+=("⚠️ Docker Compose 版本 $(docker-compose --version | awk '{print $3}' | sed 's/,//') (不满足要求 ≥ $REQUIRED_VERSION)")
    return 1
}

# 检查项目文件结构
check_project_structure() {
    echo -e "${YELLOW}📁 检查项目文件结构...${NC}"
    
    local required_files=(
        "backend/package.json"
        "backend/src/main.ts"
        "backend/src/app.module.ts"
        "backend/.env"
        "frontend/package.json"
        "frontend/src/main.ts"
        "frontend/src/App.vue"
        "frontend/src/router/index.ts"
        "docker-compose.yml"
        ".env.production"
        ".dockerignore"
    )
    
    local optional_files=(
        "backend/database/init/01-init-schema.sql"
        "frontend/uno.config.ts"
        "Dockerfile"
        "frontend/Dockerfile"
        "docs/docker-deployment-guide.md"
        "scripts/deploy.sh"
    )
    
    local missing_files=()
    local missing_optional_files=()
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            missing_files+=("$file")
        fi
    done
    
    for file in "${optional_files[@]}"; do
        if [ ! -f "$file" ]; then
            missing_optional_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -eq 0 ]; then
        CHECKS+=("✅ 所有必要文件都已存在")
    else
        FAILED_CHECKS+=("project_structure")
        CHECKS+=("❌ 缺少必要文件: ${missing_files[*]}")
    fi
    
    if [ ${#missing_optional_files[@]} -eq 0 ]; then
        CHECKS+=("✅ 所有可能文件都已存在")
    else
        WARNINGS+=("⚠️ 缺少可选文件: ${missing_optional_files[*]}")
    fi
}

# 检查环境变量文件
check_env_files() {
    echo -e "${YELLOW}🔧 检查环境变量文件...${NC}"
    
    local env_files=(
        "backend/.env"
        ".env.production"
    )
    
    for env_file in "${env_files[@]}"; do
        if [ -f "$env_file" ]; then
            CHECKS+=("✅ 环境变量文件 $env_file 存在")
            
            # 检查关键环境变量
            local critical_vars=()
            case "$env_file" in
                "backend/.env")
                    critical_vars=("NODE_ENV" "PORT" "DB_HOST" "DB_PORT" "DB_USERNAME" "DB_PASSWORD" "DB_DATABASE" "REDIS_HOST" "REDIS_PORT" "JWT_SECRET" "JWT_EXPIRES_IN")
                    ;;
                ".env.production")
                    critical_vars=("NODE_ENV" "PORT" "DB_HOST" "DB_PORT" "DB_USERNAME" "DB_PASSWORD" "DB_DATABASE" "REDIS_HOST" "REDIS_PORT" "JWT_SECRET" "JWT_EXPIRES_IN")
                    ;;
            esac
            
            local missing_vars=()
            for var in "${critical_vars[@]}"; do
                if ! grep -q "^$var=" "$env_file" 2>/dev/null; then
                    missing_vars+=("$var")
                fi
            done
            
            if [ ${#missing_vars[@]} -eq 0 ]; then
                CHECKS+=("  ✅ 所有关键环境变量已设置")
            else
                WARNINGS+=("  ⚠️ 缺少关键环境变量: ${missing_vars[*]}")
            fi
        else
            CHECKS+=("❌ 环境变量文件 $env_file 不存在")
            FAILED_CHECKS+=("$env_file")
        fi
    done
}

# 检查包依赖
check_dependencies() {
    echo -e "${YELLOW}📦 检查项目依赖...${NC}"
    
    # 检查后端依赖
    if [ -f "backend/package.json" ]; then
        echo -e "${BLUE}  🔍 检查后端依赖...${NC}"
        
        cd backend
        
        local core_deps=(
            "@nestjs/core"
            "@nestjs/common"
            "@nestjs/config"
            "@nestjs/typeorm"
            "typeorm"
            "mysql2"
            "@nestjs/jwt"
            "@nestjs/passport"
            "@nestjs/passport-jwt"
            "@nestjs/passport-local"
            "class-validator"
            "class-transformer"
        )
        
        local missing_deps=()
        
        for dep in "${core_deps[@]}"; do
            if ! npm list --depth=0 2>/dev/null | grep -q "$dep"; then
                missing_deps+=("$dep")
            fi
        done
        
        if [ ${#missing_deps[@]} -eq 0 ]; then
            CHECKS+=("  ✅ 后端核心依赖都已安装")
        else
            FAILED_CHECKS+=("backend_dependencies")
            CHECKS+=("  ❌ 缺少后端核心依赖: ${missing_deps[*]}")
            echo -e "${YELLOW}  🔄 建议运行: cd backend && npm install${NC}"
        fi
        
        cd ..
    fi
    
    # 检查前端依赖
    if [ -f "frontend/package.json" ]; then
        echo -e "${BLUE}  🔍 检查前端依赖...${NC}"
        
        cd frontend
        
        local core_deps=(
            "vue"
            "vue-router"
            "pinia"
            "axios"
            "vite"
            "@vitejs/plugin-vue"
            "unocss"
            "@unocss/preset-uno"
            "@unocss/preset-attributify"
            "@unocss/preset-icons"
        )
        
        local missing_deps=()
        
        for dep in "${core_deps[@]}"; do
            if ! npm list --depth=0 2>/dev/null | grep -q "$dep"; then
                missing_deps+=("$dep")
            fi
        done
        
        if [ ${#missing_deps[@]} -eq 0 ]; then
            CHECKS+=("  ✅ 前端核心依赖都已安装")
        else
            FAILED_CHECKS+=("frontend_dependencies")
            CHECKS+=("  ❌ 缺少前端核心依赖: ${missing_deps[*]}")
            echo -e "${YELLOW}  🔄 建议运行: cd frontend && npm install${NC}"
        fi
        
        cd ..
    fi
}

# 检查端口占用
check_ports() {
    echo -e "${YELLOW}🔌 检查端口占用...${NC}"
    
    local ports=(3335 5173 3000 3307 6380)
    local used_ports=()
    
    for port in "${ports[@]}"; do
        if command -v netstat &> /dev/null; then
            if netstat -tuln 2>/dev/null | grep -q ":$port "; then
                used_ports+=("$port")
            fi
        elif command -v ss &> /dev/null; then
            if ss -tuln 2>/dev/null | grep -q ":$port "; then
                used_ports+=("$port")
            fi
        else
            if nc -z localhost "$port" 2>/dev/null; then
                : # Port is free
            else
                used_ports+=("$port")
            fi
        fi
    done
    
    if [ ${#used_ports[@]} -eq 0 ]; then
        CHECKS+=("✅ 所有必要端口都可用")
    else
        WARNINGS+=("⚠️ 以下端口已被占用: ${used_ports[*]}")
        echo -e "${YELLOW}  💡 这可能导致服务启动失败，请检查并关闭占用端口的进程${NC}"
    fi
}

# 检查数据库连接（如果可能）
check_database_connection() {
    echo -e "${YELLOW}🗄️ 检查数据库连接...${NC}"
    
    if [ -f "backend/.env" ]; then
        cd backend
        
        # 尝试从.env文件读取数据库配置
        local db_host=$(grep "DB_HOST" .env | cut -d'=' -f2 | tr -d "' ")
        local db_port=$(grep "DB_PORT" .env | cut -d'=' -f2 | tr -d "' ")
        local db_user=$(grep "DB_USERNAME" .env | cut -d'=' -f2 | tr -d "' ")
        local db_pass=$(grep "DB_PASSWORD" .env | cut -d'=' -f2 | tr -d "' ")
        local db_name=$(grep "DB_DATABASE" .env | cut -d'=' -f2 | tr -d "' ")
        
        if [ -n "$db_host" ] && [ -n "$db_user" ] && [ -n "$db_name" ]; then
            echo -e "${BLUE}  🔍 尝试连接数据库...${NC}"
            
            if command -v mysql &> /dev/null; then
                if mysql -h"$db_host" -P"${db_port:-3306}" -u"$db_user" -p"$db_pass" -e "SELECT 1;" 2>/dev/null; then
                    CHECKS+=("  ✅ 数据库连接成功")
                else
                    WARNINGS+=("  ⚠️ 数据库连接失败，请检查数据库服务是否运行")
                    echo -e "${YELLOW}  💡 请确保MySQL服务已启动并配置正确${NC}"
                fi
            else
                echo -e "${YELLOW}  💡 mysql客户端未安装，跳过数据库连接检查${NC}"
            fi
        else
            WARNINGS+=("  ⚠️ 无法从 .env 文件读取数据库配置")
        fi
        
        cd ..
    else
        WARNINGS+=("  ⚠️ 后端 .env 文件不存在，跳过数据库连接检查")
    fi
}

# 检查Redis连接（如果可能）
check_redis_connection() {
    echo -e "${YELLOW}🔴 检查Redis连接...${NC}"
    
    if [ -f "backend/.env" ]; then
        cd backend
        
        # 尝试从.env文件读取Redis配置
        local redis_host=$(grep "REDIS_HOST" .env | cut -d'=' -f2 | tr -d "' ")
        local redis_port=$(grep "REDIS_PORT" .env | cut -d'=' -f2 | tr -d "' ")
        
        if [ -n "$redis_host" ]; then
            echo -e "${BLUE}  🔍 尝试连接Redis...${NC}"
            
            if command -v redis-cli &> /dev/null; then
                if redis-cli -h"$redis_host" -p"${redis_port:-6379}" ping 2>/dev/null | grep -q "PONG"; then
                    CHECKS+=("  ✅ Redis连接成功")
                else
                    WARNINGS+=("  ⚠️ Redis连接失败，请检查Redis服务是否运行")
                    echo -e "${YELLOW}  💡 请确保Redis服务已启动并配置正确${NC}"
                fi
            else
                echo -e "${YELLOW}  💡 redis-cli客户端未安装，跳过Redis连接检查${NC}"
            fi
        else
            WARNINGS+=("  ⚠️ 无法从 .env 文件读取Redis配置")
        fi
        
        cd ..
    else
        WARNINGS+=("  ⚠️ 后端 .env 文件不存在，跳过Redis连接检查")
    fi
}

# 主检查函数
main() {
    echo -e "${GREEN}🚀 开始环境配置检查...${NC}"
    echo ""
    
    # 基础环境检查
    check_node_version
    echo ""
    
    check_npm_version
    echo ""
    
    check_git_version
    echo ""
    
    check_docker_version
    echo ""
    
    check_docker_compose_version
    echo ""
    
    # 项目结构检查
    check_project_structure
    echo ""
    
    # 环境配置检查
    check_env_files
    echo ""
    
    # 依赖检查
    check_dependencies
    echo ""
    
    # 端口检查
    check_ports
    echo ""
    
    # 数据库检查
    check_database_connection
    echo ""
    
    # Redis检查
    check_redis_connection
    echo ""
}

# 显示结果
show_results() {
    echo -e "${BLUE}============================================================================${NC}"
    echo -e "${BLUE}  📋 检查结果汇总${NC}"
    echo -e "${BLUE}============================================================================${NC}"
    echo ""
    
    # 显示所有检查结果
    for result in "${CHECKS[@]}"; do
        echo -e "$result"
    done
    
    # 显示警告
    if [ ${#WARNINGS[@]} -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}⚠️ 警告 (${#WARNINGS[@]}):${NC}"
        for warning in "${WARNINGS[@]}"; do
            echo -e "  $warning"
        done
        echo ""
    fi
    
    # 显示失败项
    if [ ${#FAILED_CHECKS[@]} -gt 0 ]; then
        echo ""
        echo -e "${RED}❌ 失败项 (${#FAILED_CHECKS[@]}):${NC}"
        echo -e "${RED}  检测到以下问题需要修复:${NC}"
        for failed in "${FAILED_CHECKS[@]}"; do
            case $failed in
                "node")
                    echo -e "  ${RED}请升级Node.js到20.0或更高版本${NC}"
                    echo -e "  ${YELLOW}建议: nvm install 20 && nvm use 20${NC}"
                    ;;
                "npm")
                    echo -e "  ${RED}请升级npm到8.0或更高版本${NC}"
                    echo -e "  ${YELLOW}建议: npm install -g npm@latest${NC}"
                    ;;
                "project_structure")
                    echo -e "  ${RED}请检查项目文件完整性${NC}"
                    echo -e "  ${YELLOW}建议: 重新克隆项目或检查文件是否存在${NC}"
                    ;;
                "backend_dependencies")
                    echo -e "  ${RED}请安装后端依赖${NC}"
                    echo -e "  ${YELLOW}建议: cd backend && npm install${NC}"
                    ;;
                "frontend_dependencies")
                    echo -e "  ${RED}请安装前端依赖${NC}"
                    echo -e "  ${YELLOW}建议: cd frontend && npm install${NC}"
                    ;;
                *)
                    echo -e "  ${RED}请检查 $failed 相关配置${NC}"
                    ;;
            esac
        done
        echo ""
        echo -e "${RED}修复失败项后，请重新运行此检查脚本${NC}"
        return 1
    fi
    
    # 成功信息
    echo ""
    echo -e "${GREEN}🎉 所有检查都通过了！${NC}"
    echo ""
    echo -e "${GREEN}环境配置检查完成，项目可以正常启动！${NC}"
    echo ""
    echo -e "${BLUE}📚 启动说明:${NC}"
    echo -e "${GREEN}  开发环境启动:${NC}"
    echo -e "   后端: cd backend && npm run start:dev"
    echo -e "   前端: cd frontend && npm run dev"
    echo ""
    echo -e "${GREEN}  Docker启动:${NC}"
    echo -e "   一键启动: docker-compose up -d"
    echo ""
    echo -e "${BLUE}📚 访问地址:${NC}"
    echo -e "   前端: http://localhost:5173"
    echo -e "   后端: http://localhost:3335"
    echo -e "   API文档: http://localhost:3335/api"
    echo ""
    
    return 0
}

# 错误处理
error_handler() {
    echo -e "${RED}❌ 检查过程中发生错误${NC}"
    echo -e "${YELLOW}请检查脚本权限和网络连接${NC}"
    exit 1
}

# 设置错误捕获
trap error_handler ERR

# 执行主流程
main

# 显示结果
show_results