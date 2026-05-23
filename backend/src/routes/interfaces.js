// =============================================================================
// Mikrotik Monitor — backend/src/routes/interfaces.js
// Aplicação: Mikrotik Monitor
// Descrição: Rotas da API REST para status e tráfego atual das interfaces.
//
// Endpoints:
//   GET /api/interfaces        → lista todas as interfaces com status e Mbps atual
// =============================================================================

const express = require("express");
const { getDb } = require("../models/db");
const router = express.Router();

// ---------------------------------------------------------------------------
// GET /api/interfaces
// Retorna todas as interfaces com status e taxa de tráfego mais recente
// ---------------------------------------------------------------------------
router.get("/", (_req, res) => {
  try {
    const db = getDb();

    // Busca todas as interfaces conhecidas
    const ifaces = db.prepare(`
      SELECT iface_index, name, type, last_status, updated_at
      FROM interfaces
      ORDER BY iface_index ASC
    `).all();

    // Para cada interface, pega a amostra de tráfego mais recente
    const stmtLatestTraffic = db.prepare(`
      SELECT in_bps, out_bps, in_octets, out_octets, ts
      FROM traffic_samples
      WHERE iface_index = ?
      ORDER BY ts DESC
      LIMIT 1
    `);

    const result = ifaces.map((iface) => {
      const traffic = stmtLatestTraffic.get(iface.iface_index);
      return {
        index:        iface.iface_index,
        name:         iface.name,
        type:         iface.type,
        status:       iface.last_status === 1 ? "up" : "down",
        updated_at:   iface.updated_at,
        in_mbps:      traffic?.in_bps  != null ? +(traffic.in_bps  / 1_000_000).toFixed(3) : null,
        out_mbps:     traffic?.out_bps != null ? +(traffic.out_bps / 1_000_000).toFixed(3) : null,
        in_bps:       traffic?.in_bps  ?? null,
        out_bps:      traffic?.out_bps ?? null,
        in_octets:    traffic?.in_octets  ?? null,
        out_octets:   traffic?.out_octets ?? null,
        last_seen_ts: traffic?.ts ?? null,
      };
    });

    res.json({ count: result.length, data: result });
  } catch (err) {
    console.error("[interfaces]", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
