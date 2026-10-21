"use client";

import { useState } from "react";
import { useLanguage, type Lang } from "@/lib/i18n";

const LABELS: Record<Lang, string> = { uz: "UZ", ru: "RU", en: "EN" };

function FlagIcon({ lang }: { lang: Lang }) {
  const common = { width: 20, height: 14, style: { borderRadius: 3, flexShrink: 0, display: "block" } as React.CSSProperties };

  if (lang === "uz") {
    return (
      <svg {...common} viewBox="0 0 20 14" xmlns="http://www.w3.org/2000/svg">
        <rect width="20" height="14" fill="#1eb53a" />
        <rect width="20" height="6.2" fill="#0099b5" />
        <rect y="5.6" width="20" height="2.8" fill="#fff" />
        <rect y="5.6" width="20" height="0.7" fill="#ce1126" />
        <rect y="7.7" width="20" height="0.7" fill="#ce1126" />
        <circle cx="4.2" cy="3.1" r="1.3" fill="#fff" />
        <circle cx="4.7" cy="3.1" r="1.05" fill="#0099b5" />
      </svg>
    );
  }
  if (lang === "ru") {
    return (
      <svg {...common} viewBox="0 0 20 14" xmlns="http://www.w3.org/2000/svg">
        <rect width="20" height="14" fill="#fff" />
        <rect y="4.67" width="20" height="4.67" fill="#0039a6" />
        <rect y="9.33" width="20" height="4.67" fill="#d52b1e" />
      </svg>
    );
  }
  return (
    <svg {...common} viewBox="0 0 20 14" xmlns="http://www.w3.org/2000/svg">
      <rect width="20" height="14" fill="#012169" />
      <rect y="5.5" width="20" height="3" fill="#fff" />
      <rect x="8.5" width="3" height="14" fill="#fff" />
      <rect y="6.2" width="20" height="1.6" fill="#c8102e" />
      <rect x="9.2" width="1.6" height="14" fill="#c8102e" />
    </svg>
  );
}

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 7, padding: "8px 12px", borderRadius: 10,
          border: "1px solid var(--border)", background: "var(--surface-2)", cursor: "pointer",
          color: "var(--fg)", fontSize: 13, fontWeight: 700,
        }}
      >
        <FlagIcon lang={lang} />
        {LABELS[lang]}
        <span style={{ fontSize: 9, opacity: 0.6 }}>▼</span>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 90 }} />
          <div
            style={{
              position: "absolute", right: 0, top: "calc(100% + 8px)", background: "var(--surface)",
              border: "1px solid var(--border)", borderRadius: 14, boxShadow: "var(--shadow)",
              minWidth: 130, padding: 6, zIndex: 100,
            }}
          >
            {(Object.keys(LABELS) as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => { setLang(l); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left",
                  padding: "8px 10px", borderRadius: 10, border: "none", cursor: "pointer",
                  background: lang === l ? "var(--accent-bg)" : "transparent",
                  color: lang === l ? "var(--accent-text)" : "var(--fg)",
                  fontSize: 13, fontWeight: 600,
                }}
              >
                <FlagIcon lang={l} />
                {LABELS[l]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
