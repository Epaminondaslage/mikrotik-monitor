// =============================================================================
// Mikrotik Monitor — frontend/src/App.jsx
// Descrição: Raiz da aplicação React. Gerencia o tema dark/light e define
//            o roteamento entre as páginas do dashboard.
// =============================================================================

import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import DashboardPage from "./pages/DashboardPage";
import InterfacesPage from "./pages/InterfacesPage";
import TrafficPage from "./pages/TrafficPage";

export default function App() {
  // -------------------------------------------------------------------------
  // Gerenciamento do tema: salvo no localStorage, padrão = dark
  // -------------------------------------------------------------------------
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("mikrotik-theme");
    return saved !== null ? saved === "dark" : true;
  });

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
    localStorage.setItem("mikrotik-theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <BrowserRouter>
      <Layout isDark={isDark} onToggleTheme={() => setIsDark((v) => !v)}>
        <Routes>
          <Route path="/"            element={<DashboardPage />} />
          <Route path="/interfaces"  element={<InterfacesPage />} />
          <Route path="/traffic"     element={<TrafficPage />} />
          <Route path="/traffic/:id" element={<TrafficPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
