"use client";

import { priceFor } from "@/lib/pricing";
import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  CloseIcon,
  SearchIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
  StoreIcon,
  MapPinIcon,
  CashIcon,
  CardIcon,
  GlobeIcon,
  AlertIcon,
  SpinnerIcon,
} from "@/components/Icons";
import { apiFetch } from "@/lib/api";

const LocationMap = dynamic(() => import("./LocationMap").then((m) => m.LocationMap), {
  ssr: false,
  loading: () => (
    <div style={{ height: 240, background: "var(--surface-2)", borderRadius: 14, display: "grid", placeItems: "center", color: "var(--muted)", fontSize: 13 }}>
      Xarita yuklanmoqda...
    </div>
  ),
});

interface Product {
  _id: string;
  name: string;
  price: number;
  shopPrice?: number;
  unit: string;
  image: string;
  categoryLabel: string;
}

interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

type OrderStatus = "yangi_mijoz" | "tolov_otkazildi" | "yetkazib_berishda" | "yetkazib_berildi";

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "yangi_mijoz", label: "Yangi mijoz" },
  { value: "tolov_otkazildi", label: "To'lov o'tkazildi" },
  { value: "yetkazib_berishda", label: "Yetkazib berishda" },
  { value: "yetkazib_berildi", label: "Yetkazib berildi" },
];

