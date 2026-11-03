"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useLanguage } from "@/lib/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";
import {
  ChartIcon,
  BoxIcon,
  TagIcon,
  UsersIcon,
  SettingsIcon,
  SunIcon,
  MoonIcon,
  LogoutIcon,
  MenuIcon,
  CloseIcon,
} from "./Icons";

type ActiveKey = "dashboard" | "orders" | "products" | "customers" | "settings";

type IconComponent = React.ComponentType<{ size?: number; color?: string }>;

export function AdminSidebar({ active, mounted }: { active: ActiveKey; mounted: boolean }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NAV_ITEMS: { key: ActiveKey; Icon: IconComponent; label: string; path: string }[] = [
    { key: "dashboard", Icon: ChartIcon, label: t("nav_dashboard"), path: "/" },
    { key: "orders", Icon: BoxIcon, label: t("nav_orders"), path: "/orders" },
    { key: "products", Icon: TagIcon, label: t("nav_products"), path: "/products" },
    { key: "customers", Icon: UsersIcon, label: t("nav_customers"), path: "/customers" },
    { key: "settings", Icon: SettingsIcon, label: t("nav_settings"), path: "/settings" },
  ];

  function logout() {
    // Clear httpOnly cookie on server + localStorage
    fetch("/api/auth/logout", { method: "POST" }).finally(() => {
      localStorage.removeItem("pecheniya_admin");
      router.push("/login");
    });
  }

  function go(path: string) {
    setMobileOpen(false);
    router.push(path);
  }

  const NavList = (
    <>
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.key;
        return (
          <button
            key={item.key}
            onClick={() => go(item.path)}
            className="nav-item"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              padding: "11px 13px",
              borderRadius: 12,
              marginBottom: 3,
              width: "100%",
              border: "none",
              textAlign: "left",
              background: isActive ? "var(--accent-bg)" : "transparent",
              color: isActive ? "var(--accent-text)" : "var(--muted)",
              fontWeight: isActive ? 700 : 500,
              fontSize: 14,
              cursor: "pointer",
              position: "relative",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {isActive && (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 3,
                  height: 18,
                  borderRadius: "0 3px 3px 0",
                  background: "var(--accent)",
                }}
              />
            )}
            <item.Icon size={18} color={isActive ? "var(--accent)" : "var(--muted)"} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </>
  );

  const ghostButtonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 13px",
    borderRadius: 12,
    border: "1px solid var(--border)",
    background: "transparent",
    fontSize: 13.5,
    fontWeight: 500,
    cursor: "pointer",
    width: "100%",
    transition: "background 0.15s",
  };

  const ThemeButton = mounted ? (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      style={{ ...ghostButtonStyle, color: "var(--muted)" }}
    >
      {theme === "dark" ? (
        <SunIcon size={17} color="var(--amber)" />
      ) : (
        <MoonIcon size={17} color="var(--muted)" />
      )}
      <span>
        {t("theme_prefix")} {theme === "dark" ? t("theme_dark") : t("theme_light")}
      </span>
    </button>
  ) : null;

  const LogoutButton = (
    <button onClick={logout} style={{ ...ghostButtonStyle, color: "var(--red)" }}>
      <LogoutIcon size={17} color="var(--red)" />
      <span>{t("logout")}</span>
    </button>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="admin-sidebar-desktop"
        style={{
          width: 244,
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          padding: "22px 14px",
          position: "sticky",
          top: 0,
          height: "100vh",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            marginBottom: 26,
            padding: "0 6px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/smag-logo.png" alt="SmaG" style={{ height: 38, width: "auto", flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--font-jakarta)",
                fontSize: 15.5,
                fontWeight: 800,
                color: "var(--fg)",
                letterSpacing: "-0.2px",
              }}
            >
              {t("sidebar_title")}
            </div>
            <div style={{ color: "var(--muted)", fontSize: 11 }}>{t("sidebar_subtitle")}</div>
          </div>
        </div>

        {NavList}

        <div style={{ flex: 1 }} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 7,
            paddingTop: 14,
            borderTop: "1px solid var(--border)",
          }}
        >
          <LanguageSwitcher />
          {ThemeButton}
          {LogoutButton}
        </div>
      </aside>

      {/* Mobile top bar */}
      <div
        className="admin-topbar-mobile"
        style={{
          display: "none",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "13px 16px",
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 0,
          zIndex: 60,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/smag-logo.png" alt="SmaG" style={{ height: 31, width: "auto", flexShrink: 0 }} />
          <span
            style={{
              fontFamily: "var(--font-jakarta)",
              fontSize: 15,
              fontWeight: 800,
              color: "var(--fg)",
            }}
          >
            {t("sidebar_title")}
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menyu"
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--surface-2)",
            color: "var(--fg)",
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            padding: 0,
          }}
        >
          {mobileOpen ? <CloseIcon size={18} color="var(--fg)" /> : <MenuIcon size={18} color="var(--fg)" />}
        </button>
      </div>

      {mobileOpen && (
        <div
          className="admin-topbar-mobile"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            padding: 14,
            background: "var(--surface)",
            borderBottom: "1px solid var(--border)",
            position: "sticky",
            top: 62,
            zIndex: 59,
          }}
        >
          {NavList}
          <div
            style={{
              borderTop: "1px solid var(--border)",
              marginTop: 8,
              paddingTop: 10,
              display: "flex",
              flexDirection: "column",
              gap: 7,
            }}
          >
            <LanguageSwitcher />
            {ThemeButton}
            {LogoutButton}
          </div>
        </div>
      )}

      <style>{`
        .nav-item:hover { background: var(--surface-2) !important; }
        @media (max-width: 860px) {
          .admin-sidebar-desktop { display: none !important; }
          .admin-topbar-mobile { display: flex !important; }
        }
      `}</style>
    </>
  );
}
