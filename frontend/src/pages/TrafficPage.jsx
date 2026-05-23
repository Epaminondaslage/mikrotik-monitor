// =============================================================================
// Mikrotik Monitor — frontend/src/pages/TrafficPage.jsx
// Descrição: Página de tráfego — exibe gráficos MRTG de todas as interfaces
//            (ou de uma específica quando acessado via /traffic/:id).
//            Suporte a ranges 24h / 7d / 30d com seleção global ou por gráfico.
// =============================================================================

import { useParams } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { fetchInterfaces } from "../utils/api";
import TrafficChart from "../components/charts/TrafficChart";

export default function TrafficPage() {
  const { id } = useParams();
  const specificIndex = id ? parseInt(id, 10) : null;

  const { data: ifacesData, loading: ifacesLoading } = useApi(fetchInterfaces, [], 0);

  // Se uma interface específica foi selecionada, mostra só ela
  if (specificIndex) {
    const iface = ifacesData?.data?.find((i) => i.index === specificIndex);
    return (
      <div className="max-w-screen-xl mx-auto space-y-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tráfego — {iface?.name ?? `Interface ${specificIndex}`}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Histórico de tráfego entrada/saída
          </p>
        </div>
        <TrafficChart ifaceIndex={specificIndex} ifaceName={iface?.name} />
      </div>
    );
  }

  // Senão, mostra todas as interfaces em grid
  const ifaces = ifacesData?.data ?? [];

  return (
    <div className="max-w-screen-xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Tráfego</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Gráficos MRTG — todas as interfaces
        </p>
      </div>

      {ifacesLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4 h-60 animate-pulse bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {ifaces.map((iface) => (
            <TrafficChart key={iface.index} ifaceIndex={iface.index} ifaceName={iface.name} />
          ))}
        </div>
      )}
    </div>
  );
}
