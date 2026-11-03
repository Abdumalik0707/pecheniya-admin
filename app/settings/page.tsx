"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useLanguage } from "@/lib/i18n";
import { AlertIcon, CheckCircleIcon, SettingsIcon } from "@/components/Icons";
import { apiFetch } from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [admin, setAdmin] = useState<{ username?: string; name?: string } | null>(null);

  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setMounted(true);
    const u = localStorage.getItem("pecheniya_admin");
    if (!u) { router.push("/login"); return; }
    const parsed = JSON.parse(u);
    if (parsed.type !== "admin" && !parsed.isAdmin) { router.push("/login"); return; }
    setAdmin(parsed);
    setNewUsername(parsed.username || "");
  }, [router]);

  async function handleSave() {
    setError("");
    setSuccess("");

    if (!currentPassword) {
      setError("Joriy parolni kiriting");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError("Yangi parollar mos kelmadi");
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setError("Yangi parol kamida 6 belgi bo'lishi kerak");
      return;
    }

    if (newUsername && newUsername.trim().length < 3) {
      setError("Username kamida 3 belgi bo'lishi kerak");
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword: newPassword || undefined,
          newUsername: newUsername !== admin?.username ? newUsername : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Xatolik yuz berdi");
        return;
      }

      if (data.user) {
        const stored = JSON.parse(localStorage.getItem("pecheniya_admin") || "{}");
        localStorage.setItem(
          "pecheniya_admin",
          JSON.stringify({ ...stored, ...data.user })
        );
        setAdmin({ ...admin, ...data.user });
      }

      setSuccess("Sozlamalar muvaffaqiyatli saqlandi!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Server bilan bog'lanishda xatolik");
    } finally {
      setSaving(false);
    }
  }

  if (!mounted || !admin) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--muted)", fontSize: 16 }}>{t("loading")}</div>
      </div>
    );
  }

  return (
    <div className="admin-shell" style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <AdminSidebar active="settings" mounted={mounted} />

      <main className="admin-main" style={{ flex: 1, padding: "28px 32px", overflowX: "hidden", minWidth: 0 }}>
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontFamily: "var(--font-jakarta)",
              fontSize: 24,
              fontWeight: 800,
              color: "var(--fg)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: 11,
                background: "var(--accent-bg)",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <SettingsIcon size={18} color="var(--accent)" />
            </span>
            Sozlamalar
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 2 }}>
            Admin login va parolni o&apos;zgartirish
          </p>
        </div>

        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 20,
            padding: "28px",
            maxWidth: 520,
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-jakarta)",
              fontSize: 17,
              fontWeight: 700,
              color: "var(--fg)",
              marginBottom: 20,
            }}
          >
            Akkaunt sozlamalari
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>Username (login)</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="admin"
                style={inputStyle}
              />
              <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                Admin panelga kirish uchun username
              </p>
            </div>

            <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />

            <div>
              <label style={labelStyle}>Joriy parol *</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Hozirgi parolingiz"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Yangi parol</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Kamida 6 belgi"
                style={inputStyle}
              />
              <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                O&apos;zgartirmoqchi bo&apos;lmasangiz bo&apos;sh qoldiring
              </p>
            </div>

            {newPassword && (
              <div>
                <label style={labelStyle}>Yangi parolni tasdiqlang</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Yangi parolni qayta kiriting"
                  style={{
                    ...inputStyle,
                    borderColor:
                      confirmPassword && newPassword !== confirmPassword
                        ? "var(--red)"
                        : "var(--border)",
                  }}
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p style={{ color: "var(--red)", fontSize: 12, marginTop: 4 }}>
                    Parollar mos kelmadi
                  </p>
                )}
              </div>
            )}

            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "var(--red)",
                  fontSize: 13,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <AlertIcon size={16} color="var(--red)" />
                {error}
              </div>
            )}

            {success && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.3)",
                  color: "var(--green)",
                  fontSize: 13,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <CheckCircleIcon size={16} color="var(--green)" />
                {success}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving || !currentPassword}
              style={{
                padding: "12px",
                borderRadius: 14,
                background: "var(--accent)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
                border: "none",
                cursor: saving || !currentPassword ? "not-allowed" : "pointer",
                opacity: saving || !currentPassword ? 0.6 : 1,
                marginTop: 4,
              }}
            >
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
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
  height: 46,
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--surface-2)",
  padding: "0 16px",
  fontSize: 15,
  color: "var(--fg)",
  outline: "none",
  boxSizing: "border-box",
};
