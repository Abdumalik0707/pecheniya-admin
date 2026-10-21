"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function AdminLoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [username, setUsername] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: pass }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("login_generic_error"));
        return;
      }

      if (!data.user.isAdmin && data.user.type !== "admin") {
        setError(t("login_not_admin"));
        return;
      }

      localStorage.setItem("pecheniya_admin", JSON.stringify(data.user));
      router.push("/");
    } catch {
      setError(t("login_server_error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#1c1611",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <LanguageSwitcher />
        </div>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: "#2b2219",
              border: "1px solid #4a3a28",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 16px",
              padding: 8,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/smag-logo.png" alt="SmaG" style={{ maxWidth: "100%", maxHeight: "100%" }} />
          </div>
          <h1 style={{ color: "#f5ecdc", fontSize: 24, fontWeight: 800, margin: "0 0 6px" }}>
            {t("login_title")}
          </h1>
          <p style={{ color: "#a99a86", fontSize: 14, margin: 0 }}>
            {t("login_subtitle")}
          </p>
        </div>

        <div
          style={{
            background: "#2b2219",
            border: "1px solid #4a3a28",
            borderRadius: 20,
            padding: "28px",
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", color: "#a99a86", fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {t("login_username")}
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                style={{
                  width: "100%",
                  height: 46,
                  borderRadius: 12,
                  border: "1px solid #4a3a28",
                  background: "#1c1611",
                  padding: "0 16px",
                  fontSize: 15,
                  color: "#f5ecdc",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", color: "#a99a86", fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {t("login_password")}
              </label>
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: "100%",
                  height: 46,
                  borderRadius: 12,
                  border: "1px solid #4a3a28",
                  background: "#1c1611",
                  padding: "0 16px",
                  fontSize: 15,
                  color: "#f5ecdc",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#f87171",
                  fontSize: 13,
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "13px",
                borderRadius: 14,
                background: "#c9622f",
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                marginTop: 4,
              }}
            >
              {loading ? t("login_checking") : t("login_submit")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
