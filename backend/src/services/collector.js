// =============================================================================
// Mikrotik Monitor — backend/src/services/collector.js
// Aplicação: Mikrotik Monitor
// Descrição: Serviço de coleta periódica via SNMP v2c.
//            Consulta o Mikrotik RB2011UiAS-2HnD a cada COLLECT_INTERVAL_MS
//            (padrão: 5 minutos) e persiste os dados no SQLite.
//
// OIDs coletados:
//   Sistema:
//     CPU      → .1.3.6.1.2.1.25.3.3.1.2.1
//     Mem total→ .1.3.6.1.2.1.25.2.2.0
//     Uptime   → .1.3.6.1.2.1.1.3.0 (TimeTicks, 1/100 de segundo)
//     Temp     → .1.3.6.1.4.1.14988.1.1.3.100.1.3.14 (×10 = °C real)
//     Voltagem → .1.3.6.1.4.1.14988.1.1.3.100.1.3.13 (×10 = V real)
//   Por interface (índices 1–15):
//     In octets  → .1.3.6.1.2.1.2.2.1.10.{index}
//     Out octets → .1.3.6.1.2.1.2.2.1.16.{index}
//     Status     → .1.3.6.1.2.1.2.2.1.8.{index}
//   Memória livre:
//     hrStorageUsed do storage index 1 → .1.3.6.1.2.1.25.2.3.1.6.1
// =============================================================================

const snmp = require("net-snmp");
const { getDb } = require("../models/db");

// ---------------------------------------------------------------------------
// Configurações lidas do ambiente
// ---------------------------------------------------------------------------
const MIKROTIK_HOST      = process.env.MIKROTIK_HOST      || "10.0.0.1";
const SNMP_COMMUNITY     = process.env.SNMP_COMMUNITY     || "public";
const COLLECT_INTERVAL   = parseInt(process.env.COLLECT_INTERVAL_MS || "300000", 10);
const INTERFACE_INDEXES  = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];

// ---------------------------------------------------------------------------
// OIDs base do sistema
// ---------------------------------------------------------------------------
const OID_CPU       = "1.3.6.1.2.1.25.3.3.1.2.1";
const OID_MEM_TOTAL = "1.3.6.1.2.1.25.2.3.1.5.65536";
const OID_MEM_USED  = "1.3.6.1.2.1.25.2.3.1.6.65536"; // Mikrotik free memory
const OID_UPTIME    = "1.3.6.1.2.1.1.3.0";
const OID_TEMP      = "1.3.6.1.4.1.14988.1.1.3.100.1.3.14";
const OID_VOLTAGE   = "1.3.6.1.4.1.14988.1.1.3.100.1.3.13";

// OIDs de interfaces (por índice)
const OID_IF_IN    = (i) => `1.3.6.1.2.1.2.2.1.10.${i}`;
const OID_IF_OUT   = (i) => `1.3.6.1.2.1.2.2.1.16.${i}`;
const OID_IF_STAT  = (i) => `1.3.6.1.2.1.2.2.1.8.${i}`;

// Cache da coleta anterior para calcular delta de octets
let previousTrafficSnapshot = {};   // { [ifaceIndex]: { ts, in_octets, out_octets } }

// ---------------------------------------------------------------------------
// Utilitário: realiza GET SNMP para uma lista de OIDs
// Retorna Promise<Map<oid, valor>>
// ---------------------------------------------------------------------------
function snmpGet(oids) {
  return new Promise((resolve, reject) => {
    const session = snmp.createSession(MIKROTIK_HOST, SNMP_COMMUNITY, {
      version: snmp.Version2c,
      timeout: 5000,
      retries: 2,
    });

    session.get(oids, (error, varbinds) => {
      session.close();
      if (error) return reject(error);

      const result = new Map();
      for (const vb of varbinds) {
        if (snmp.isVarbindError(vb)) {
          console.warn(`[snmp] Erro no OID ${vb.oid}: ${snmp.varbindError(vb)}`);
          result.set(vb.oid, null);
        } else {
          result.set(vb.oid, vb.value);
        }
      }
      resolve(result);
    });
  });
}

