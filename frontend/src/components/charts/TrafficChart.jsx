// =============================================================================
// Mikrotik Monitor — frontend/src/components/charts/TrafficChart.jsx
// Descrição: Gráfico de tráfego estilo MRTG — área dupla (IN verde, OUT indigo)
//            com seletor de range 24h / 7d / 30d. Usa Recharts.
// =============================================================================

import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useApi } from "../../hooks/useApi";
import { fetchTraffic } from "../../utils/api";

const RANGES = ["24h", "7d", "30d"];

// Formata timestamp do eixo X conforme o range
function fmtAxisTick(ts, range) {
  const d = new Date(ts * 1000);
  if (range === "24h") return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

// Formata Mbps para tooltip
function fmtMbps(v) {
  if (v == null) return "—";
  if (v >= 1000) return `${(v / 1000).toFixed(2)} Gbps`;
  if (v >= 1)    return `${v.toFixed(3)} Mbps`;
  return `${(v * 1000).toFixed(1)} Kbps`;
}

// Tooltip customizado
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = new Date(label * 1000);
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1.5">
        {d.toLocaleDateString("pt-BR")} {d.toLocaleTimeString("pt-BR")}
      </p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-mono">
          {p.name === "in_mbps" ? "▼ IN " : "▲ OUT"}: {fmtMbps(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function TrafficChart({ ifaceIndex, ifaceName }) {
  const [range, setRange] = useState("24h");

  const { data, loading, error } = useApi(
    () => fetchTraffic(ifaceIndex, range),
    [ifaceIndex, range],
    0  // sem polling — o dashboard faz reload global
  );

  return (
    <div className="card p-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {ifaceName ?? `Interface ${ifaceIndex}`}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Tráfego IN / OUT</p>
        </div>

        {/* Seletor de range */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={
                range === r
                  ? "px-3 py-1 rounded-md text-xs font-medium bg-brand-600 text-white shadow"
                  : "px-3 py-1 rounded-md text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              }
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Gráfico */}
      {loading && (
        <div className="h-48 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="h-48 flex items-center justify-center text-xs text-red-500">
          Erro ao carregar: {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          {data.count === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-gray-400">
              Nenhum dado no período
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={data.data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id={`gradIn-${ifaceIndex}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id={`gradOut-${ifaceIndex}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.4} />

                <XAxis
                  dataKey="ts"
                  tickFormatter={(v) => fmtAxisTick(v, range)}
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={(v) => v < 1 ? `${(v * 1000).toFixed(0)}K` : `${v.toFixed(2)}`}
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                  unit=" M"
                />
                <Tooltip content={<CustomTooltip />} />

                <Area
                  type="monotone"
                  dataKey="in_mbps"
                  name="in_mbps"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  fill={`url(#gradIn-${ifaceIndex})`}
                  dot={false}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="out_mbps"
                  name="out_mbps"
                  stroke="#6366f1"
                  strokeWidth={1.5}
                  fill={`url(#gradOut-${ifaceIndex})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {/* Legenda manual */}
          <div className="flex items-center gap-4 mt-2 justify-end text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" /> IN
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-brand-500 inline-block rounded" /> OUT
            </span>
          </div>
        </>
      )}
    </div>
  );
}
