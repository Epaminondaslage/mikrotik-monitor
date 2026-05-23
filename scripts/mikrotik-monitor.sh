#!/bin/bash
# =============================================================================
# Mikrotik Monitor — scripts/mikrotik-monitor.sh
# Aplicação: Mikrotik Monitor
# Descrição: Script de gerenciamento do container Docker.
#            Uso: ./mikrotik-monitor.sh [start|stop|restart|logs|update|status]
# Servidor: 10.0.0.5 em /opt/mikrotik-monitor
# =============================================================================

set -e

COMPOSE="docker compose"
DIR="/opt/nodejs/mikrotik-monitor"
NAME="mikrotik-monitor"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

cd "$DIR"

case "${1:-help}" in

  start)
    echo -e "${GREEN}▶ Iniciando ${NAME}...${NC}"
    mkdir -p data
    $COMPOSE up -d --build
    echo -e "${GREEN}✓ Serviço iniciado em http://10.0.0.5:3040${NC}"
    ;;

  stop)
    echo -e "${YELLOW}■ Parando ${NAME}...${NC}"
    $COMPOSE down
    ;;

  restart)
    echo -e "${YELLOW}↺ Reiniciando ${NAME}...${NC}"
    $COMPOSE down
    $COMPOSE up -d --build
    ;;

  logs)
    echo -e "${GREEN}📋 Logs — pressione Ctrl+C para sair${NC}"
    $COMPOSE logs -f --tail=100
    ;;

  logs-backend)
    $COMPOSE logs -f --tail=100 backend
    ;;

  logs-frontend)
    $COMPOSE logs -f --tail=100 frontend
    ;;

  status)
    echo -e "${GREEN}Status dos containers:${NC}"
    $COMPOSE ps
    echo ""
    echo -e "${GREEN}Último healthcheck:${NC}"
    curl -s http://localhost:3040/api/health | python3 -m json.tool 2>/dev/null || echo "Backend não responde"
    ;;

  update)
    echo -e "${YELLOW}🔄 Atualizando ${NAME}...${NC}"
    git pull origin main
    $COMPOSE down
    $COMPOSE up -d --build
    echo -e "${GREEN}✓ Atualizado e reiniciado${NC}"
    ;;

  shell-backend)
    $COMPOSE exec backend sh
    ;;

  prune-db)
    echo -e "${YELLOW}🗑  Removendo dados antigos do SQLite (> 30 dias)...${NC}"
    # O próprio coletor já faz pruning automático — este comando força uma limpeza manual
    $COMPOSE exec backend node -e "
      const db = require('better-sqlite3')(process.env.DB_PATH);
      const cutoff = Math.floor(Date.now()/1000) - 30*24*3600;
      const r1 = db.prepare('DELETE FROM system_metrics WHERE ts < ?').run(cutoff);
      const r2 = db.prepare('DELETE FROM traffic_samples WHERE ts < ?').run(cutoff);
      console.log('Removidos:', r1.changes + r2.changes, 'registros');
    "
    ;;

  help|*)
    echo ""
    echo "  Uso: $0 [comando]"
    echo ""
    echo "  Comandos disponíveis:"
    echo "    start          Inicia o serviço (build + up)"
    echo "    stop           Para o serviço"
    echo "    restart        Para e reinicia (rebuild)"
    echo "    logs           Logs de todos os containers"
    echo "    logs-backend   Logs apenas do backend"
    echo "    logs-frontend  Logs apenas do frontend/nginx"
    echo "    status         Status dos containers + healthcheck"
    echo "    update         git pull + rebuild + restart"
    echo "    shell-backend  Shell interativo no container backend"
    echo "    prune-db       Remove dados > 30 dias do SQLite"
    echo ""
    ;;
esac
