"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useLanguage } from "@/lib/i18n";

type Period = "daily" | "weekly" | "monthly";
type OrderStatus = "yangi_mijoz" | "tolov_otkazildi" | "yetkazib_berishda" | "yetkazib_berildi";

interface Order {
  _id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerType: "individual" | "shop";
  products: Array<{ productId: string; productName: string; quantity: number; price: number }>;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
}

function fmt(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(0) + "K";
  return n.toString();
}

function periodStart(period: Period): Date {
  const now = new Date();
  if (period === "daily") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (period === "weekly") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  const d = new Date(now);
  d.setDate(d.getDate() - 30);
  return d;
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  yangi_mijoz: "#3b82f6",
  tolov_otkazildi: "#22c55e",
  yetkazib_berishda: "#f59e0b",
  yetkazib_berildi: "#10b981",
};

export default function AdminDashboard() {
  const router = useRouter();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [period, setPeriod] = useState<Period>("weekly");
  const [activeTab, setActiveTab] = useState<"all" | "individual" | "shop">("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    const u = localStorage.getItem("pecheniya_admin");
    if (!u) { router.push("/login"); return; }
    const admin = JSON.parse(u);
    if (admin.type !== "admin" && !admin.isAdmin) { router.push("/login"); return; }
    fetchOrders();
  }, [router]);

  async function fetchOrders() {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.success) setOrders(data.orders);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }

  const periodOrders = useMemo(() => {
    const start = periodStart(period);
    return orders.filter((o) => new Date(o.createdAt) >= start);
  }, [orders, period]);

  const stats = useMemo(() => {
    const revenue = periodOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const individual = periodOrders.filter((o) => o.customerType === "individual").length;
    const shop = periodOrders.filter((o) => o.customerType === "shop").length;
    return { orders: periodOrders.length, revenue, individual, shop };
  }, [periodOrders]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; count: number; revenue: number }>();
    for (const o of periodOrders) {
      for (const p of o.products || []) {
        const existing = map.get(p.productName) || { name: p.productName, count: 0, revenue: 0 };
        existing.count += p.quantity;
        existing.revenue += p.quantity * p.price;
        map.set(p.productName, existing);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [periodOrders]);

  const filteredOrders = useMemo(() => {
    const base = activeTab === "all" ? orders : orders.filter((o) => o.customerType === activeTab);
    return base.slice(0, 15);
  }, [orders, activeTab]);

  const UZ_MONTHS_SHORT = ["yan","fev","mar","apr","may","iyn","iyl","avg","sen","okt","noy","dek"];
  const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const formatDate = (dateString: string) => {
    const dt = new Date(dateString);
    return `${dt.getDate()} ${UZ_MONTHS_SHORT[dt.getMonth()]} ${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
  };

  const statusLabel = (s: OrderStatus) =>
    ({ yangi_mijoz: t("status_new"), tolov_otkazildi: t("status_paid"), yetkazib_berishda: t("status_delivering"), yetkazib_berildi: t("status_delivered") }[s]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--muted)", fontSize: 16 }}>{t("loading")}</div>
      </div>
    );
  }

  return (
    <div className="admin-shell" style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <AdminSidebar active="dashboard" mounted={mounted} />

      {/* Main */}
      <main className="admin-main" style={{ flex: 1, padding: "28px 32px", overflowX: "hidden", minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-jakarta)", fontSize: 24, fontWeight: 800, color: "var(--fg)" }}>{t("dashboard_title")}</h1>
            <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 2 }}>{t("dashboard_subtitle")}</p>
          </div>

          <div style={{ display: "flex", gap: 6, background: "var(--surface-2)", padding: 4, borderRadius: 14, border: "1px solid var(--border)" }}>
            {[["daily", t("period_daily")], ["weekly", t("period_weekly")], ["monthly", t("period_monthly")]].map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => setPeriod(val as Period)}
                style={{
                  padding: "7px 16px", borderRadius: 10, border: "none",
                  background: period === val ? "var(--accent)" : "transparent",
                  color: period === val ? "#fff" : "var(--muted)",
                  fontWeight: 600, fontSize: 13, cursor: "pointer",
                }}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
          {[
            ["📦", t("stat_orders"), stats.orders, "", "var(--accent)"],
            ["💰", t("stat_revenue"), fmt(stats.revenue), " so'm", "var(--green)"],
            ["👤", t("stat_individual"), stats.individual, " ta", "var(--blue)"],
            ["🏪", t("stat_shop"), stats.shop, " ta", "var(--amber)"],
          ].map(([icon, lbl, val, suffix, color]) => (
            <div key={lbl as string} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "20px 22px" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}20`, display: "grid", placeItems: "center", fontSize: 18, marginBottom: 12 }}>
                {icon as string}
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: color as string, fontFamily: "var(--font-jakarta)" }}>
                {val as string | number}{suffix as string}
              </div>
              <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>{lbl as string}</div>
            </div>
          ))}
        </div>

        {/* Top products */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "24px", marginBottom: 24 }}>
          <h3 style={{ fontFamily: "var(--font-jakarta)", fontSize: 16, fontWeight: 700, color: "var(--fg)", marginBottom: 16 }}>
            {t("top_products_title")}
          </h3>
          {topProducts.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 14 }}>{t("top_products_empty")}</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {topProducts.map((p, i) => (
                <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ color: "var(--muted)", fontSize: 13, width: 20, textAlign: "center" }}>{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 14, color: "var(--fg)", fontWeight: 500 }}>{p.name}</span>
                      <span style={{ fontSize: 13, color: "var(--muted)" }}>{p.count} ta · {fmt(p.revenue)} so&apos;m</span>
                    </div>
                    <div style={{ height: 5, background: "var(--surface-2)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(p.count / topProducts[0].count) * 100}%`, background: "var(--accent)", borderRadius: 4 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Orders table */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "24px", overflowX: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <h3 style={{ fontFamily: "var(--font-jakarta)", fontSize: 16, fontWeight: 700, color: "var(--fg)" }}>
              {t("recent_orders_title")}
            </h3>
            <div style={{ display: "flex", gap: 6 }}>
              {[["all", t("filter_all")], ["individual", t("filter_individual")], ["shop", t("filter_shop")]].map(([val, lbl]) => (
                <button
                  key={val}
                  onClick={() => setActiveTab(val as "all" | "individual" | "shop")}
                  style={{
                    padding: "5px 14px", borderRadius: 12,
                    border: `1px solid ${activeTab === val ? "var(--accent)" : "var(--border)"}`,
                    background: activeTab === val ? "var(--accent-bg)" : "transparent",
                    color: activeTab === val ? "var(--accent-text)" : "var(--muted)",
                    fontWeight: 600, fontSize: 12, cursor: "pointer",
                  }}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 14, padding: "20px 0" }}>{t("recent_orders_empty")}</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr>
                  {[t("th_customer"), t("th_type"), t("th_product"), t("th_amount"), t("th_date"), t("th_status")].map((h) => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "var(--muted)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => (
                  <tr key={o._id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 12px", color: "var(--fg)", fontWeight: 500 }}>
                      {o.customerName}
                      <div style={{ color: "var(--muted)", fontSize: 11 }}>{o.customerPhone}</div>
                    </td>
                    <td style={{ padding: "12px 12px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 10, background: o.customerType === "shop" ? "rgba(234,179,8,0.15)" : "rgba(59,130,246,0.15)", color: o.customerType === "shop" ? "var(--amber)" : "var(--blue)" }}>
                        {o.customerType === "shop" ? t("badge_shop") : t("badge_customer")}
                      </span>
                    </td>
                    <td style={{ padding: "12px 12px", color: "var(--fg)" }}>
                      {o.products?.[0]?.productName}{o.products?.length > 1 ? ` +${o.products.length - 1}` : ""}
                    </td>
                    <td style={{ padding: "12px 12px", color: "var(--accent)", fontWeight: 700 }}>
                      {o.totalAmount.toLocaleString()}
                    </td>
                    <td style={{ padding: "12px 12px", color: "var(--muted)", fontSize: 12 }}>{formatDate(o.createdAt)}</td>
                    <td style={{ padding: "12px 12px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 10, background: `${STATUS_COLORS[o.status]}20`, color: STATUS_COLORS[o.status] }}>
                        {statusLabel(o.status) || o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      <style>{`
        @media (max-width: 860px) {
          .admin-shell { flex-direction: column; }
          .admin-main { padding: 18px !important; }
        }
      `}</style>
    </div>
  );
}
