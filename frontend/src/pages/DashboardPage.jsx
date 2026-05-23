// =============================================================================
// Mikrotik Monitor — frontend/src/pages/DashboardPage.jsx
// Descrição: Página principal do dashboard. Exibe cards de métricas do sistema,
//            tabela de interfaces e gráficos de tráfego das interfaces ativas.
//            Polling a cada 30s para dados ao vivo.
// =============================================================================

import { RefreshCw } from "lucide-react";
import { useApi } from "../hooks/useApi";
import { fetchMetricsLatest, fetchInterfaces } from "../utils/api";
import MetricCards from "../components/cards/MetricCards";
import InterfacesTable from "../components/cards/InterfacesTable";
import TrafficChart from "../components/charts/TrafficChart";

// Interfaces principais para exibir gráficos no dashboard
const DASHBOARD_CHARTS = [
  { index: 14, name: "pppoe-provedor" },
  { index: 1,  name: "sfp1" },
  { index: 12, name: "WI-FI" },
  { index: 15, name: "l2tp-Planetfone" },
];

export default function DashboardPage() {
  const POLL = 30_000; // 30 segundos

  const {
    data: metrics,
    loading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
  } = useApi(fetchMetricsLatest, [], POLL);

  const {
    data: interfaces,
    loading: ifacesLoading,
    error: ifacesError,
    refetch: refetchIfaces,
  } = useApi(fetchInterfaces, [], POLL);

  function handleRefresh() {
    refetchMetrics();
    refetchIfaces();
  }

  // Determina quais interfaces estão UP para mostrar gráficos
  const upInterfaces = interfaces?.data?.filter((i) => i.status === "up") ?? [];
  const chartsToShow = DASHBOARD_CHARTS.filter((c) =>
    upInterfaces.some((i) => i.index === c.index)
  );

  return (
    <div className="max-w-screen-xl mx-auto space-y-6">

      {/* Cabeçalho da página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Mikrotik RB2011UiAS-2HnD · 10.0.0.1
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                     bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300
                     hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <RefreshCw size={14} />
          Atualizar
        </button>
      </div>

      {/* Erros */}
      {(metricsError || ifacesError) && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {metricsError && <p>Métricas: {metricsError}</p>}
          {ifacesError  && <p>Interfaces: {ifacesError}</p>}
        </div>
      )}

      {/* Cards de métricas */}
      <MetricCards metrics={metrics} loading={metricsLoading} />

      {/* Tabela de interfaces */}
      <InterfacesTable interfaces={interfaces} loading={ifacesLoading} />

      {/* Gráficos de tráfego das interfaces principais */}
      {chartsToShow.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Tráfego — Interfaces Principais
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {chartsToShow.map((c) => (
              <TrafficChart key={c.index} ifaceIndex={c.index} ifaceName={c.name} />
            ))}
          </div>
        </div>
      )}

      {/* Sem dados ainda */}
      {!metricsLoading && !metrics?.data && !metricsError && (
        <div className="card p-8 text-center text-sm text-gray-400 dark:text-gray-500">
          Aguardando primeira coleta SNMP... (ocorre em até 5 minutos após o start)
        </div>
      )}
    </div>
  );
}
