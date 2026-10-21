"use client";

import { useLanguage } from "@/lib/i18n";

type OrderStatus = "yangi_mijoz" | "tolov_otkazildi" | "yetkazib_berishda" | "yetkazib_berildi";

interface Order {
  _id: string;
  customerPhone: string;
  customerAddress: string;
  products: Array<{ productId: string; productName: string; quantity: number; price: number }>;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
}

interface Customer {
  _id: string;
  name: string;
  phone: string;
  username?: string;
  type: "individual" | "shop" | "admin";
  shopName?: string;
  address?: string;
  createdAt: string;
}

interface Props {
  customer: Customer;
  orders: Order[];
  onClose: () => void;
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  yangi_mijoz: "#3b82f6",
  tolov_otkazildi: "#22c55e",
  yetkazib_berishda: "#f59e0b",
  yetkazib_berildi: "#10b981",
};

export function CustomerDetailModal({ customer, orders, onClose }: Props) {
  const { t } = useLanguage();

  const statusLabel = (s: OrderStatus) =>
    ({
      yangi_mijoz: t("status_new"),
      tolov_otkazildi: t("status_paid"),
      yetkazib_berishda: t("status_delivering"),
      yetkazib_berildi: t("status_delivered"),
    }[s]);

  const formatCurrency = (n: number) => new Intl.NumberFormat("uz-UZ").format(n);
  const UZ_MONTHS = ["yanvar","fevral","mart","aprel","may","iyun","iyul","avgust","sentabr","oktabr","noyabr","dekabr"];
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const formatDate = (d: string) => {
    const dt = new Date(d);
    return `${dt.getDate()}-${UZ_MONTHS[dt.getMonth()]}, ${dt.getFullYear()} · ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
  };
  const formatShortDate = (d: string) => {
    const dt = new Date(d);
    return `${dt.getDate()}-${UZ_MONTHS[dt.getMonth()]}, ${dt.getFullYear()}`;
  };

  const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const sortedOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
        zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface)", borderRadius: 24, width: "100%", maxWidth: 620,
          maxHeight: "88vh", overflowY: "auto", padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span
              style={{
                width: 48, height: 48, borderRadius: "50%", background: "var(--accent)", color: "#fff",
                display: "grid", placeItems: "center", fontSize: 18, fontWeight: 800, flexShrink: 0,
              }}
            >
              {customer.name.charAt(0).toUpperCase()}
            </span>
            <div>
              <h2 style={{ fontFamily: "var(--font-jakarta)", fontSize: 20, fontWeight: 800, color: "var(--fg)" }}>
                {customer.name}
              </h2>
              <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>
                {t("customers_registered_on")} {formatShortDate(customer.createdAt)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--border)", cursor: "pointer", fontSize: 16, color: "var(--muted)", flexShrink: 0 }}
          >
            ✕
          </button>
        </div>

        {/* Contact + type */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20, padding: "14px 16px", background: "var(--surface-2)", borderRadius: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 14, color: "var(--fg)" }}>
              📞 <a href={`tel:${customer.phone}`} style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 700 }}>{customer.phone}</a>
            </div>
            <span
              style={{
                fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 10,
                background: customer.type === "shop" ? "rgba(234,179,8,0.15)" : "rgba(59,130,246,0.15)",
                color: customer.type === "shop" ? "var(--amber)" : "var(--blue)",
              }}
            >
              {customer.type === "shop" ? `🏪 ${t("badge_shop")}` : `👤 ${t("badge_individual")}`}
            </span>
          </div>
          {customer.shopName && (
            <div style={{ fontSize: 14, color: "var(--fg)" }}>🏷️ {customer.shopName}</div>
          )}
        </div>

        {/* Summary stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          <div style={{ padding: "14px 16px", borderRadius: 14, background: "var(--accent-bg)" }}>
            <div style={{ color: "var(--muted)", fontSize: 12 }}>{t("customer_total_orders")}</div>
            <div style={{ color: "var(--accent)", fontWeight: 800, fontSize: 20, fontFamily: "var(--font-jakarta)" }}>{orders.length}</div>
          </div>
          <div style={{ padding: "14px 16px", borderRadius: 14, background: "var(--surface-2)" }}>
            <div style={{ color: "var(--muted)", fontSize: 12 }}>{t("customer_total_spent")}</div>
            <div style={{ color: "var(--fg)", fontWeight: 800, fontSize: 20, fontFamily: "var(--font-jakarta)" }}>{formatCurrency(totalSpent)} so&apos;m</div>
          </div>
        </div>

        {/* Orders list */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            {t("customer_orders_title")}
          </p>

          {sortedOrders.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 14, padding: "16px 0" }}>{t("customer_orders_empty")}</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sortedOrders.map((o) => (
                <div key={o._id} style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{formatDate(o.createdAt)}</span>
                    <span
                      style={{
                        fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 10,
                        background: `${STATUS_COLORS[o.status]}20`, color: STATUS_COLORS[o.status],
                      }}
                    >
                      {statusLabel(o.status)}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
                    {o.products.map((p, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: "var(--fg)" }}>
                        <span>{p.productName} × {p.quantity}</span>
                        <span style={{ fontWeight: 600 }}>{formatCurrency(p.price * p.quantity)} so&apos;m</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 12.5, color: "var(--muted)" }}>📍 {o.customerAddress.slice(0, 50)}{o.customerAddress.length > 50 ? "..." : ""}</span>
                    <span style={{ fontWeight: 800, color: "var(--fg)", fontSize: 14 }}>{formatCurrency(o.totalAmount)} so&apos;m</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
