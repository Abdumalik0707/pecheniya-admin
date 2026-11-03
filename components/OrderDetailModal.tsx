"use client";

import dynamic from "next/dynamic";
import { useLanguage } from "@/lib/i18n";
import {
  SparkleIcon,
  WalletIcon,
  TruckIcon,
  CheckCircleIcon,
  CloseIcon,
  PhoneIcon,
  MapPinIcon,
  StoreIcon,
  UserIcon,
  CashIcon,
  CardIcon,
} from "./Icons";

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
  receiptId?: string;
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
  const STAGES: {
    id: OrderStatus;
    label: string;
    Icon: React.ComponentType<{ size?: number; color?: string }>;
    color: string;
  }[] = [
    { id: "yangi_mijoz", label: t("status_new"), Icon: SparkleIcon, color: "#3b82f6" },
    { id: "tolov_otkazildi", label: t("status_paid"), Icon: WalletIcon, color: "#22c55e" },
    { id: "yetkazib_berishda", label: t("status_delivering"), Icon: TruckIcon, color: "#f59e0b" },
    { id: "yetkazib_berildi", label: t("status_delivered"), Icon: CheckCircleIcon, color: "#10b981" },
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
            style={{ width: 32, height: 32, borderRadius: 9, background: "var(--surface-2)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--muted)", display: "grid", placeItems: "center", padding: 0 }}
          >
            <CloseIcon size={16} color="var(--muted)" />
          </button>
        </div>

        {/* Contact */}
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 18 }}>
          <div style={{ fontSize: 14, color: "var(--fg)", display: "flex", alignItems: "center", gap: 9 }}>
            <PhoneIcon size={15} color="var(--muted)" />
            <a href={`tel:${order.customerPhone}`} style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>{order.customerPhone}</a>
          </div>
          <div style={{ fontSize: 14, color: "var(--fg)", display: "flex", alignItems: "center", gap: 9 }}>
            {order.customerType === "shop" ? (
              <><StoreIcon size={15} color="var(--amber)" />{t("badge_shop")}</>
            ) : (
              <><UserIcon size={15} color="var(--blue)" />{t("badge_individual")}</>
            )}
          </div>
          <div style={{ fontSize: 14, color: "var(--muted)", display: "flex", gap: 9 }}>
            <span style={{ flexShrink: 0, marginTop: 2 }}>
              <MapPinIcon size={15} color="var(--muted)" />
            </span>
            {order.customerAddress}
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

        {/* Payment */}
        <div style={{ marginBottom: 18 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            {t("detail_payment")}
          </p>
          <div style={{ background: "var(--surface-2)", borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--fg)", fontWeight: 600 }}>
              {order.paymentMethod === "card" ? (
                <><CardIcon size={16} color="var(--accent)" />{t("pay_card")}</>
              ) : order.paymentMethod === "cash" ? (
                <><CashIcon size={16} color="var(--green)" />{t("pay_cash")}</>
              ) : order.paymentMethod === "online" ? (
                <>{t("pay_online")}</>
              ) : (
                <span style={{ color: "var(--muted)", fontWeight: 500 }}>{t("detail_payment_unknown")}</span>
              )}
            </div>
            {order.receiptId ? (
              <a
                href={`/api/receipts/${order.receiptId}`}
                target="_blank"
                rel="noopener noreferrer"
                title={t("detail_receipt_open")}
                style={{ display: "block", borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)", background: "#fff" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/receipts/${order.receiptId}`}
                  alt={t("detail_receipt")}
                  style={{ display: "block", width: "100%", maxHeight: 320, objectFit: "contain" }}
                />
                <span style={{ display: "block", padding: "8px 10px", fontSize: 12, fontWeight: 600, color: "var(--accent)", background: "var(--surface)" }}>
                  {t("detail_receipt")} — {t("detail_receipt_open")} ↗
                </span>
              </a>
            ) : order.paymentMethod === "card" ? (
              <span style={{ fontSize: 12.5, color: "var(--amber)" }}>{t("detail_receipt_missing")}</span>
            ) : null}
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
                  padding: "11px 10px", borderRadius: 12, cursor: "pointer", fontSize: 13, fontWeight: 700,
                  border: `2px solid ${order.status === s.id ? s.color : "var(--border)"}`,
                  background: order.status === s.id ? `${s.color}20` : "var(--surface-2)",
                  color: order.status === s.id ? s.color : "var(--muted)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                }}
              >
                <s.Icon size={15} color={order.status === s.id ? s.color : "var(--muted)"} />
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