export function NewOrderModal({
  products,
  onClose,
  onCreated,
}: {
  products: Product[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [customerType, setCustomerType] = useState<"individual" | "shop">("individual");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(false);

  const [productQuery, setProductQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "online">("cash");
  const [status, setStatus] = useState<OrderStatus>("yangi_mijoz");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return products.slice(0, 8);
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [productQuery, products]);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  function addProduct(p: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === p._id);
      if (existing) {
        return prev.map((i) => (i.productId === p._id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { productId: p._id, productName: p.name, price: priceFor(p, customerType), quantity: 1 }];
    });
  }

  function changeQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i))
        .filter((i) => i.quantity > 0)
    );
  }

  function removeItem(productId: string) {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }

  async function handleSubmit() {
    setError("");

    if (!customerName.trim() || !customerPhone.trim()) {
      setError("Ism va telefon raqamini kiriting");
      return;
    }
    if (!address.trim()) {
      setError("Manzilni kiriting yoki xaritadan tanlang");
      return;
    }
    if (cart.length === 0) {
      setError("Kamida bitta mahsulot qo'shing");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerAddress: address.trim(),
          customerLat: location?.lat,
          customerLng: location?.lng,
          customerType,
          products: cart.map((i) => ({
            productId: i.productId,
            productName: i.productName,
            quantity: i.quantity,
            price: i.price,
          })),
          totalAmount: total,
          status,
          paymentMethod,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Buyurtma yaratilmadi");
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Server bilan bog'lanishda xatolik");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(6px)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface)",
          borderRadius: 24,
          width: "100%",
          maxWidth: 640,
          maxHeight: "92vh",
          overflowY: "auto",
          padding: "26px 26px 30px",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ fontFamily: "var(--font-jakarta)", fontSize: 20, fontWeight: 800, color: "var(--fg)" }}>
            Yangi buyurtma
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 34, height: 34, borderRadius: 10, background: "var(--surface-2)",
              border: "1px solid var(--border)", cursor: "pointer", display: "grid", placeItems: "center",
            }}
          >
            <CloseIcon size={16} color="var(--muted)" />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Customer type */}
          <div>
            <label style={labelStyle}>Mijoz turi</label>
            <div style={{ display: "flex", gap: 8 }}>
              {([["individual", "Jismoniy shaxs", UserIcon], ["shop", "Do'kon", StoreIcon]] as const).map(
                ([val, lbl, Icon]) => (
                  <button
                    key={val}
                    onClick={() => {
                      setCustomerType(val);
                      // re-price the cart for the selected customer type
                      setCart((prev) => prev.map((i) => {
                        const prod = products.find((x) => x._id === i.productId);
                        return prod ? { ...i, price: priceFor(prod, val) } : i;
                      }));
                    }}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                      padding: "10px", borderRadius: 12,
                      border: `2px solid ${customerType === val ? "var(--accent)" : "var(--border)"}`,
                      background: customerType === val ? "var(--accent-bg)" : "var(--surface-2)",
                      color: customerType === val ? "var(--accent-text)" : "var(--muted)",
                      fontWeight: 600, fontSize: 13.5, cursor: "pointer",
                    }}
                  >
                    <Icon size={15} color={customerType === val ? "var(--accent)" : "var(--muted)"} />
                    {lbl}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Name + phone */}
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Mijoz ismi</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ism Familiya"
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Telefon raqami</label>
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+998 90 000 00 00"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label style={labelStyle}>Manzil</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Manzilni yozing yoki xaritadan tanlang"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                onClick={() => setShowMap((v) => !v)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "0 16px", borderRadius: 12,
                  border: "1px solid var(--border)", background: showMap ? "var(--accent-bg)" : "var(--surface-2)",
                  color: showMap ? "var(--accent-text)" : "var(--muted)", fontWeight: 600, fontSize: 13, cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <MapPinIcon size={15} color={showMap ? "var(--accent)" : "var(--muted)"} />
                Xarita
              </button>
            </div>
            {showMap && (
              <div style={{ marginTop: 10 }}>
                <LocationMap
                  selected={location}
                  onSelect={(lat, lng, addr) => {
                    setLocation({ lat, lng });
                    setAddress(addr);
                  }}
                />
              </div>
            )}
          </div>

          {/* Products */}
          <div>
            <label style={labelStyle}>Mahsulotlar</label>
            <div style={{ position: "relative", marginBottom: 10 }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <SearchIcon size={15} color="var(--muted)" />
              </span>
              <input
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="Mahsulot qidirish..."
                style={{ ...inputStyle, paddingLeft: 38 }}
              />
            </div>

            {filteredProducts.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12, maxHeight: 180, overflowY: "auto" }}>
                {filteredProducts.map((p) => (
                  <button
                    key={p._id}
                    onClick={() => addProduct(p)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                      padding: "9px 12px", borderRadius: 10, border: "1px solid var(--border)",
                      background: "var(--surface-2)", cursor: "pointer", textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: 13.5, color: "var(--fg)", fontWeight: 500 }}>{p.name}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
                        {new Intl.NumberFormat("uz-UZ").format(priceFor(p, customerType))} so&apos;m
                      </span>
                      <PlusIcon size={14} color="var(--accent)" />
                    </span>
                  </button>
                ))}
              </div>
            )}

            {cart.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {cart.map((item) => (
                  <div
                    key={item.productId}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                      padding: "10px 12px", borderRadius: 12, background: "var(--accent-bg)",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--fg)" }}>{item.productName}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {new Intl.NumberFormat("uz-UZ").format(item.price)} so&apos;m × {item.quantity} ={" "}
                        <strong style={{ color: "var(--accent)" }}>
                          {new Intl.NumberFormat("uz-UZ").format(item.price * item.quantity)} so&apos;m
                        </strong>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => changeQty(item.productId, -1)} style={qtyBtnStyle}>−</button>
                      <span style={{ minWidth: 22, textAlign: "center", fontWeight: 700, fontSize: 13.5, color: "var(--fg)" }}>
                        {item.quantity}
                      </span>
                      <button onClick={() => changeQty(item.productId, 1)} style={qtyBtnStyle}>+</button>
                      <button
                        onClick={() => removeItem(item.productId)}
                        style={{ ...qtyBtnStyle, border: "none", background: "transparent" }}
                      >
                        <TrashIcon size={15} color="var(--red)" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 12.5, color: "var(--muted)" }}>Hali mahsulot qo&apos;shilmagan</p>
            )}
          </div>

          {/* Payment method */}
          <div>
            <label style={labelStyle}>To&apos;lov usuli</label>
            <div style={{ display: "flex", gap: 8 }}>
              {([["cash", "Naqd", CashIcon], ["card", "Karta", CardIcon], ["online", "Onlayn", GlobeIcon]] as const).map(
                ([val, lbl, Icon]) => (
                  <button
                    key={val}
                    onClick={() => setPaymentMethod(val)}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "9px", borderRadius: 12,
                      border: `2px solid ${paymentMethod === val ? "var(--accent)" : "var(--border)"}`,
                      background: paymentMethod === val ? "var(--accent-bg)" : "var(--surface-2)",
                      color: paymentMethod === val ? "var(--accent-text)" : "var(--muted)",
                      fontWeight: 600, fontSize: 13, cursor: "pointer",
                    }}
                  >
                    <Icon size={14} color={paymentMethod === val ? "var(--accent)" : "var(--muted)"} />
                    {lbl}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label style={labelStyle}>Holat</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Izoh (ixtiyoriy)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Qo'shimcha izoh..."
              rows={2}
              style={{ ...inputStyle, height: "auto", padding: "10px 16px", resize: "vertical" }}
            />
          </div>

          {/* Total */}
          <div
            style={{
              padding: "14px 18px", borderRadius: 14, background: "var(--surface-2)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}
          >
            <span style={{ color: "var(--muted)", fontSize: 14 }}>Jami summa</span>
            <span style={{ color: "var(--accent)", fontWeight: 800, fontSize: 19 }}>
              {new Intl.NumberFormat("uz-UZ").format(total)} so&apos;m
            </span>
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px", borderRadius: 12, background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)", color: "var(--red)", fontSize: 13, fontWeight: 500,
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <AlertIcon size={16} color="var(--red)" />
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: "13px", borderRadius: 16, background: "var(--accent)", color: "#fff",
              fontWeight: 700, fontSize: 15, border: "none", cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {submitting ? <SpinnerIcon size={16} color="#fff" /> : <PlusIcon size={16} color="#fff" />}
            {submitting ? "Yaratilmoqda..." : "Buyurtma yaratish"}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--muted)",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 44,
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--surface-2)",
  padding: "0 16px",
  fontSize: 14,
  color: "var(--fg)",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const qtyBtnStyle: React.CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  cursor: "pointer",
  fontSize: 14,
  color: "var(--fg)",
  display: "grid",
  placeItems: "center",
  fontWeight: 700,
};
