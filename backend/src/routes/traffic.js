// =============================================================================
// Mikrotik Monitor — backend/src/routes/traffic.js
// Aplicação: Mikrotik Monitor
// Descrição: Rotas da API REST para série histórica de tráfego por interface.
//            Utilizado pelos gráficos estilo MRTG do frontend.
//
// Endpoints:
//   GET /api/traffic/:ifaceIndex?range=24h|7d|30d
//     → retorna array de { ts, in_bps, out_bps } para gráfico
//   GET /api/traffic/summary?range=24h|7d|30d
//     → retorna resumo de pico IN/OUT para todas as interfaces
// =============================================================================

const express = require("express");
const { getDb } = require("../models/db");
const router = express.Router();

// ---------------------------------------------------------------------------
// GET /api/traffic/summary?range=24h|7d|30d
// Deve vir antes do :ifaceIndex para não colidir
// ---------------------------------------------------------------------------
router.get("/summary", (req, res) => {
  try {
    const range = req.query.range || "24h";
    const since = Math.floor(Date.now() / 1000) - rangeToSeconds(range);
    const db = getDb();

    const rows = db.prepare(`
      SELECT
        ts.iface_index,
        i.name,
        i.type,
        MAX(ts.in_bps)  AS peak_in_bps,
        MAX(ts.out_bps) AS peak_out_bps,
        AVG(ts.in_bps)  AS avg_in_bps,
        AVG(ts.out_bps) AS avg_out_bps
      FROM traffic_samples ts
      JOIN interfaces i ON i.iface_index = ts.iface_index
      WHERE ts.ts >= ? AND ts.in_bps IS NOT NULL
      GROUP BY ts.iface_index
      ORDER BY ts.iface_index
    `).all(since);

    const data = rows.map((r) => ({
      index:          r.iface_index,
      name:           r.name,
      type:           r.type,
      peak_in_mbps:   bpsToMbps(r.peak_in_bps),
      peak_out_mbps:  bpsToMbps(r.peak_out_bps),
      avg_in_mbps:    bpsToMbps(r.avg_in_bps),
      avg_out_mbps:   bpsToMbps(r.avg_out_mbps),
    }));

    res.json({ range, data });
  } catch (err) {
    console.error("[traffic/summary]", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/traffic/:ifaceIndex?range=24h|7d|30d
// Retorna série temporal de tráfego para uma interface específica
// ---------------------------------------------------------------------------
router.get("/:ifaceIndex", (req, res) => {
  try {
    const ifaceIndex = parseInt(req.params.ifaceIndex, 10);
    const range = req.query.range || "24h";
    const seconds = rangeToSeconds(range);
    const since = Math.floor(Date.now() / 1000) - seconds;
    const db = getDb();

    // Para ranges maiores que 24h, agrupamos por bucket de 30min para
    // reduzir volume de dados enviados ao frontend
    const useBucket = seconds > 86400;
    const bucketSecs = seconds > 86400 * 7 ? 3600 : 1800; // 1h para 30d, 30min para 7d

    let rows;
    if (useBucket) {
      rows = db.prepare(`
        SELECT
          (ts / ${bucketSecs}) * ${bucketSecs} AS ts,
          AVG(in_bps)  AS in_bps,
          AVG(out_bps) AS out_bps,
          MAX(in_bps)  AS peak_in_bps,
          MAX(out_bps) AS peak_out_bps
        FROM traffic_samples
        WHERE iface_index = ? AND ts >= ? AND in_bps IS NOT NULL
        GROUP BY (ts / ${bucketSecs})
        ORDER BY ts ASC
      `).all(ifaceIndex, since);
    } else {
      rows = db.prepare(`
        SELECT ts, in_bps, out_bps, in_bps AS peak_in_bps, out_bps AS peak_out_bps
        FROM traffic_samples
        WHERE iface_index = ? AND ts >= ?
        ORDER BY ts ASC
      `).all(ifaceIndex, since);
    }

    // Busca info da interface
    const iface = db.prepare(`
      SELECT name, type, last_status FROM interfaces WHERE iface_index = ?
    `).get(ifaceIndex);

    const data = rows.map((r) => ({
      ts:          r.ts,
      in_mbps:     bpsToMbps(r.in_bps),
      out_mbps:    bpsToMbps(r.out_bps),
      peak_in_mbps:  bpsToMbps(r.peak_in_bps),
      peak_out_mbps: bpsToMbps(r.peak_out_bps),
    }));

    res.json({
      iface_index: ifaceIndex,
      iface_name:  iface?.name  ?? `iface-${ifaceIndex}`,
      iface_type:  iface?.type  ?? "unknown",
      status:      iface?.last_status === 1 ? "up" : "down",
      range,
      bucketed:    useBucket,
      count:       data.length,
      data,
    });
  } catch (err) {
    console.error("[traffic/:ifaceIndex]", err);
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

function bpsToMbps(bps) {
  if (bps == null) return null;
  return +(bps / 1_000_000).toFixed(4);
}

module.exports = router;
