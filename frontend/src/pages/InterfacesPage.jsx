// =============================================================================
// Mikrotik Monitor — frontend/src/pages/InterfacesPage.jsx
// Descrição: Página dedicada às interfaces — tabela completa com status,
//            tráfego atual e botão de acesso ao gráfico histórico.
// =============================================================================

import { Link } from "react-router-dom";
import { Activity } from "lucide-react";
import { useApi } from "../hooks/useApi";
import { fetchInterfaces } from "../utils/api";
import InterfacesTable from "../components/cards/InterfacesTable";

export default function InterfacesPage() {
  const { data, loading, error, refetch } = useApi(fetchInterfaces, [], 30_000);

  return (
    <div className="max-w-screen-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Interfaces</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Status e tráfego atual das {data?.count ?? 15} interfaces do RB2011
          </p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                     bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300
                     hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          Atualizar
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <InterfacesTable interfaces={data} loading={loading} />

      {/* Links rápidos para gráficos */}
      {!loading && data?.data && (
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Acesso rápido aos gráficos de tráfego
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.data.map((iface) => (
              <Link
                key={iface.index}
                to={`/traffic/${iface.index}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                           bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300
                           hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-600 dark:hover:text-brand-400
                           transition-colors"
              >
                <Activity size={12} />
                {iface.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
