#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()   { echo -e "${GREEN}[deploy]${NC} $*"; }
warn()  { echo -e "${YELLOW}[deploy]${NC} $*"; }
error() { echo -e "${RED}[deploy]${NC} $*" >&2; }

check_deps() {
    local missing=()
    for cmd in docker docker-compose; do
        if ! command -v "$cmd" &>/dev/null; then
            missing+=("$cmd")
        fi
    done
    if [ ${#missing[@]} -gt 0 ]; then
        error "Missing dependencies: ${missing[*]}"
        exit 1
    fi
}

check_env() {
    local env_file=".env"
    if [ ! -f "$env_file" ]; then
        warn ".env file not found, copying from .env.example..."
        if [ -f ".env.example" ]; then
            cp .env.example "$env_file"
            warn "Please edit .env file with your actual configuration before continuing."
            exit 1
        else
            error "No .env or .env.example file found."
            exit 1
        fi
    fi
}

init_db_password() {
    local env_file=".env"
    if grep -q "CHANGE_ME" "$env_file"; then
        warn "Default passwords detected in .env file."
        warn "Please update all CHANGE_ME_* values before deploying to production."
    fi
}

deploy_dev() {
    log "Starting development environment..."
    docker-compose down --remove-orphans 2>/dev/null || true
    docker-compose build --no-cache
    docker-compose up -d
    log "Development environment started."
    log "Frontend: http://localhost:${FRONTEND_PORT:-80}"
    log "API:      http://localhost:${API_PORT:-3334}"
    log "Swagger:  http://localhost:${API_PORT:-3334}/api"
}

deploy_prod() {
    log "Starting production environment..."
    docker-compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
    docker-compose -f docker-compose.prod.yml build --no-cache
    docker-compose -f docker-compose.prod.yml up -d
    log "Production environment started."
    log "Check service status: docker-compose -f docker-compose.prod.yml ps"
}

stop() {
    log "Stopping all services..."
    docker-compose down --remove-orphans 2>/dev/null || true
    docker-compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
    log "All services stopped."
}

logs() {
    local service="${1:-}"
    if [ -n "$service" ]; then
        docker-compose logs -f "$service"
    else
        docker-compose logs -f
    fi
}

status() {
    echo "=== Development ==="
    docker-compose ps 2>/dev/null || echo "Not running"
    echo ""
    echo "=== Production ==="
    docker-compose -f docker-compose.prod.yml ps 2>/dev/null || echo "Not running"
}

backup_db() {
    local backup_dir="./backups"
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    mkdir -p "$backup_dir"
    log "Backing up database..."
    docker-compose exec -T mysql mysqldump -u root -p"${MYSQL_ROOT_PASSWORD}" "${MYSQL_DATABASE:-nest_tv}" > "$backup_dir/nest_tv_${timestamp}.sql"
    log "Database backup saved to $backup_dir/nest_tv_${timestamp}.sql"
}

usage() {
    cat <<EOF
Usage: $0 <command>

Commands:
  dev       Start development environment
  prod      Start production environment
  stop      Stop all services
  logs      Show logs (optional: logs <service>)
  status    Show service status
  backup    Backup database
  help      Show this help message

Examples:
  $0 dev           # Start dev environment
  $0 prod          # Start production environment
  $0 logs api      # Show API logs
  $0 backup        # Backup database
EOF
}

main() {
    check_deps
    check_env
    init_db_password

    local cmd="${1:-help}"
    case "$cmd" in
        dev)    deploy_dev ;;
        prod)   deploy_prod ;;
        stop)   stop ;;
        logs)   logs "${2:-}" ;;
        status) status ;;
        backup) backup_db ;;
        help|*) usage ;;
    esac
}

main "$@"
