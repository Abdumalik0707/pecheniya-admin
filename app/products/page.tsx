"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useLanguage } from "@/lib/i18n";

interface Product {
  _id: string;
  name: string;
  brand: string;
  category: string;
  categoryLabel: string;
  price: number;
  weight: string;
  netWeight: string;
  unit: string;
  image: string;
  images: string[];
  description: string;
  descriptionFull: string;
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

const EMPTY_FORM = {
  name: "",
  brand: "SmaG",
  category: "pechenye",
  categoryLabel: "",
  price: 0,
  weight: "",
  netWeight: "",
  unit: "quti",
  image: "",
  images: [] as string[],
  description: "",
  descriptionFull: "",
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
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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
      const res = await fetch("/api/products");
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
        p.categoryLabel.toLowerCase().includes(q) ||
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
      categoryLabel: p.categoryLabel,
      price: p.price,
      weight: p.weight,
      netWeight: p.netWeight || "",
      unit: p.unit,
      image: p.image,
      images: p.images || [],
      description: p.description || "",
      descriptionFull: p.descriptionFull || "",
      tags: p.tags || [],
      isNew: p.isNew || false,
      isPremium: p.isPremium || false,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name || !form.price || !form.weight || !form.image || !form.categoryLabel) {
      alert(t("products_fill_required"));
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/api/products/${editingId}` : "/api/products";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
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
            <h1 style={{ fontFamily: "var(--font-jakarta)", fontSize: 24, fontWeight: 800, color: "var(--fg)" }}>
              {t("products_title")}
            </h1>
            <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 2 }}>{t("products_subtitle")}</p>
          </div>
          <button
            onClick={openAdd}
            style={{
              padding: "10px 22px", borderRadius: 12, border: "none",
              background: "var(--accent)", color: "#fff", fontWeight: 700,
              fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
            }}
          >
            + {t("products_add")}
          </button>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 20 }}>
          <input
            type="text"
            placeholder={t("products_search_ph")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", maxWidth: 400, padding: "10px 16px", borderRadius: 12,
              border: "1px solid var(--border)", background: "var(--surface)",
              color: "var(--fg)", fontSize: 14, outline: "none",
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
                {/* Image */}
                <div style={{ width: "100%", aspectRatio: "1/1", background: "var(--surface-2)", position: "relative", overflow: "hidden" }}>
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image}
                      alt={p.name}
                      style={{
                        position: "absolute", inset: 0, width: "100%", height: "100%",
                        objectFit: "contain", padding: "20px", boxSizing: "border-box",
                      }}
                    />
                  ) : (
                    <div style={{ display: "grid", placeItems: "center", height: "100%", fontSize: 48, opacity: 0.4 }}>
                      🍪
                    </div>
                  )}
                  {/* Badges */}
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

                {/* Info */}
                <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <p style={{ color: "var(--muted)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>
                    {p.brand} · {p.categoryLabel}
                  </p>
                  <h3 style={{ fontFamily: "var(--font-jakarta)", fontSize: 15, fontWeight: 700, color: "var(--fg)", marginBottom: 6 }}>
                    {p.name}
                  </h3>
                  <p style={{ color: "var(--muted)", fontSize: 12, lineHeight: 1.4, marginBottom: 10, flex: 1 }}>
                    {p.description || "—"}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ color: "var(--accent)", fontWeight: 800, fontSize: 16 }}>
                      {p.price.toLocaleString()} so&apos;m
                    </span>
                    <span style={{ color: "var(--muted)", fontSize: 12 }}>{p.weight}</span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => openEdit(p)}
                      style={{
                        flex: 1, padding: "8px 0", borderRadius: 10,
                        border: "1px solid var(--border)", background: "transparent",
                        color: "var(--fg)", fontWeight: 600, fontSize: 12, cursor: "pointer",
                      }}
                    >
                      {t("products_edit")}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(p._id)}
                      style={{
                        flex: 1, padding: "8px 0", borderRadius: 10,
                        border: "1px solid var(--border)", background: "transparent",
                        color: "var(--red)", fontWeight: 600, fontSize: 12, cursor: "pointer",
                      }}
                    >
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
              width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto",
              border: "1px solid var(--border)",
            }}
          >
            <h2 style={{ fontFamily: "var(--font-jakarta)", fontSize: 18, fontWeight: 800, color: "var(--fg)", marginBottom: 20 }}>
              {editingId ? t("products_edit_title") : t("products_add_title")}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Name */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 4, display: "block" }}>
                  {t("products_f_name")} *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={inputStyle}
                />
              </div>

              {/* Brand + Category row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>{t("products_f_brand")}</label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>{t("products_f_category")} *</label>
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

              {/* Category Label */}
              <div>
                <label style={labelStyle}>{t("products_f_categoryLabel")} *</label>
                <input
                  type="text"
                  value={form.categoryLabel}
                  onChange={(e) => setForm({ ...form, categoryLabel: e.target.value })}
                  placeholder="masalan: Pechenye, Shokolad..."
                  style={inputStyle}
                />
              </div>

              {/* Price + Weight + Unit row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>{t("products_f_price")} *</label>
                  <input
                    type="number"
                    value={form.price || ""}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>{t("products_f_weight")} *</label>
                  <input
                    type="text"
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    placeholder="1.0 kg"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>{t("products_f_unit")}</label>
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

              {/* Net Weight */}
              <div>
                <label style={labelStyle}>{t("products_f_netWeight")}</label>
                <input
                  type="text"
                  value={form.netWeight}
                  onChange={(e) => setForm({ ...form, netWeight: e.target.value })}
                  placeholder="900g"
                  style={inputStyle}
                />
              </div>

              {/* Image URL */}
              <div>
                <label style={labelStyle}>{t("products_f_image")} *</label>
                <input
                  type="text"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="https://..."
                  style={inputStyle}
                />
                {form.image && (
                  <div style={{ marginTop: 8, width: 80, height: 80, borderRadius: 10, overflow: "hidden", background: "var(--surface-2)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.image} alt="preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>{t("products_f_desc")}</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              {/* Full Description */}
              <div>
                <label style={labelStyle}>{t("products_f_descFull")}</label>
                <textarea
                  value={form.descriptionFull}
                  onChange={(e) => setForm({ ...form, descriptionFull: e.target.value })}
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              {/* Tags */}
              <div>
                <label style={labelStyle}>{t("products_f_tags")}</label>
                <input
                  type="text"
                  value={form.tags.join(", ")}
                  onChange={(e) => setForm({ ...form, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
                  placeholder="pechenye, shokolad, yangi"
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
                  {t("products_f_isNew")}
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--fg)", fontSize: 14, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.isPremium}
                    onChange={(e) => setForm({ ...form, isPremium: e.target.checked })}
                  />
                  {t("products_f_isPremium")}
                </label>
              </div>
            </div>

            {/* Modal actions */}
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 12,
                  border: "1px solid var(--border)", background: "transparent",
                  color: "var(--muted)", fontWeight: 600, fontSize: 14, cursor: "pointer",
                }}
              >
                {t("products_cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 2, padding: "10px 0", borderRadius: 12, border: "none",
                  background: "var(--accent)", color: "#fff", fontWeight: 700,
                  fontSize: 14, cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? t("products_saving") : editingId ? t("products_save_edit") : t("products_save_add")}
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
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
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
                {t("products_cancel")}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 12, border: "none",
                  background: "var(--red)", color: "#fff", fontWeight: 700,
                  fontSize: 14, cursor: "pointer",
                }}
              >
                {t("products_confirm_delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 860px) {
          .admin-shell { flex-direction: column; }
          .admin-main { padding: 18px !important; }
        }
      `}</style>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 4, display: "block",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 10,
  border: "1px solid var(--border)", background: "var(--surface-2)",
  color: "var(--fg)", fontSize: 14, outline: "none", boxSizing: "border-box",
};
