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
      <main className="page-container-narrow">
        <div className="card">
          <div className="login-brand-block">
            <BrandMark variant="login" />
            <h1 className="login-title">مِقياس</h1>
          </div>

          <h2 className="login-heading">استعادة كلمة المرور</h2>
          <p className="text-muted" style={{ marginBottom: "1rem" }}>
            أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين
          </p>

          {error ? (
            <div className="alert alert-error" style={{ marginBottom: "1rem" }} role="alert">
              {error}
            </div>
          ) : null}
          {message ? (
            <div className="alert alert-success" style={{ marginBottom: "1rem" }} role="status">
              {message}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
            <div>
              <label className="label-field" htmlFor="email">
                البريد الإلكتروني
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                required
                autoComplete="email"
                dir="ltr"
                disabled={submitState === "success"}
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
              style={{ width: "100%" }}
              disabled={submitState !== "idle"}
            >
              {buttonLabel}
            </button>
            <Link href="/login" className="text-muted" style={{ fontSize: "0.875rem" }}>
              العودة لتسجيل الدخول
            </Link>
          </form>
        </div>
      </main>
    </div>
  );
}
