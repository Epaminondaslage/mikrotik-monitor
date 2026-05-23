// =============================================================================
// Mikrotik Monitor — frontend/src/components/layout/Layout.jsx
// Descrição: Layout principal com sidebar + topbar com botão voltar ao portal
//            (http://10.0.0.5/graficos/). Modo claro: sidebar branco.
//            Modo escuro: sidebar bg-gray-950.
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
  ChevronLeft,
} from "lucide-react";
import clsx from "clsx";

const NAV_ITEMS = [
  { to: "/",           label: "Dashboard",  icon: LayoutDashboard },
  { to: "/interfaces", label: "Interfaces", icon: Network },
  { to: "/traffic",    label: "Tráfego",    icon: Activity },
];

const PORTAL_URL = "http://10.0.0.5/graficos/";

// ---------------------------------------------------------------------------
// Item de navegação
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
// Topbar — botão voltar ao portal de gráficos
// ---------------------------------------------------------------------------
function Topbar({ isDark, onToggleTheme, onMenuToggle, menuOpen }) {
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-2.5
                    bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
      {/* Botão voltar */}
      <a
        href={PORTAL_URL}
        className="flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400
                   bg-brand-50 dark:bg-brand-900/30 px-3 py-1.5 rounded-full
                   hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors"
      >
        <ChevronLeft size={15} />
        Gráficos
      </a>

      {/* Título central */}
      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 hidden md:block">
        Mikrotik Monitor — RB2011 · 10.0.0.1
      </span>

      {/* Direita: toggle tema + menu mobile */}
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400
                     hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={isDark ? "Modo claro" : "Modo escuro"}
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400
                     hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {menuOpen ? <X size={17} /> : <Menu size={17} />}
        </button>
      </div>
    </div>
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

      {/* Rodapé: colapso */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-1">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex items-center justify-center rounded-lg px-3 py-2
                     text-gray-400 dark:text-gray-500
                     hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={collapsed ? "Expandir menu" : "Colapsar menu"}
        >
          <ChevronRight size={16} className={clsx("transition-transform", !collapsed && "rotate-180")} />
        </button>
      </div>
    </aside>
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
      <nav className="fixed left-0 top-0 bottom-0 w-64 z-50 p-4 flex flex-col gap-1 md:hidden
                      bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">
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
        {/* Botão voltar no drawer mobile */}
        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800">
          <a
            href={PORTAL_URL}
            className="flex items-center gap-2 text-sm font-medium text-brand-600 dark:text-brand-400
                       hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2.5 rounded-lg transition-colors"
          >
            <ChevronLeft size={16} />
            Voltar aos Gráficos
          </a>
        </div>
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
        {/* Topbar com botão voltar — visível em todas as telas */}
        <Topbar
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
