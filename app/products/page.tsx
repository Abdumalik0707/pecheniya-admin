"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useLanguage } from "@/lib/i18n";
import {
  CameraIcon,
  ImageIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  SearchIcon,
  SpinnerIcon,
  TagIcon,
} from "@/components/Icons";
import { apiFetch } from "@/lib/api";
import { defaultShopPrice, shopPriceOf, SHOP_MARKUP } from "@/lib/pricing";

interface Product {
  _id: string;
  name: string;
  brand: string;
  category: string;
  categoryLabel: string;
  price: number;
  shopPrice?: number;
  weight: string;
  netWeight: string;
  unit: string;
  image: string;
  images: string[];
  description: string;
  tags: string[];
  isNew: boolean;
  isPremium: boolean;
  createdAt: string;
}

const CATEGORIES = [
  { value: "pechenye", label: "Pechenye" },
  { value: "shokolad", label: "Shokolad" },
  { value: "konfet", label: "Konfet" },
  { value: "tort", label: "Tort" },
  { value: "pirojnoe", label: "Pirojnoe" },
  { value: "boshqa", label: "Boshqa" },
];

const SITE_URL = "https://pecheniya-site.vercel.app";

function resolveImage(src: string) {
  if (!src) return "";
  if (src.startsWith("http") || src.startsWith("data:") || src.startsWith("/api/")) return src;
  return SITE_URL + src;
}

const EMPTY_FORM = {
  name: "",
  brand: "SmaG",
  category: "pechenye",
  price: 0,
  shopPrice: 0,
  weight: "",
  unit: "quti",
  image: "",
  description: "",
  tags: [] as string[],
  isNew: false,
  isPremium: false,
};

