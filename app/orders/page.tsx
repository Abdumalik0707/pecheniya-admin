"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { OrderDetailModal } from "@/components/OrderDetailModal";
import { NewOrderModal } from "@/components/NewOrderModal";
import { useLanguage } from "@/lib/i18n";
import { AdminSidebar } from "@/components/AdminSidebar";
import {
  SparkleIcon,
  BoxIcon,
  WalletIcon,
  TruckIcon,
  CheckCircleIcon,
  KanbanIcon,
  ListIcon,
  DownloadIcon,
  SpinnerIcon,
  PhoneIcon,
  MapPinIcon,
  StoreIcon,
  UserIcon,
  CashIcon,
  CardIcon,
  GlobeIcon,
  PlusIcon,
} from "@/components/Icons";
import { apiFetch } from "@/lib/api";

type OrderStatus =
  | "yangi_mijoz"
  | "tolov_otkazildi"
  | "yetkazib_berishda"
  | "yetkazib_berildi";

type ViewMode = "kanban" | "list";

interface Order {
  _id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerLat?: number;
  customerLng?: number;
  customerType: "individual" | "shop";
  products: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod?: "cash" | "card" | "online";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const UZ_MONTHS_SHORT = ["yan","fev","mar","apr","may","iyn","iyl","avg","sen","okt","noy","dek"];
const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("uz-UZ").format(amount);
}
function formatDateShort(dateString: string) {
  const dt = new Date(dateString);
  return `${dt.getDate()} ${UZ_MONTHS_SHORT[dt.getMonth()]} ${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
}
function formatDateFull(dateString: string) {
  const dt = new Date(dateString);
  return `${dt.getDate()} ${UZ_MONTHS_SHORT[dt.getMonth()]} ${dt.getFullYear()} · ${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  yangi_mijoz: "#3b82f6",
  tolov_otkazildi: "#22c55e",
  yetkazib_berishda: "#f59e0b",
  yetkazib_berildi: "#10b981",
};
type IconComponent = React.ComponentType<{ size?: number; color?: string }>;

const STATUS_ICONS: Record<OrderStatus, IconComponent> = {
  yangi_mijoz: SparkleIcon,
  tolov_otkazildi: WalletIcon,
  yetkazib_berishda: TruckIcon,
  yetkazib_berildi: CheckCircleIcon,
};

export default function OrdersPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const STAGES: { id: OrderStatus; label: string }[] = [
    { id: "yangi_mijoz", label: t("status_new") },
    { id: "tolov_otkazildi", label: t("status_paid") },
    { id: "yetkazib_berishda", label: t("status_delivering") },
    { id: "yetkazib_berildi", label: t("status_delivered") },
  ];

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [draggedOrder, setDraggedOrder] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [view, setView] = useState<ViewMode>("kanban");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [products, setProducts] = useState<Array<{ _id: string; name: string; price: number; shopPrice?: number; unit: string; image: string; categoryLabel: string }>>([]);

  useEffect(() => {
    setMounted(true);
    const u = localStorage.getItem("pecheniya_admin");
    if (!u) {
      router.push("/login");
      return;
    }
    const admin = JSON.parse(u);
    if (admin.type !== "admin" && !admin.isAdmin) {
      router.push("/login");
      return;
    }
    const savedView = localStorage.getItem("pecheniya_orders_view");
    if (savedView === "list" || savedView === "kanban") setView(savedView);
    fetchOrders();
    fetchProducts();
  }, [router]);

  const fetchProducts = async () => {
    try {
      const res = await apiFetch("/api/products");
      const data = await res.json();
      if (data.success) setProducts(data.products);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await apiFetch("/api/orders");
      const data = await res.json();
      if (data.success) setOrders(data.orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await apiFetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const handleDragStart = (orderId: string) => setDraggedOrder(orderId);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent, newStatus: OrderStatus) => {
    e.preventDefault();
    if (draggedOrder) {
      updateOrderStatus(draggedOrder, newStatus);
      setDraggedOrder(null);
    }
  };
  const getOrdersByStatus = (status: OrderStatus) =>
    orders.filter((o) => o.status === status);

  function switchView(v: ViewMode) {
    setView(v);
    localStorage.setItem("pecheniya_orders_view", v);
  }

  function toggleOne(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    if (checked.size === orders.length) setChecked(new Set());
    else setChecked(new Set(orders.map((o) => o._id)));
  }
  function clearSelection() {
    setChecked(new Set());
  }

  const allChecked = useMemo(
    () => orders.length > 0 && checked.size === orders.length,
    [checked, orders]
  );

  async function exportSelected() {
    if (!checked.size) return;
    setExporting(true);
    try {
      const res = await apiFetch("/api/orders/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(checked) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Xatolik" }));
        alert(data.error || "Yuklab olishda xatolik");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      // Pull filename from content-disposition if present
      const cd = res.headers.get("content-disposition") || "";
      const m = /filename\*=UTF-8''([^;]+)/i.exec(cd);
      a.href = url;
      a.download = m ? decodeURIComponent(m[1]) : "SmaG-orders.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("export error", err);
      alert("Serverga ulanishda xatolik");
    } finally {
      setExporting(false);
    }
  }

  function statusLabel(s: OrderStatus) {
    return s === "yangi_mijoz"
      ? t("status_new")
      : s === "tolov_otkazildi"
      ? t("status_paid")
      : s === "yetkazib_berishda"
      ? t("status_delivering")
      : t("status_delivered");
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "var(--bg)" }}>
        <div style={{ color: "var(--muted)", fontSize: 16 }}>{t("loading")}</div>
      </div>
    );
  }

  return (
    <div className="admin-shell" style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <AdminSidebar active="orders" mounted={mounted} />

      <main className="orders-page admin-main" style={{ flex: 1, padding: "28px 32px", overflowX: "hidden", minWidth: 0 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ fontFamily: "var(--font-jakarta)", fontSize: 24, fontWeight: 800, color: "var(--fg)", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 36, height: 36, borderRadius: 11, background: "var(--accent-bg)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <BoxIcon size={20} color="var(--accent)" />
              </span>
              {t("orders_title")}
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setShowNewOrder(true)}
              style={{
                display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 12,
                border: "none", background: "var(--accent)", color: "#fff", fontWeight: 700, fontSize: 13.5,
                cursor: "pointer",
              }}
            >
              <PlusIcon size={15} color="#fff" />
              Yangi buyurtma
            </button>
          </div>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>{t("orders_subtitle")}</p>
      </div>

      {/* Toolbar: view switch + bulk actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 6, padding: 4, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}>
          {(["kanban", "list"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => switchView(v)}
              style={{
                padding: "7px 16px",
                borderRadius: 9,
                border: "none",
                background: view === v ? "var(--accent)" : "transparent",
                color: view === v ? "#fff" : "var(--muted)",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {v === "kanban" ? (
                <KanbanIcon size={15} color={view === v ? "#fff" : "var(--muted)"} />
              ) : (
                <ListIcon size={15} color={view === v ? "#fff" : "var(--muted)"} />
              )}
              {v === "kanban" ? t("view_kanban") : t("view_list")}
            </button>
          ))}
        </div>

        {view === "list" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {checked.size > 0 && (
              <>
                <span style={{ fontSize: 13.5, color: "var(--muted)" }}>
                  <strong style={{ color: "var(--fg)" }}>{checked.size}</strong> {t("export_selected")}
                </span>
                <button
                  onClick={clearSelection}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    color: "var(--muted)",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {t("export_clear")}
                </button>
                <button
                  onClick={exportSelected}
                  disabled={exporting}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 10,
                    border: "none",
                    background: "var(--accent)",
                    color: "#fff",
                    fontSize: 13.5,
                    fontWeight: 700,
                    cursor: exporting ? "not-allowed" : "pointer",
                    opacity: exporting ? 0.7 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {exporting ? <SpinnerIcon size={15} color="#fff" /> : <DownloadIcon size={15} color="#fff" />}
                  {t("export_excel")}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {view === "kanban" ? (
        <div
          className="kanban-grid"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}
        >
          {STAGES.map((stage) => {
            const stageOrders = getOrdersByStatus(stage.id);
            const color = STATUS_COLORS[stage.id];
            return (
              <div
                key={stage.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
                style={{
                  background: "var(--surface)",
                  border: "2px solid var(--border)",
                  borderRadius: 16,
                  padding: 16,
                  minHeight: "calc(100vh - 240px)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 16,
                    paddingBottom: 12,
                    borderBottom: `2px solid ${color}30`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ width: 30, height: 30, borderRadius: 9, background: `${color}1a`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                      {(() => { const Icon = STATUS_ICONS[stage.id]; return <Icon size={17} color={color} />; })()}
                    </span>
                    <span style={{ fontFamily: "var(--font-jakarta)", fontSize: 15, fontWeight: 700, color: "var(--fg)" }}>
                      {stage.label}
                    </span>
                  </div>
                  <span style={{ padding: "4px 10px", borderRadius: 12, background: `${color}20`, color, fontSize: 12, fontWeight: 700 }}>
                    {stageOrders.length}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {stageOrders.map((order) => (
                    <div
                      key={order._id}
                      draggable
                      onDragStart={() => handleDragStart(order._id)}
                      onClick={() => setSelectedOrder(order)}
                      style={{
                        background: "var(--bg)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        padding: 14,
                        cursor: "grab",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = `0 4px 12px ${color}30`;
                        e.currentTarget.style.borderColor = color;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.style.borderColor = "var(--border)";
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 4 }}>
                            {order.customerName}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 5 }}>
                            <PhoneIcon size={12} color="var(--muted)" />
                            {order.customerPhone}
                          </div>
                        </div>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: 8,
                            fontSize: 10,
                            fontWeight: 700,
                            background: order.customerType === "shop" ? "#f59e0b20" : "#3b82f620",
                            color: order.customerType === "shop" ? "#f59e0b" : "#3b82f6",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {order.customerType === "shop" ? (
                            <><StoreIcon size={11} color="#f59e0b" />{t("badge_shop")}</>
                          ) : (
                            <><UserIcon size={11} color="#3b82f6" />{t("badge_customer")}</>
                          )}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                        <span style={{ flexShrink: 0, marginTop: 1 }}>
                          <MapPinIcon size={12} color="var(--muted)" />
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            color: "var(--muted)",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {order.customerAddress}
                        </span>
                      </div>

                      <div style={{ background: "var(--surface-2)", borderRadius: 8, padding: 8, marginBottom: 12 }}>
                        {order.products.slice(0, 2).map((p, idx) => (
                          <div
                            key={idx}
                            style={{ fontSize: 12, color: "var(--fg)", marginBottom: idx < order.products.length - 1 ? 4 : 0 }}
                          >
                            • {p.productName} × {p.quantity}
                          </div>
                        ))}
                        {order.products.length > 2 && (
                          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                            +{order.products.length - 2} ta yana...
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          paddingTop: 12,
                          borderTop: "1px solid var(--border)",
                        }}
                      >
                        <div style={{ fontSize: 15, fontWeight: 800, color, fontFamily: "var(--font-jakarta)" }}>
                          {formatCurrency(order.totalAmount)} so&apos;m
                        </div>
                        <div style={{ fontSize: 11, color: "var(--muted-2)" }}>{formatDateShort(order.createdAt)}</div>
                      </div>

                      {order.paymentMethod && (
                        <div style={{ marginTop: 8 }}>
                          <span style={{ fontSize: 10.5, padding: "4px 9px", borderRadius: 7, background: "var(--surface-2)", color: "var(--muted)", display: "inline-flex", alignItems: "center", gap: 5 }}>
                            {order.paymentMethod === "cash" ? (
                              <><CashIcon size={11} color="var(--muted)" />{t("pay_cash")}</>
                            ) : order.paymentMethod === "card" ? (
                              <><CardIcon size={11} color="var(--muted)" />{t("pay_card")}</>
                            ) : (
                              <><GlobeIcon size={11} color="var(--muted)" />{t("pay_online")}</>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}

                  {stageOrders.length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)", fontSize: 13 }}>
                      {t("empty_column")}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 20,
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            {orders.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: "var(--muted)" }}>{t("orders_empty")}</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ background: "var(--surface-2)" }}>
                    <th style={thStyle(44)}>
                      <input
                        type="checkbox"
                        checked={allChecked}
                        ref={(el) => {
                          if (el) el.indeterminate = checked.size > 0 && !allChecked;
                        }}
                        onChange={toggleAll}
                        aria-label={t("export_select_all")}
                        style={{ cursor: "pointer", width: 16, height: 16 }}
                      />
                    </th>
                    <th style={thStyle()}>{t("th_order_date")}</th>
                    <th style={thStyle()}>{t("th_customer")}</th>
                    <th style={thStyle()}>{t("th_phone")}</th>
                    <th style={thStyle()}>{t("th_address")}</th>
                    <th style={thStyle()}>{t("th_products_count")}</th>
                    <th style={thStyle()}>{t("th_total")}</th>
                    <th style={thStyle()}>{t("th_status_col")}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => {
                    const isChecked = checked.has(o._id);
                    const color = STATUS_COLORS[o.status];
                    return (
                      <tr
                        key={o._id}
                        onClick={() => setSelectedOrder(o)}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        style={{
                          borderBottom: "1px solid var(--border)",
                          cursor: "pointer",
                          background: isChecked ? "var(--accent-bg)" : "transparent",
                        }}
                      >
                        <td
                          style={{ padding: "12px 14px", width: 44 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleOne(o._id);
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleOne(o._id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ cursor: "pointer", width: 16, height: 16 }}
                          />
                        </td>
                        <td style={tdStyle({ color: "var(--muted)", fontSize: 12.5 })}>
                          {formatDateFull(o.createdAt)}
                        </td>
                        <td style={tdStyle({ fontWeight: 600 })}>
                          <div>{o.customerName}</div>
                          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                            {o.customerType === "shop" ? (
                              <><StoreIcon size={11} color="var(--amber)" />{t("badge_shop")}</>
                            ) : (
                              <><UserIcon size={11} color="var(--blue)" />{t("badge_customer")}</>
                            )}
                          </div>
                        </td>
                        <td style={tdStyle({ color: "var(--fg)" })}>{o.customerPhone}</td>
                        <td style={tdStyle({ color: "var(--muted)", maxWidth: 240 })}>
                          <div
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {o.customerAddress}
                          </div>
                        </td>
                        <td style={tdStyle({})}>
                          <div style={{ fontWeight: 600 }}>{o.products.length} ta</div>
                          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                            {o.products[0]?.productName}
                            {o.products.length > 1 ? ` +${o.products.length - 1}` : ""}
                          </div>
                        </td>
                        <td style={tdStyle({ fontWeight: 700, color: "var(--fg)" })}>
                          {formatCurrency(o.totalAmount)} so&apos;m
                        </td>
                        <td style={tdStyle({})}>
                          <span
                            style={{
                              fontSize: 11.5,
                              fontWeight: 700,
                              padding: "4px 10px",
                              borderRadius: 10,
                              background: `${color}20`,
                              color,
                              whiteSpace: "nowrap",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            {(() => { const Icon = STATUS_ICONS[o.status]; return <Icon size={12} color={color} />; })()}
                            {statusLabel(o.status)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={(id, status) => {
            updateOrderStatus(id, status);
            setSelectedOrder(null);
          }}
        />
      )}

      {showNewOrder && (
        <NewOrderModal
          products={products}
          onClose={() => setShowNewOrder(false)}
          onCreated={fetchOrders}
        />
      )}

      </main>

      <style>{`
        @media (max-width: 860px) {
          .admin-shell { flex-direction: column; }
        }
        @media (max-width: 700px) {
          .orders-page { padding: 16px !important; }
          .kanban-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function thStyle(width?: number): React.CSSProperties {
  return {
    padding: "12px 14px",
    textAlign: "left",
    fontSize: 11,
    fontWeight: 700,
    color: "var(--muted)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    borderBottom: "1px solid var(--border)",
    width,
    whiteSpace: "nowrap",
  };
}
function tdStyle(extra: React.CSSProperties): React.CSSProperties {
  return {
    padding: "12px 14px",
    color: "var(--fg)",
    verticalAlign: "top",
    ...extra,
  };
}
