"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { CustomerDetailModal } from "@/components/CustomerDetailModal";

interface UserRow {
  _id: string;
  name: string;
  phone: string;
  username?: string;
  type: "individual" | "shop" | "admin";
  shopName?: string;
  address?: string;
  createdAt: string;
}

interface OrderRow {
  _id: string;
  customerPhone: string;
  customerAddress: string;
  products: Array<{ productId: string; productName: string; quantity: number; price: number }>;
  totalAmount: number;
  status: "yangi_mijoz" | "tolov_otkazildi" | "yetkazib_berishda" | "yetkazib_berildi";
  createdAt: string;
}

export default function CustomersPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "individual" | "shop">("all");
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<UserRow | null>(null);

  useEffect(() => {
    const u = localStorage.getItem("pecheniya_admin");
    if (!u) { router.push("/login"); return; }
    const admin = JSON.parse(u);
    if (admin.type !== "admin" && !admin.isAdmin) { router.push("/login"); return; }
    fetchUsers();
    fetchOrders();
  }, [router]);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOrders() {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.success) setOrders(data.orders);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  }

  function ordersFor(phone: string) {
    return orders.filter((o) => o.customerPhone === phone);
  }

  const normalizedSearch = search.trim().toLowerCase().replace(/\s/g, "");

  const filtered = users
    .filter((u) => u.type !== "admin")
    .filter((u) => (filter === "all" ? true : u.type === filter))
    .filter((u) =>
      normalizedSearch === ""
        ? true
        : u.name.toLowerCase().replace(/\s/g, "").includes(normalizedSearch) ||
          u.phone.toLowerCase().replace(/\s/g, "").includes(normalizedSearch)
    );

  const UZ_MONTHS = ["yanvar","fevral","mart","aprel","may","iyun","iyul","avgust","sentabr","oktabr","noyabr","dekabr"];
  const formatDate = (d: string) => {
    const dt = new Date(d);
    return `${dt.getDate()}-${UZ_MONTHS[dt.getMonth()]}, ${dt.getFullYear()}`;
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "var(--bg)" }}>
        <div style={{ color: "var(--muted)", fontSize: 16 }}>{t("loading")}</div>
      </div>
    );
  }

  return (
    <div className="customers-page" style={{ minHeight: "100vh", background: "var(--bg)", padding: "28px 32px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => router.push("/")}
              style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--muted)", cursor: "pointer", fontSize: 14 }}
            >
              ← {t("back")}
            </button>
            <h1 style={{ fontFamily: "var(--font-jakarta)", fontSize: 24, fontWeight: 800, color: "var(--fg)" }}>
              {t("customers_title")}
            </h1>
          </div>
          <LanguageSwitcher />
        </div>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>{t("customers_subtitle")}</p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ position: "relative", minWidth: 220 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--muted)" }}>
            🔍
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("customers_search_ph")}
            style={{
              width: "100%", height: 38, borderRadius: 12, border: "1px solid var(--border-strong)",
              background: "var(--surface)", padding: "0 14px 0 34px", fontSize: 13.5, color: "var(--fg)", outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[["all", `${t("filter_all")} (${users.filter(u => u.type !== "admin").length})`], ["individual", t("stat_individual")], ["shop", t("badge_shop")]].map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => setFilter(val as "all" | "individual" | "shop")}
              style={{
                padding: "7px 16px", borderRadius: 12,
                border: `1px solid ${filter === val ? "var(--accent)" : "var(--border)"}`,
                background: filter === val ? "var(--accent-bg)" : "var(--surface)",
                color: filter === val ? "var(--accent-text)" : "var(--muted)",
                fontWeight: 600, fontSize: 13, cursor: "pointer",
              }}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "24px", overflowX: "auto" }}>
        {filtered.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 14, padding: "20px 0" }}>
            {users.filter((u) => u.type !== "admin").length === 0 ? t("customers_empty") : t("customers_no_match")}
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr>
                {[t("th_name"), t("th_phone"), t("th_type"), t("th_shopname"), t("customer_orders_count"), t("th_registered")].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "var(--muted)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={u._id}
                  onClick={() => setSelectedCustomer(u)}
                  style={{ borderBottom: "1px solid var(--border)", cursor: "pointer" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-2)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <td style={{ padding: "12px 12px", color: "var(--fg)", fontWeight: 500 }}>{u.name}</td>
                  <td style={{ padding: "12px 12px", color: "var(--fg)" }}>{u.phone}</td>
                  <td style={{ padding: "12px 12px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 10, background: u.type === "shop" ? "rgba(234,179,8,0.15)" : "rgba(59,130,246,0.15)", color: u.type === "shop" ? "var(--amber)" : "var(--blue)" }}>
                      {u.type === "shop" ? t("badge_shop") : t("badge_customer")}
                    </span>
                  </td>
                  <td style={{ padding: "12px 12px", color: "var(--fg)" }}>{u.shopName || "—"}</td>
                  <td style={{ padding: "12px 12px", color: "var(--fg)", fontWeight: 600 }}>{ordersFor(u.phone).length}</td>
                  <td style={{ padding: "12px 12px", color: "var(--muted)", fontSize: 12 }}>{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          orders={ordersFor(selectedCustomer.phone)}
          onClose={() => setSelectedCustomer(null)}
        />
      )}

      <style>{`
        @media (max-width: 700px) {
          .customers-page { padding: 16px !important; }
        }
      `}</style>
    </div>
  );
}
