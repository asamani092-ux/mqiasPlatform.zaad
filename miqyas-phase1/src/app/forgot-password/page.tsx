"use client";

import { useState } from "react";
import Link from "next/link";
import BrandMark from "@/components/BrandMark";

type SubmitState = "idle" | "loading" | "success";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSubmitState("loading");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSubmitState("idle");
        setError(data.error || "حدث خطأ، حاول مرة أخرى");
        return;
      }

      setSubmitState("success");
      setMessage(data.message);
    } catch {
      setSubmitState("idle");
      setError("حدث خطأ في الاتصال، حاول مرة أخرى");
    }
  }

  const buttonLabel =
    submitState === "loading"
      ? "جاري الإرسال..."
      : submitState === "success"
        ? "تم الإرسال"
        : "إرسال رابط الاستعادة";

  return (
    <div className="page-shell">
      <div className="page-container-narrow">
        <div className="card">
          <div className="login-brand-block">
            <BrandMark variant="login" />
            <h1 className="login-title">مِقياس</h1>
          </div>

          <h2 className="login-heading">استعادة كلمة المرور</h2>
          <p className="text-muted">أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين</p>

          {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}
          {message && <div className="alert alert-success" style={{ marginBottom: "1rem" }}>{message}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "1.25rem" }}>
              <label className="label-field" htmlFor="email">البريد الإلكتروني</label>
              <input
                id="email"
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                dir="ltr"
                disabled={submitState === "success"}
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
              style={{ width: "100%", marginBottom: "1rem" }}
              disabled={submitState !== "idle"}
            >
              {buttonLabel}
            </button>
            <Link href="/login" className="text-muted" style={{ fontSize: "0.9rem" }}>
              العودة لتسجيل الدخول
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
