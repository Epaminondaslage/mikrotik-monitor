#!/bin/bash
# =============================================================================
# mikrotik-docker.sh — Mikrotik Monitor
# Descrição: Gerenciamento do container Docker do Mikrotik Monitor.
#            Padrão dos projetos Sítio Pé de Serra.
# Uso: ./mikrotik-docker.sh [start|stop|restart|rebuild|logs|status|update]
# =============================================================================

COMPOSE="docker compose"
DIR="/opt/nodejs/mikrotik-monitor"
NAME="mikrotik-monitor"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

cd "$DIR"

case "${1:-help}" in

  start)
    echo -e "${GREEN}▶ Iniciando ${NAME}...${NC}"
    $COMPOSE up -d
    echo -e "${GREEN}✓ http://10.0.0.5:3040${NC}"
    ;;

  stop)
    echo -e "${YELLOW}■ Parando ${NAME}...${NC}"
    $COMPOSE down
    ;;

  restart)
    echo -e "${YELLOW}↺ Reiniciando ${NAME}...${NC}"
    $COMPOSE down && $COMPOSE up -d
    echo -e "${GREEN}✓ http://10.0.0.5:3040${NC}"
    ;;

  rebuild)
    echo -e "${YELLOW}🔨 Rebuild completo ${NAME}...${NC}"
    $COMPOSE down
    $COMPOSE build --no-cache
    $COMPOSE up -d
    echo -e "${GREEN}✓ http://10.0.0.5:3040${NC}"
    ;;

  logs)
    $COMPOSE logs -f --tail=100
    ;;

  logs-backend)
    $COMPOSE logs -f --tail=100 backend
    ;;

  logs-frontend)
    $COMPOSE logs -f --tail=100 frontend
    ;;

  status)
    echo -e "${GREEN}Containers:${NC}"
    $COMPOSE ps
    echo ""
    echo -e "${GREEN}Healthcheck:${NC}"
    curl -s http://localhost:3040/api/health | python3 -m json.tool 2>/dev/null || echo "Backend não responde"
    ;;

  update)
    echo -e "${YELLOW}🔄 Atualizando ${NAME}...${NC}"
    ./commit.sh "auto: update $(date '+%Y-%m-%d %H:%M')"
    $COMPOSE down
    $COMPOSE build --no-cache
    $COMPOSE up -d
    echo -e "${GREEN}✓ Atualizado em http://10.0.0.5:3040${NC}"
    ;;

  help|*)
    echo ""
    echo "  Uso: $0 [comando]"
    echo ""
    echo "    start         Sobe os containers"
    echo "    stop          Para os containers"
    echo "    restart       Para e sobe sem rebuild"
    echo "    rebuild       Rebuild completo (--no-cache)"
    echo "    logs          Logs de todos os containers"
    echo "    logs-backend  Logs do coletor SNMP"
    echo "    logs-frontend Logs do Nginx"
    echo "    status        Status + healthcheck"
    echo "    update        commit.sh + rebuild + restart"
    echo ""
    ;;
esac
