// =============================================================================
// Mikrotik Monitor — frontend/src/components/cards/MetricCards.jsx
// Descrição: Cards de métricas do sistema: CPU%, Memória%, Temperatura,
//            Voltagem e Uptime. Exibidos na linha superior do dashboard.
// =============================================================================

import { Cpu, MemoryStick, Thermometer, Zap, Clock } from "lucide-react";
import clsx from "clsx";

// ---------------------------------------------------------------------------
// Barra de progresso para CPU e Memória
// ---------------------------------------------------------------------------
function ProgressBar({ value, colorClass }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
      <div
        className={clsx("h-full rounded-full transition-all duration-500", colorClass)}
        style={{ width: `${Math.min(value ?? 0, 100)}%` }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card individual de métrica
// ---------------------------------------------------------------------------
function MetricCard({ icon: Icon, label, value, sub, progress, progressColor, accentColor }) {
  return (
    <div className="card p-4 flex flex-col gap-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className={clsx(
          "w-9 h-9 rounded-lg flex items-center justify-center",
          accentColor
        )}>
          <Icon size={18} className="text-white" />
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>

      <div>
        <p className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
          {value ?? "—"}
        </p>
        {sub && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sub}</p>
        )}
      </div>

      {progress !== undefined && progress !== null && (
        <ProgressBar value={progress} colorClass={progressColor} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Determinação da cor da barra de CPU e memória
// ---------------------------------------------------------------------------
function cpuColor(pct) {
  if (pct >= 90) return "bg-red-500";
  if (pct >= 70) return "bg-amber-500";
  return "bg-brand-500";
}

function tempColor(c) {
  if (c >= 70) return "bg-red-500";
  if (c >= 55) return "bg-amber-500";
  return "bg-emerald-500";
}

// ---------------------------------------------------------------------------
// Conjunto de cards exportado para o Dashboard
// ---------------------------------------------------------------------------
export default function MetricCards({ metrics, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card p-4 h-28 animate-pulse bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    );
  }

  const d = metrics?.data;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <MetricCard
        icon={Cpu}
        label="CPU"
        value={d?.cpu_pct != null ? `${d.cpu_pct}%` : "—"}
        sub="Uso atual"
        progress={d?.cpu_pct}
        progressColor={cpuColor(d?.cpu_pct)}
        accentColor="bg-brand-600"
      />

      <MetricCard
        icon={MemoryStick}
        label="Memória"
        value={d?.mem_pct != null ? `${d.mem_pct}%` : "—"}
        sub={d?.mem_used_kb != null
          ? `${(d.mem_used_kb / 1024).toFixed(0)} / ${(d.mem_total_kb / 1024).toFixed(0)} MB`
          : undefined
        }
        progress={d?.mem_pct}
        progressColor={cpuColor(d?.mem_pct)}
        accentColor="bg-violet-600"
      />

      <MetricCard
        icon={Thermometer}
        label="Temperatura"
        value={d?.temp_c != null ? `${d.temp_c}°C` : "—"}
        sub="Board temp"
        progress={d?.temp_c != null ? (d.temp_c / 100) * 100 : undefined}
        progressColor={tempColor(d?.temp_c)}
        accentColor={
          d?.temp_c >= 70 ? "bg-red-600" :
          d?.temp_c >= 55 ? "bg-amber-600" :
          "bg-emerald-600"
        }
      />

      <MetricCard
        icon={Zap}
        label="Tensão"
        value={d?.voltage_v != null ? `${d.voltage_v.toFixed(1)}V` : "—"}
        sub="Power supply"
        accentColor="bg-amber-600"
      />

      <MetricCard
        icon={Clock}
        label="Uptime"
        value={d?.uptime_human ?? "—"}
        sub={d?.ts ? `Coleta: ${new Date(d.ts * 1000).toLocaleTimeString("pt-BR")}` : undefined}
        accentColor="bg-sky-600"
      />
    </div>
  );
}
