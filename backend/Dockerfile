# =============================================================================
# Mikrotik Monitor — backend/Dockerfile
# Imagem: Node.js 20 Alpine, multistage, ARM64 compatível
# =============================================================================

# --- Stage 1: dependências de produção ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN  npm install --omit=dev

# --- Stage 2: build (não há transpile neste projeto, mas deixamos o stage
#     para facilitar adição futura de TypeScript)
FROM node:20-alpine AS runner
WORKDIR /app

# Instala dependências do sistema para o módulo better-sqlite3 (compilação nativa)
RUN apk add --no-cache python3 make g++

# Copia node_modules já instalados
COPY --from=deps /app/node_modules ./node_modules

# Copia código-fonte
COPY . .

# Cria diretório de dados (será sobrescrito pelo volume)
RUN mkdir -p /app/data

EXPOSE 3001

# Usuário não-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

CMD ["node", "src/server.js"]
