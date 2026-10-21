"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useLanguage } from "@/lib/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";

type ActiveKey = "dashboard" | "orders" | "customers";

export function AdminSidebar({ active, mounted }: { active: ActiveKey; mounted: boolean }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NAV_ITEMS: { key: ActiveKey; icon: string; label: string; path: string }[] = [
    { key: "dashboard", icon: "📊", label: t("nav_dashboard"), path: "/" },
    { key: "orders", icon: "📦", label: t("nav_orders"), path: "/orders" },
    { key: "customers", icon: "👥", label: t("nav_customers"), path: "/customers" },
  ];

  function logout() {
    localStorage.removeItem("pecheniya_admin");
    router.push("/login");
  }

  function go(path: string) {
    setMobileOpen(false);
    router.push(path);
  }

  const NavList = (
    <>
      {NAV_ITEMS.map((item) => (
        <div
          key={item.key}
          onClick={() => go(item.path)}
          style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, marginBottom: 4,
            background: active === item.key ? "var(--accent-bg)" : "transparent",
            color: active === item.key ? "var(--accent-text)" : "var(--muted)",
            fontWeight: active === item.key ? 700 : 500, fontSize: 14, cursor: "pointer",
          }}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </div>
      ))}
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="admin-sidebar-desktop"
        style={{
          width: 240,
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          padding: "24px 16px",
          position: "sticky",
          top: 0,
          height: "100vh",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32, padding: "0 8px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/smag-logo.png" alt="SmaG" style={{ height: 40, width: "auto", flexShrink: 0 }} />
          <div>
            <div style={{ fontFamily: "var(--font-jakarta)", fontSize: 16, fontWeight: 800, color: "var(--fg)" }}>{t("sidebar_title")}</div>
            <div style={{ color: "var(--muted)", fontSize: 11 }}>{t("sidebar_subtitle")}</div>
          </div>
        </div>

        {NavList}

        <div style={{ flex: 1 }} />

        <div style={{ marginBottom: 8 }}>
          <LanguageSwitcher />
        </div>

        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12,
              border: "1px solid var(--border)", background: "transparent", color: "var(--muted)",
              fontSize: 14, cursor: "pointer", marginBottom: 8, width: "100%",
            }}
          >
            {theme === "dark" ? "☀️" : "🌙"} {t("theme_prefix")} {theme === "dark" ? t("theme_dark") : t("theme_light")}
          </button>
        )}

        <button
          onClick={logout}
          style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12,
            border: "1px solid var(--border)", background: "transparent", color: "var(--red)",
            fontSize: 14, cursor: "pointer", width: "100%",
          }}
        >
          🚪 {t("logout")}
        </button>
      </aside>

      {/* Mobile top bar */}
      <div
        className="admin-topbar-mobile"
        style={{
          display: "none",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 0,
          zIndex: 60,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/smag-logo.png" alt="SmaG" style={{ height: 32, width: "auto", flexShrink: 0 }} />
          <span style={{ fontFamily: "var(--font-jakarta)", fontSize: 15, fontWeight: 800, color: "var(--fg)" }}>{t("sidebar_title")}</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menyu"
          style={{
            width: 38, height: 38, borderRadius: 10, border: "1px solid var(--border)",
            background: "var(--surface-2)", fontSize: 17, color: "var(--fg)", cursor: "pointer",
          }}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {mobileOpen && (
        <div
          className="admin-topbar-mobile"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            padding: 16,
            background: "var(--surface)",
            borderBottom: "1px solid var(--border)",
            position: "sticky",
            top: 62,
            zIndex: 59,
          }}
        >
          {NavList}
          <div style={{ borderTop: "1px solid var(--border)", marginTop: 8, paddingTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
            <LanguageSwitcher />
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12,
                  border: "1px solid var(--border)", background: "transparent", color: "var(--muted)",
                  fontSize: 14, cursor: "pointer", width: "100%",
                }}
              >
                {theme === "dark" ? "☀️" : "🌙"} {t("theme_prefix")} {theme === "dark" ? t("theme_dark") : t("theme_light")}
              </button>
            )}
            <button
              onClick={logout}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12,
                border: "1px solid var(--border)", background: "transparent", color: "var(--red)",
                fontSize: 14, cursor: "pointer", width: "100%",
              }}
            >
              🚪 {t("logout")}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 860px) {
          .admin-sidebar-desktop { display: none !important; }
          .admin-topbar-mobile { display: flex !important; }
        }
      `}</style>
    </>
  );
}
