# =============================================================================
# Mikrotik Monitor — frontend/Dockerfile
# Multistage: Node.js para build Vite → Nginx Alpine para servir
# ARM64 compatível
# =============================================================================

# --- Stage 1: Build Vite ---
FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# --- Stage 2: Nginx para servir o build ---
FROM nginx:alpine AS runner

# Remove config padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia nossa config (proxy reverso para o backend)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia arquivos estáticos do build
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
