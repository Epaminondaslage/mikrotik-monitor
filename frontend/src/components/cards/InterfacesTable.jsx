// =============================================================================
// Mikrotik Monitor — frontend/src/components/cards/InterfacesTable.jsx
// Descrição: Tabela de interfaces do Mikrotik com status online/offline,
//            tipo, tráfego atual IN/OUT em Mbps e badge colorido por status.
// =============================================================================

import { ArrowDown, ArrowUp, Wifi, Network, Link2, Server } from "lucide-react";
import clsx from "clsx";

// Ícone por tipo de interface
function TypeIcon({ type }) {
  const icons = {
    wifi:     <Wifi size={14} />,
    ethernet: <Network size={14} />,
    sfp:      <Link2 size={14} />,
    bridge:   <Server size={14} />,
    pppoe:    <Link2 size={14} />,
    l2tp:     <Link2 size={14} />,
  };
  return icons[type] ?? <Network size={14} />;
}

// Badge de status
function StatusBadge({ status }) {
  return (
    <span className={status === "up" ? "badge-up" : "badge-down"}>
      <span className={clsx(
        "w-1.5 h-1.5 rounded-full",
        status === "up" ? "bg-emerald-500 animate-pulse" : "bg-red-500"
      )} />
      {status === "up" ? "UP" : "DOWN"}
    </span>
  );
}

// Formata Mbps para exibição
function fmt(mbps) {
  if (mbps == null) return <span className="text-gray-500">—</span>;
  if (mbps < 0.001) return <span className="text-gray-500">0</span>;
  if (mbps >= 1000) return `${(mbps / 1000).toFixed(2)} Gbps`;
  if (mbps >= 1)    return `${mbps.toFixed(2)} Mbps`;
  return `${(mbps * 1000).toFixed(1)} Kbps`;
}

export default function InterfacesTable({ interfaces, loading }) {
  if (loading) {
    return (
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Interfaces</h2>
        </div>
        <div className="animate-pulse p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const ifaces = interfaces?.data ?? [];
  const up   = ifaces.filter((i) => i.status === "up").length;
  const down = ifaces.filter((i) => i.status === "down").length;

  return (
    <div className="card overflow-hidden">
      {/* Cabeçalho */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Interfaces</h2>
        <div className="flex items-center gap-2">
          <span className="badge-up">{up} UP</span>
          {down > 0 && <span className="badge-down">{down} DOWN</span>}
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/50 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <th className="text-left px-4 py-2.5 font-medium">#</th>
              <th className="text-left px-4 py-2.5 font-medium">Interface</th>
              <th className="text-left px-4 py-2.5 font-medium">Tipo</th>
              <th className="text-left px-4 py-2.5 font-medium">Status</th>
              <th className="text-right px-4 py-2.5 font-medium">
                <span className="flex items-center justify-end gap-1">
                  <ArrowDown size={12} className="text-emerald-500" /> IN
                </span>
              </th>
              <th className="text-right px-4 py-2.5 font-medium">
                <span className="flex items-center justify-end gap-1">
                  <ArrowUp size={12} className="text-brand-500" /> OUT
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {ifaces.map((iface) => (
              <tr
                key={iface.index}
                className={clsx(
                  "transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50",
                  iface.status === "down" && "opacity-50"
                )}
              >
                <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{iface.index}</td>
                <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">{iface.name}</td>
                <td className="px-4 py-2.5">
                  <span className="badge-type flex items-center gap-1.5 w-fit">
                    <TypeIcon type={iface.type} />
                    {iface.type}
                  </span>
                </td>
                <td className="px-4 py-2.5"><StatusBadge status={iface.status} /></td>
                <td className="px-4 py-2.5 text-right font-mono text-xs text-emerald-600 dark:text-emerald-400">
                  {fmt(iface.in_mbps)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs text-brand-600 dark:text-brand-400">
                  {fmt(iface.out_mbps)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
