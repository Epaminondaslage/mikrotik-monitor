// =============================================================================
// Mikrotik Monitor — backend/src/server.js
// Aplicação: Mikrotik Monitor
// Descrição: Ponto de entrada do servidor Express. Configura middlewares,
//            rotas da API REST, inicia o coletor SNMP periódico e expõe
//            o endpoint de healthcheck para o Docker.
// Servidor alvo: Mikrotik RB2011UiAS-2HnD em 10.0.0.1
// =============================================================================

const express = require("express");
const cors = require("cors");
const { initDb } = require("./models/db");
const { startCollector } = require("./services/collector");
const metricsRouter = require("./routes/metrics");
const interfacesRouter = require("./routes/interfaces");
const trafficRouter = require("./routes/traffic");

const app = express();
const PORT = process.env.PORT || 3001;

// ---------------------------------------------------------------------------
// Middlewares globais
// ---------------------------------------------------------------------------
app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Rotas da API
// ---------------------------------------------------------------------------

// Healthcheck para Docker
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

// Métricas do sistema (CPU, memória, temperatura, voltagem, uptime)
app.use("/api/metrics", metricsRouter);

// Status e tráfego das interfaces
app.use("/api/interfaces", interfacesRouter);

// Séries históricas de tráfego por interface (gráficos MRTG)
app.use("/api/traffic", trafficRouter);

// ---------------------------------------------------------------------------
// Inicialização
// ---------------------------------------------------------------------------
(async () => {
  // 1. Inicializa banco SQLite (cria tabelas se necessário)
  await initDb();
  console.log("[server] Banco SQLite inicializado.");

  // 2. Inicia o coletor SNMP periódico
  startCollector();
  console.log("[server] Coletor SNMP iniciado.");

  // 3. Sobe o servidor HTTP
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[server] API rodando em http://0.0.0.0:${PORT}`);
  });
})();
