// =============================================================================
// Mikrotik Monitor — frontend/src/utils/api.js
// Descrição: Funções utilitárias para todas as chamadas à API REST do backend.
//            Usa VITE_API_BASE_URL (padrão: /api) como base.
// =============================================================================

const BASE = import.meta.env.VITE_API_BASE_URL || "/api";

async function apiFetch(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${path} → HTTP ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Métricas do sistema
// ---------------------------------------------------------------------------

/** Último snapshot: CPU, memória, temperatura, voltagem, uptime */
export const fetchMetricsLatest = () => apiFetch("/metrics/latest");

/** Histórico de métricas para gráficos. range: "24h" | "7d" | "30d" */
export const fetchMetricsHistory = (range = "24h") =>
  apiFetch(`/metrics/history?range=${range}`);

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/** Lista todas as interfaces com status e tráfego atual */
export const fetchInterfaces = () => apiFetch("/interfaces");

// ---------------------------------------------------------------------------
// Tráfego histórico
// ---------------------------------------------------------------------------

/** Série temporal de tráfego de uma interface. range: "24h" | "7d" | "30d" */
export const fetchTraffic = (ifaceIndex, range = "24h") =>
  apiFetch(`/traffic/${ifaceIndex}?range=${range}`);

/** Resumo de pico IN/OUT de todas as interfaces */
export const fetchTrafficSummary = (range = "24h") =>
  apiFetch(`/traffic/summary?range=${range}`);

// ---------------------------------------------------------------------------
// Healthcheck
// ---------------------------------------------------------------------------
export const fetchHealth = () => apiFetch("/health");