// ---------------------------------------------------------------------------
// Coleta métricas do sistema (CPU, memória, uptime, temp, voltagem)
// ---------------------------------------------------------------------------
async function collectSystemMetrics(db) {
  const oids = [OID_CPU, OID_MEM_TOTAL, OID_MEM_USED, OID_UPTIME, OID_TEMP, OID_VOLTAGE];
  const data = await snmpGet(oids);

  const cpu      = safeNum(data.get(OID_CPU));
  const memTotal = safeNum(data.get(OID_MEM_TOTAL));   // KB
  const memUsed  = safeNum(data.get(OID_MEM_USED));    // KB (via hrStorageUsed)
  const uptime   = safeNum(data.get(OID_UPTIME));      // TimeTicks (1/100 seg)

  // Temperatura e voltagem retornam valor × 10 (ex: 420 → 42.0°C)
  const rawTemp    = safeNum(data.get(OID_TEMP));
  const rawVoltage = safeNum(data.get(OID_VOLTAGE));
  const temp    = rawTemp    !== null ? rawTemp        : null;
  const voltage = rawVoltage !== null ? rawVoltage / 10 : null;

  const uptimeSecs = uptime !== null ? Math.floor(uptime / 100) : null;
  const ts = Math.floor(Date.now() / 1000);

  db.prepare(`
    INSERT INTO system_metrics (ts, cpu_pct, mem_total, mem_used, uptime_secs, temp_c, voltage_v)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(ts, cpu, memTotal, memUsed, uptimeSecs, temp, voltage);

  console.log(`[collector] Sistema → CPU: ${cpu}% | Temp: ${temp}°C | V: ${voltage}V | Uptime: ${uptimeSecs}s`);
}

// ---------------------------------------------------------------------------
// Coleta tráfego e status das interfaces
// ---------------------------------------------------------------------------
async function collectInterfaces(db) {
  const oids = [];
  for (const i of INTERFACE_INDEXES) {
    oids.push(OID_IF_IN(i), OID_IF_OUT(i), OID_IF_STAT(i));
  }

  const data = await snmpGet(oids);
  const ts = Math.floor(Date.now() / 1000);

  const stmtIface = db.prepare(`
    UPDATE interfaces SET last_status = ?, updated_at = ? WHERE iface_index = ?
  `);

  const stmtTraffic = db.prepare(`
    INSERT INTO traffic_samples (ts, iface_index, in_octets, out_octets, in_bps, out_bps)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertAll = db.transaction(() => {
    for (const i of INTERFACE_INDEXES) {
      const inOctets  = safeNum(data.get(OID_IF_IN(i)));
      const outOctets = safeNum(data.get(OID_IF_OUT(i)));
      const status    = safeNum(data.get(OID_IF_STAT(i)));

      // Atualiza status da interface
      if (status !== null) {
        stmtIface.run(status, ts, i);
      }

      if (inOctets === null || outOctets === null) return;

      // Calcula taxa bits/s com base no delta desde a coleta anterior
      let inBps = null, outBps = null;
      const prev = previousTrafficSnapshot[i];
      if (prev) {
        const dt = ts - prev.ts;
        if (dt > 0) {
          // Trata wrap-around do contador (32-bit = max 4294967295)
          const MAX32 = 4294967295;
          const deltaIn  = inOctets  >= prev.in_octets  ? inOctets - prev.in_octets   : (MAX32 - prev.in_octets)  + inOctets;
          const deltaOut = outOctets >= prev.out_octets ? outOctets - prev.out_octets  : (MAX32 - prev.out_octets) + outOctets;
          inBps  = (deltaIn  * 8) / dt;  // bits por segundo
          outBps = (deltaOut * 8) / dt;
        }
      }

      // Salva snapshot atual para próxima iteração
      previousTrafficSnapshot[i] = { ts, in_octets: inOctets, out_octets: outOctets };

      stmtTraffic.run(ts, i, inOctets, outOctets, inBps, outBps);
    }
  });

  insertAll();
  console.log(`[collector] Interfaces coletadas (${INTERFACE_INDEXES.length} portas)`);
}

// ---------------------------------------------------------------------------
// Limpeza de dados antigos (mantém 30 dias)
// ---------------------------------------------------------------------------
function pruneOldData(db) {
  const cutoff = Math.floor(Date.now() / 1000) - 30 * 24 * 3600;
  const r1 = db.prepare("DELETE FROM system_metrics  WHERE ts < ?").run(cutoff);
  const r2 = db.prepare("DELETE FROM traffic_samples WHERE ts < ?").run(cutoff);
  if (r1.changes > 0 || r2.changes > 0) {
    console.log(`[collector] Pruning: removidos ${r1.changes} system_metrics e ${r2.changes} traffic_samples`);
  }
}

// ---------------------------------------------------------------------------
// Ciclo de coleta
// ---------------------------------------------------------------------------
async function collect() {
  const db = getDb();
  try {
    await collectSystemMetrics(db);
    await collectInterfaces(db);
    pruneOldData(db);
  } catch (err) {
    console.error("[collector] Erro durante coleta:", err.message);
  }
}

// ---------------------------------------------------------------------------
// Inicia o coletor: executa imediatamente e depois a cada COLLECT_INTERVAL
// ---------------------------------------------------------------------------
function startCollector() {
  console.log(`[collector] Alvo: ${MIKROTIK_HOST} | Intervalo: ${COLLECT_INTERVAL / 1000}s`);
  collect();  // coleta inicial imediata
  setInterval(collect, COLLECT_INTERVAL);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function safeNum(val) {
  if (val === null || val === undefined) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

module.exports = { startCollector };
