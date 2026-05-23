#!/bin/bash
# =============================================================================
# commit.sh — Mikrotik Monitor
# Descrição: Sincroniza o repositório GitHub com as alterações locais.
#            Padrão dos projetos Sítio Pé de Serra.
# Uso: ./commit.sh "mensagem do commit"
# =============================================================================
MSG="${1:-update}"
git add .
git stash
git pull --rebase --autostash origin master
git stash pop 2>/dev/null || true
git add .
git commit -m "$MSG" 2>/dev/null || echo "Nada para commitar."
git push origin master
