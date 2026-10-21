"use client";

import dynamic from "next/dynamic";
import { useLanguage } from "@/lib/i18n";

const ViewLocationMap = dynamic(() => import("./ViewLocationMap").then((m) => m.ViewLocationMap), {
  ssr: false,
  loading: () => (
    <div style={{ height: 260, background: "var(--surface-2)", borderRadius: 14, display: "grid", placeItems: "center", color: "var(--muted)", fontSize: 14 }}>
      ...
    </div>
  ),
});

type OrderStatus = "yangi_mijoz" | "tolov_otkazildi" | "yetkazib_berishda" | "yetkazib_berildi";

interface Order {
  _id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerLat?: number;
  customerLng?: number;
  customerType: "individual" | "shop";
  products: Array<{ productId: string; productName: string; quantity: number; price: number }>;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod?: "cash" | "card" | "online";
  notes?: string;
  createdAt: string;
}

interface Props {
  order: Order;
  onClose: () => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
}

export function OrderDetailModal({ order, onClose, onStatusChange }: Props) {
  const { t } = useLanguage();
  const STAGES: { id: OrderStatus; label: string; icon: string; color: string }[] = [
    { id: "yangi_mijoz", label: t("status_new"), icon: "🆕", color: "#3b82f6" },
    { id: "tolov_otkazildi", label: t("status_paid"), icon: "💰", color: "#22c55e" },
    { id: "yetkazib_berishda", label: t("status_delivering"), icon: "🚚", color: "#f59e0b" },
    { id: "yetkazib_berildi", label: t("status_delivered"), icon: "✅", color: "#10b981" },
  ];
  const formatCurrency = (n: number) => new Intl.NumberFormat("uz-UZ").format(n);
  const UZ_MONTHS = ["yanvar","fevral","mart","aprel","may","iyun","iyul","avgust","sentabr","oktabr","noyabr","dekabr"];
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const formatDate = (d: string) => {
    const dt = new Date(d);
    return `${dt.getDate()}-${UZ_MONTHS[dt.getMonth()]}, ${dt.getFullYear()} · ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
  };

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
          background: "var(--surface)", borderRadius: 24, width: "100%", maxWidth: 560,
          maxHeight: "90vh", overflowY: "auto", padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
              {t("detail_label")}
            </p>
            <h2 style={{ fontFamily: "var(--font-jakarta)", fontSize: 20, fontWeight: 800, color: "var(--fg)" }}>
              {order.customerName}
            </h2>
            <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>{formatDate(order.createdAt)}</p>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--border)", cursor: "pointer", fontSize: 16, color: "var(--muted)" }}
          >
            ✕
          </button>
        </div>

        {/* Contact */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
          <div style={{ fontSize: 14, color: "var(--fg)" }}>
            📞 <a href={`tel:${order.customerPhone}`} style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>{order.customerPhone}</a>
          </div>
          <div style={{ fontSize: 14, color: "var(--fg)" }}>
            {order.customerType === "shop" ? `🏪 ${t("badge_shop")}` : `👤 ${t("badge_individual")}`}
          </div>
          <div style={{ fontSize: 14, color: "var(--muted)" }}>
            📍 {order.customerAddress}
          </div>
        </div>

        {/* Map */}
        {order.customerLat != null && order.customerLng != null ? (
          <div style={{ marginBottom: 18 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
              {t("detail_address_title")}
            </p>
            <ViewLocationMap lat={order.customerLat} lng={order.customerLng} />
          </div>
        ) : (
          <div style={{ marginBottom: 18, padding: "14px 16px", borderRadius: 12, background: "var(--surface-2)", color: "var(--muted)", fontSize: 13 }}>
            {t("detail_no_coords")}
          </div>
        )}

        {/* Products */}
        <div style={{ marginBottom: 18 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            {t("detail_products")}
          </p>
          <div style={{ background: "var(--surface-2)", borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {order.products.map((p, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--fg)" }}>
                <span>{p.productName} × {p.quantity}</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(p.price * p.quantity)} so&apos;m</span>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderRadius: 14, background: "var(--accent-bg)", marginBottom: 20 }}>
          <span style={{ color: "var(--muted)", fontSize: 14 }}>{t("detail_total")}</span>
          <span style={{ color: "var(--accent)", fontWeight: 800, fontSize: 18 }}>{formatCurrency(order.totalAmount)} so&apos;m</span>
        </div>

        {/* Status change */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            {t("detail_change_status")}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {STAGES.map((s) => (
              <button
                key={s.id}
                onClick={() => onStatusChange(order._id, s.id)}
                style={{
                  padding: "10px", borderRadius: 12, cursor: "pointer", fontSize: 13, fontWeight: 700,
                  border: `2px solid ${order.status === s.id ? s.color : "var(--border)"}`,
                  background: order.status === s.id ? `${s.color}20` : "var(--surface-2)",
                  color: order.status === s.id ? s.color : "var(--muted)",
                }}
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
