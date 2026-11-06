"use client";

import { useState, type InputHTMLAttributes } from "react";
import { EyeIcon, EyeOffIcon } from "./Icons";
import { useLanguage } from "@/lib/i18n";

/** Password field with a show/hide button. Drop-in replacement for <input type="password">. */
export function PasswordInput({ style, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);
  const label = show ? t("pw_hide") : t("pw_show");

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input {...props} type={show ? "text" : "password"} style={{ ...style, paddingRight: 48 }} />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={label}
        aria-pressed={show}
        title={label}
        tabIndex={0}
        style={{
          position: "absolute",
          right: 6,
          top: "50%",
          transform: "translateY(-50%)",
          width: 38,
          height: 38,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          borderRadius: 10,
          background: "transparent",
          color: show ? "var(--accent, #e2231a)" : "var(--muted, #8a7a66)",
          cursor: "pointer",
          padding: 0,
        }}
      >
        {show ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
      </button>
    </div>
  );
}
