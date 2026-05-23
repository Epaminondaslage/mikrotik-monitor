// =============================================================================
// Mikrotik Monitor — frontend/src/components/layout/Layout.jsx
// Descrição: Layout principal com sidebar + header mobile.
//            Modo claro: sidebar branco/cinza claro, fundo branco.
//            Modo escuro: sidebar bg-gray-950, fundo bg-gray-900.
// =============================================================================

import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Network,
  Activity,
  Sun,
  Moon,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";

const NAV_ITEMS = [
  { to: "/",           label: "Dashboard",  icon: LayoutDashboard },
  { to: "/interfaces", label: "Interfaces", icon: Network },
  { to: "/traffic",    label: "Tráfego",    icon: Activity },
];

// ---------------------------------------------------------------------------
// Item de navegação — adapta cores ao tema
// ---------------------------------------------------------------------------
function NavItem({ item, collapsed, onClick }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      onClick={onClick}
      className={({ isActive }) =>
        clsx(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
          isActive
            ? "bg-brand-600 text-white shadow-md"
            : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100",
          collapsed && "justify-center px-2"
        )
      }
    >
      <Icon size={18} className="shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  );
}

// ---------------------------------------------------------------------------
// Sidebar desktop
// ---------------------------------------------------------------------------
function Sidebar({ isDark, onToggleTheme }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={clsx(
        "hidden md:flex flex-col h-screen sticky top-0 transition-all duration-200",
        "bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo / título */}
      <div className={clsx(
        "flex items-center gap-3 px-4 py-4 border-b border-gray-200 dark:border-gray-800",
        collapsed && "justify-center px-2"
      )}>
        <img
          src="/mikrotik-logo.png"
          alt="Mikrotik"
          className="w-8 h-8 rounded-lg object-contain shrink-0 bg-gray-100 dark:bg-white p-0.5"
        />
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">Mikrotik Monitor</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">RB2011 · 10.0.0.1</p>
          </div>
        )}
      </div>

      {/* Navegação */}
      <nav className="flex-1 flex flex-col gap-1 p-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Rodapé: tema + colapso */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-1">
        <button
          onClick={onToggleTheme}
          className={clsx(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100",
            collapsed && "justify-center px-2"
          )}
          title={isDark ? "Modo claro" : "Modo escuro"}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
          {!collapsed && <span>{isDark ? "Modo claro" : "Modo escuro"}</span>}
        </button>

        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex items-center justify-center rounded-lg px-3 py-2 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={collapsed ? "Expandir menu" : "Colapsar menu"}
        >
          <ChevronRight size={16} className={clsx("transition-transform", !collapsed && "rotate-180")} />
        </button>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Header mobile
// ---------------------------------------------------------------------------
function MobileHeader({ isDark, onToggleTheme, menuOpen, onMenuToggle }) {
  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-30 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-2">
        <img
          src="/mikrotik-logo.png"
          alt="Mikrotik"
          className="w-7 h-7 rounded-md object-contain bg-gray-100 dark:bg-white p-0.5"
        />
        <span className="text-sm font-semibold text-gray-900 dark:text-white">Mikrotik Monitor</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Menu mobile drawer
// ---------------------------------------------------------------------------
function MobileDrawer({ open, onClose }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={onClose} />
      <nav className="fixed left-0 top-0 bottom-0 w-64 z-50 p-4 flex flex-col gap-1 md:hidden bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-800">
          <img
            src="/mikrotik-logo.png"
            alt="Mikrotik"
            className="w-8 h-8 rounded-lg object-contain bg-gray-100 dark:bg-white p-0.5"
          />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Mikrotik Monitor</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">RB2011 · 10.0.0.1</p>
          </div>
        </div>
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} item={item} collapsed={false} onClick={onClose} />
        ))}
      </nav>
    </>
  );
}

// ---------------------------------------------------------------------------
// Layout principal
// ---------------------------------------------------------------------------
export default function Layout({ children, isDark, onToggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Sidebar isDark={isDark} onToggleTheme={onToggleTheme} />

      <div className="flex flex-col flex-1 min-w-0">
        <MobileHeader
          isDark={isDark}
          onToggleTheme={onToggleTheme}
          menuOpen={menuOpen}
          onMenuToggle={() => setMenuOpen((v) => !v)}
        />
        <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 animate-fade-in">
          {children}
        </main>

        <footer className="px-6 py-3 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-600">
          Sítio Pé de Serra · Mikrotik Monitor v1.0 · 10.0.0.5
        </footer>
      </div>
    </div>
  );
}
