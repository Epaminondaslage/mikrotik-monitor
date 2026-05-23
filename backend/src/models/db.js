// =============================================================================
// Mikrotik Monitor — backend/src/models/db.js
// Aplicação: Mikrotik Monitor
// Descrição: Inicialização do banco SQLite via better-sqlite3.
//            Cria todas as tabelas necessárias para persistência de métricas
//            do sistema e tráfego de interfaces do Mikrotik RB2011.
// Tabelas:
//   - system_metrics  : CPU, memória, temperatura, voltagem, uptime
//   - interfaces      : lista de interfaces com status atual
//   - traffic_samples : amostras de tráfego IN/OUT por interface (bytes raw)
// =============================================================================

const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "../../data/mikrotik.db");

let db;

/**
 * Inicializa o banco de dados SQLite.
 * Cria as tabelas caso ainda não existam.
 */
async function initDb() {
  db = new Database(DB_PATH);

  // Melhora performance com WAL mode
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");

  // -------------------------------------------------------------------------
  // Tabela: system_metrics
  // Armazena snapshots das métricas globais do roteador
  // -------------------------------------------------------------------------
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_metrics (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      ts          INTEGER NOT NULL,          -- epoch em segundos
      cpu_pct     REAL,                      -- uso de CPU em %
      mem_total   INTEGER,                   -- memória total em KB
      mem_used    INTEGER,                   -- memória usada em KB (calculada)
      uptime_secs INTEGER,                   -- uptime em segundos
      temp_c      REAL,                      -- temperatura em °C
      voltage_v   REAL                       -- voltagem em V
    );

    CREATE INDEX IF NOT EXISTS idx_sm_ts ON system_metrics(ts);
  `);

  // -------------------------------------------------------------------------
  // Tabela: interfaces
  // Catálogo de interfaces do roteador com seus índices SNMP
  // -------------------------------------------------------------------------
  db.exec(`
    CREATE TABLE IF NOT EXISTS interfaces (
      iface_index  INTEGER PRIMARY KEY,     -- índice SNMP (ifIndex)
      name         TEXT NOT NULL,           -- nome legível (ex: ether1)
      type         TEXT,                    -- tipo: ethernet | wifi | bridge | pppoe | l2tp | sfp
      last_status  INTEGER DEFAULT 1,       -- 1=up, 2=down (ifOperStatus)
      updated_at   INTEGER                  -- epoch da última atualização
    );
  `);

  // -------------------------------------------------------------------------
  // Tabela: traffic_samples
  // Amostras brutas de octets IN/OUT por interface (contador SNMP acumulativo)
  // -------------------------------------------------------------------------
  db.exec(`
    CREATE TABLE IF NOT EXISTS traffic_samples (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      ts           INTEGER NOT NULL,         -- epoch em segundos
      iface_index  INTEGER NOT NULL,
      in_octets    INTEGER NOT NULL,         -- ifInOctets acumulado
      out_octets   INTEGER NOT NULL,         -- ifOutOctets acumulado
      in_bps       REAL,                     -- taxa calculada (bits/s)
      out_bps      REAL,                     -- taxa calculada (bits/s)
      FOREIGN KEY (iface_index) REFERENCES interfaces(iface_index)
    );

    CREATE INDEX IF NOT EXISTS idx_ts_ts         ON traffic_samples(ts);
    CREATE INDEX IF NOT EXISTS idx_ts_iface_ts   ON traffic_samples(iface_index, ts);
  `);

  // -------------------------------------------------------------------------
  // Seed: popula tabela de interfaces com o mapeamento conhecido do RB2011
  // Os índices SNMP foram mapeados para o RB2011UiAS-2HnD
  // -------------------------------------------------------------------------
  const seedInterfaces = db.prepare(`
    INSERT OR IGNORE INTO interfaces (iface_index, name, type)
    VALUES (?, ?, ?)
  `);

  const knownInterfaces = [
    [1,  "sfp1",            "sfp"],
    [2,  "ether1",          "ethernet"],
    [3,  "ether2",          "ethernet"],
    [4,  "ether3",          "ethernet"],
    [5,  "ether4",          "ethernet"],
    [6,  "ether5",          "ethernet"],
    [7,  "ether6",          "ethernet"],
    [8,  "ether7",          "ethernet"],
    [9,  "ether8",          "ethernet"],
    [10, "ether9",          "ethernet"],
    [11, "ether10",         "ethernet"],
    [12, "WI-FI",           "wifi"],
    [13, "bridge-interna",  "bridge"],
    [14, "pppoe-provedor",  "pppoe"],
    [15, "l2tp-Planetfone", "l2tp"],
  ];

  const insertMany = db.transaction((ifaces) => {
    for (const [idx, name, type] of ifaces) {
      seedInterfaces.run(idx, name, type);
    }
  });
  insertMany(knownInterfaces);

  return db;
}

/**
 * Retorna a instância do banco (deve ser chamado após initDb).
 */
function getDb() {
  if (!db) throw new Error("Banco não inicializado. Chame initDb() primeiro.");
  return db;
}

module.exports = { initDb, getDb };