export default function ProductsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const u = localStorage.getItem("pecheniya_admin");
    if (!u) { router.push("/login"); return; }
    const admin = JSON.parse(u);
    if (admin.type !== "admin" && !admin.isAdmin) { router.push("/login"); return; }
    fetchProducts();
  }, [router]);

  async function fetchProducts() {
    try {
      const res = await apiFetch("/api/products");
      const data = await res.json();
      if (data.success) setProducts(data.products);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.categoryLabel?.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
    );
  }, [products, search]);

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(p: Product) {
    setEditingId(p._id);
    setForm({
      name: p.name,
      brand: p.brand,
      category: p.category,
      price: p.price,
      shopPrice: shopPriceOf(p),
      weight: p.weight,
      unit: p.unit,
      image: p.image,
      description: p.description || "",
      tags: p.tags || [],
      isNew: p.isNew || false,
      isPremium: p.isPremium || false,
    });
    setShowModal(true);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Rasm 5MB dan katta bo'lmasligi kerak");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiFetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setForm((f) => ({ ...f, image: data.url }));
      } else {
        alert(data.error || "Yuklashda xatolik");
      }
    } catch {
      alert("Yuklashda xatolik");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSave() {
    if (!form.name || !form.price || !form.weight || !form.image) {
      alert(t("products_fill_required"));
      return;
    }
    setSaving(true);
    try {
      const catLabel = CATEGORIES.find((c) => c.value === form.category)?.label || form.category;
      const body = {
        ...form,
        shopPrice: form.shopPrice > 0 ? form.shopPrice : defaultShopPrice(form.price),
        categoryLabel: catLabel,
      };

      const url = editingId ? `/api/products/${editingId}` : "/api/products";
      const method = editingId ? "PUT" : "POST";
      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchProducts();
      } else {
        alert(data.error || t("products_save_error"));
      }
    } catch {
      alert(t("products_save_error"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await apiFetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setDeleteConfirm(null);
        fetchProducts();
      }
    } catch {
      alert(t("products_delete_error"));
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--muted)", fontSize: 16 }}>{t("loading")}</div>
      </div>
    );
  }

  return (
    <div className="admin-shell" style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <AdminSidebar active="products" mounted={mounted} />

      <main className="admin-main" style={{ flex: 1, padding: "28px 32px", overflowX: "hidden", minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-jakarta)", fontSize: 24, fontWeight: 800, color: "var(--fg)", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 36, height: 36, borderRadius: 11, background: "var(--accent-bg)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <TagIcon size={20} color="var(--accent)" />
              </span>
              {t("products_title")}
            </h1>
            <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 2 }}>{t("products_subtitle")}</p>
          </div>
          <button
            onClick={openAdd}
            style={{
              padding: "10px 20px", borderRadius: 12, border: "none",
              background: "var(--accent)", color: "#fff", fontWeight: 700,
              fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
            }}
          >
            <PlusIcon size={17} color="#fff" />
            {t("products_add")}
          </button>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 20, position: "relative", maxWidth: 400 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex" }}>
            <SearchIcon size={17} color="var(--muted)" />
          </span>
          <input
            type="text"
            placeholder={t("products_search_ph")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "10px 16px 10px 42px", borderRadius: 12,
              border: "1px solid var(--border)", background: "var(--surface)",
              color: "var(--fg)", fontSize: 14, outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 20px" }}>
            <span style={{ color: "var(--accent)", fontWeight: 800, fontSize: 20 }}>{products.length}</span>
            <span style={{ color: "var(--muted)", fontSize: 13, marginLeft: 8 }}>{t("products_total")}</span>
          </div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 20px" }}>
            <span style={{ color: "var(--green)", fontWeight: 800, fontSize: 20 }}>
              {new Set(products.map((p) => p.category)).size}
            </span>
            <span style={{ color: "var(--muted)", fontSize: 13, marginLeft: 8 }}>{t("products_categories")}</span>
          </div>
        </div>

        {/* Products grid */}
        {filtered.length === 0 ? (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 40, textAlign: "center" }}>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>
              {search ? t("products_no_match") : t("products_empty")}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {filtered.map((p) => (
              <div
                key={p._id}
                style={{
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: 18, overflow: "hidden", display: "flex", flexDirection: "column",
                }}
              >
                <div style={{ width: "100%", aspectRatio: "3/2", background: "#fff", position: "relative", overflow: "hidden" }}>
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveImage(p.image)}
                      alt={p.name}
                      style={{
                        position: "absolute", inset: 0, width: "100%", height: "100%",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <div style={{ display: "grid", placeItems: "center", height: "100%", gap: 6, color: "var(--muted)", opacity: 0.45 }}>
                      <ImageIcon size={30} color="var(--muted)" />
                      <span style={{ fontSize: 12 }}>Rasm yo&apos;q</span>
                    </div>
                  )}
                  <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 4 }}>
                    {p.isNew && (
                      <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 6, background: "var(--blue)", color: "#fff" }}>
                        YANGI
                      </span>
                    )}
                    {p.isPremium && (
                      <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 6, background: "var(--amber)", color: "#fff" }}>
                        PREMIUM
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <p style={{ color: "var(--muted)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>
                    {p.brand} · {p.categoryLabel || p.category}
                  </p>
                  <h3 style={{ fontFamily: "var(--font-jakarta)", fontSize: 15, fontWeight: 700, color: "var(--fg)", marginBottom: 6 }}>
                    {p.name}
                  </h3>
                  <p style={{ color: "var(--muted)", fontSize: 12, lineHeight: 1.4, marginBottom: 10, flex: 1 }}>
                    {p.description || "—"}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10, gap: 8 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <span style={{ color: "var(--accent)", fontWeight: 800, fontSize: 16, display: "flex", alignItems: "center", gap: 6 }}>
                        {p.price.toLocaleString()} so&apos;m
                        <span style={priceTagStyle}>{t("products_price_individual_short")}</span>
                      </span>
                      <span style={{ color: "var(--amber)", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                        {shopPriceOf(p).toLocaleString()} so&apos;m
                        <span style={{ ...priceTagStyle, background: "rgba(217,119,6,0.12)", color: "var(--amber)" }}>{t("products_price_shop_short")}</span>
                      </span>
                    </div>
                    <span style={{ color: "var(--muted)", fontSize: 12 }}>{p.weight}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => openEdit(p)}
                      style={{
                        flex: 1, padding: "8px 0", borderRadius: 10,
                        border: "1px solid var(--border)", background: "transparent",
                        color: "var(--fg)", fontWeight: 600, fontSize: 12, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      }}
                    >
                      <EditIcon size={13} color="var(--fg)" />
                      {t("products_edit")}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(p._id)}
                      style={{
                        flex: 1, padding: "8px 0", borderRadius: 10,
                        border: "1px solid var(--border)", background: "transparent",
                        color: "var(--red)", fontWeight: 600, fontSize: 12, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      }}
                    >
                      <TrashIcon size={13} color="var(--red)" />
                      {t("products_delete")}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add / Edit Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            style={{
              background: "var(--surface)", borderRadius: 20, padding: "28px 24px",
              width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto",
              border: "1px solid var(--border)",
            }}
          >
            <h2 style={{ fontFamily: "var(--font-jakarta)", fontSize: 18, fontWeight: 800, color: "var(--fg)", marginBottom: 20 }}>
              {editingId ? t("products_edit_title") : t("products_add_title")}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Image upload */}
              <div>
                <label style={labelStyle}>Rasm *</label>
                <div
                  onClick={() => !uploading && fileRef.current?.click()}
                  style={{
                    width: "100%", minHeight: 140, borderRadius: 14,
                    border: `2px dashed ${form.image ? "var(--accent)" : "var(--border)"}`,
                    background: "var(--surface-2)", cursor: uploading ? "wait" : "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    gap: 8, overflow: "hidden", position: "relative",
                  }}
                >
                  {form.image ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveImage(form.image)}
                        alt="preview"
                        style={{ maxWidth: "100%", maxHeight: 200, objectFit: "contain" }}
                      />
                      <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600 }}>
                        Boshqa rasm tanlash uchun bosing
                      </span>
                    </>
                  ) : uploading ? (
                    <>
                      <SpinnerIcon size={26} color="var(--accent)" />
                      <span style={{ fontSize: 13, color: "var(--muted)" }}>Yuklanmoqda...</span>
                    </>
                  ) : (
                    <>
                      <span style={{ width: 48, height: 48, borderRadius: 14, background: "var(--surface)", display: "grid", placeItems: "center" }}>
                        <CameraIcon size={24} color="var(--muted)" />
                      </span>
                      <span style={{ fontSize: 13, color: "var(--fg)", fontWeight: 600 }}>Rasm yuklash uchun bosing</span>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>JPG, PNG, WEBP · max 5MB</span>
                    </>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
              </div>

              {/* Name */}
              <div>
                <label style={labelStyle}>Tovar nomi *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Kunjut lochira"
                  style={inputStyle}
                />
              </div>

              {/* Brand + Category */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Brend</label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Kategoriya *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    style={inputStyle}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prices: ordinary customer + shop customer */}
              <div style={{ borderRadius: 14, border: "1px solid var(--border)", background: "var(--surface-2)", padding: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={labelStyle}>{t("products_price_individual")} *</label>
                    <input
                      type="number"
                      min={0}
                      value={form.price || ""}
                      onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                      placeholder="82000"
                      style={{ ...inputStyle, background: "var(--surface)" }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>{t("products_price_shop")} *</label>
                    <input
                      type="number"
                      min={0}
                      value={form.shopPrice || ""}
                      onChange={(e) => setForm({ ...form, shopPrice: Number(e.target.value) })}
                      placeholder={form.price ? String(defaultShopPrice(form.price)) : "90200"}
                      style={{ ...inputStyle, background: "var(--surface)" }}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11.5, color: "var(--muted)" }}>
                    {t("products_price_hint")}
                  </span>
                  <button
                    type="button"
                    disabled={!form.price}
                    onClick={() => setForm({ ...form, shopPrice: defaultShopPrice(form.price) })}
                    style={{
                      padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)",
                      background: "var(--surface)", color: "var(--accent)", fontWeight: 700, fontSize: 12,
                      cursor: form.price ? "pointer" : "not-allowed", opacity: form.price ? 1 : 0.5,
                    }}
                  >
                    +{Math.round(SHOP_MARKUP * 100)}% {t("products_price_auto")}
                  </button>
                </div>
              </div>

              {/* Weight + Unit */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Vazn *</label>
                  <input
                    type="text"
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    placeholder="3.5 kg"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Birlik</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="quti">Quti</option>
                    <option value="dona">Dona</option>
                    <option value="kg">Kg</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Tavsif</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  placeholder="Qisqacha mahsulot haqida"
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              {/* Tags */}
              <div>
                <label style={labelStyle}>Teglar (vergul bilan)</label>
                <input
                  type="text"
                  value={form.tags.join(", ")}
                  onChange={(e) => setForm({ ...form, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
                  placeholder="lochira, kunjut, shokolad"
                  style={inputStyle}
                />
              </div>

              {/* Checkboxes */}
              <div style={{ display: "flex", gap: 20 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--fg)", fontSize: 14, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.isNew}
                    onChange={(e) => setForm({ ...form, isNew: e.target.checked })}
                  />
                  Yangi mahsulot
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--fg)", fontSize: 14, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.isPremium}
                    onChange={(e) => setForm({ ...form, isPremium: e.target.checked })}
                  />
                  Premium
                </label>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 12,
                  border: "1px solid var(--border)", background: "transparent",
                  color: "var(--muted)", fontWeight: 600, fontSize: 14, cursor: "pointer",
                }}
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                style={{
                  flex: 2, padding: "10px 0", borderRadius: 12, border: "none",
                  background: "var(--accent)", color: "#fff", fontWeight: 700,
                  fontSize: 14, cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving || uploading ? 0.6 : 1,
                }}
              >
                {saving ? "Saqlanmoqda..." : editingId ? "Saqlash" : "Qo'shish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirm(null); }}
        >
          <div style={{
            background: "var(--surface)", borderRadius: 18, padding: "28px 24px",
            width: "100%", maxWidth: 380, border: "1px solid var(--border)", textAlign: "center",
          }}>
            <h3 style={{ fontFamily: "var(--font-jakarta)", fontSize: 16, fontWeight: 700, color: "var(--fg)", marginBottom: 8 }}>
              {t("products_delete_title")}
            </h3>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20 }}>
              {t("products_delete_desc")}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 12,
                  border: "1px solid var(--border)", background: "transparent",
                  color: "var(--muted)", fontWeight: 600, fontSize: 14, cursor: "pointer",
                }}
              >
                Bekor qilish
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 12, border: "none",
                  background: "var(--red)", color: "#fff", fontWeight: 700,
                  fontSize: 14, cursor: "pointer",
                }}
              >
                O&apos;chirish
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 860px) {
          .admin-shell { flex-direction: column; }
          .admin-main { padding: 18px !important; }
        }
      `}</style>
    </div>
  );
}

const priceTagStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6,
  background: "var(--accent-bg)", color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.03em",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 4, display: "block",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 10,
  border: "1px solid var(--border)", background: "var(--surface-2)",
  color: "var(--fg)", fontSize: 14, outline: "none", boxSizing: "border-box",
};
