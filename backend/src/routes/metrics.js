// =============================================================================
// Mikrotik Monitor — backend/src/routes/metrics.js
// Aplicação: Mikrotik Monitor
// Descrição: Rotas da API REST para métricas do sistema do Mikrotik.
//
// Endpoints:
//   GET /api/metrics/latest   → último snapshot (para os cards do dashboard)
//   GET /api/metrics/history  → histórico para gráficos (query: ?range=24h|7d|30d)
// =============================================================================

const express = require("express");
const { getDb } = require("../models/db");
const router = express.Router();

// ---------------------------------------------------------------------------
// GET /api/metrics/latest
// Retorna o snapshot mais recente das métricas do sistema
// ---------------------------------------------------------------------------
router.get("/latest", (_req, res) => {
  try {
    const db = getDb();
    const row = db.prepare(`
      SELECT ts, cpu_pct, mem_total, mem_used, uptime_secs, temp_c, voltage_v
      FROM system_metrics
      ORDER BY ts DESC
      LIMIT 1
    `).get();

    if (!row) {
      return res.json({ data: null, message: "Nenhuma coleta realizada ainda." });
    }

    // Calcula percentual de memória usada
    const memPct = row.mem_total > 0
      ? Math.round((row.mem_used / row.mem_total) * 100)
      : null;

    res.json({
      data: {
        ts:           row.ts,
        cpu_pct:      row.cpu_pct,
        mem_total_kb: row.mem_total,
        mem_used_kb:  row.mem_used,
        mem_pct:      memPct,
        uptime_secs:  row.uptime_secs,
        uptime_human: formatUptime(row.uptime_secs),
        temp_c:       row.temp_c,
        voltage_v:    row.voltage_v,
      }
    });
  } catch (err) {
    console.error("[metrics/latest]", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/metrics/history?range=24h|7d|30d
// Retorna série temporal de métricas para gráficos
// ---------------------------------------------------------------------------
router.get("/history", (req, res) => {
  try {
    const range = req.query.range || "24h";
    const seconds = rangeToSeconds(range);
    const since = Math.floor(Date.now() / 1000) - seconds;
    const db = getDb();

    const rows = db.prepare(`
      SELECT ts, cpu_pct, mem_used, mem_total, temp_c, voltage_v
      FROM system_metrics
      WHERE ts >= ?
      ORDER BY ts ASC
    `).all(since);

    const data = rows.map((r) => ({
      ts:       r.ts,
      cpu_pct:  r.cpu_pct,
      mem_pct:  r.mem_total > 0 ? Math.round((r.mem_used / r.mem_total) * 100) : null,
      temp_c:   r.temp_c,
      voltage_v: r.voltage_v,
    }));

    res.json({ range, count: data.length, data });
  } catch (err) {
    console.error("[metrics/history]", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function rangeToSeconds(range) {
  const map = { "24h": 86400, "7d": 604800, "30d": 2592000 };
  return map[range] || 86400;
}

function formatUptime(secs) {
  if (secs === null) return "—";
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(" ");
}

module.exports = router;
