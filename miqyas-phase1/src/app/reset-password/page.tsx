"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import BrandMark from "@/components/BrandMark";

type SubmitState = "idle" | "loading" | "success";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("رابط الاستعادة غير صالح");
      return;
    }

    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }

    setSubmitState("loading");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSubmitState("idle");
        setError(data.error || "حدث خطأ، حاول مرة أخرى");
        return;
      }

      setSubmitState("success");
      setMessage(data.message || "تم تغيير كلمة المرور بنجاح");
    } catch {
      setSubmitState("idle");
      setError("حدث خطأ في الاتصال، حاول مرة أخرى");
    }
  }

  const buttonLabel =
    submitState === "loading"
      ? "جاري الحفظ..."
      : submitState === "success"
        ? "تم بنجاح"
        : "تعيين كلمة المرور";

  if (!token) {
    return (
      <>
        <div className="alert alert-error" style={{ marginBottom: "1rem" }} role="alert">
          رابط الاستعادة غير صالح أو منتهي الصلاحية
        </div>
        <Link href="/forgot-password" className="text-muted" style={{ fontSize: "0.875rem" }}>
          طلب رابط جديد
        </Link>
      </>
    );
  }

  return (
    <>
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

      {submitState === "success" ? (
        <Link
          href="/login"
          className="btn-primary"
          style={{ display: "inline-flex", width: "100%", textAlign: "center" }}
        >
          الانتقال لتسجيل الدخول
        </Link>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
          <div>
            <label className="label-field" htmlFor="password">
              كلمة المرور الجديدة
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
              required
              minLength={8}
              autoComplete="new-password"
              dir="ltr"
            />
          </div>
          <div>
            <label className="label-field" htmlFor="confirmPassword">
              تأكيد كلمة المرور
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="input-field"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onInput={(e) => setConfirmPassword((e.target as HTMLInputElement).value)}
              required
              minLength={8}
              autoComplete="new-password"
              dir="ltr"
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
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="page-shell">
      <main className="page-container-narrow">
        <div className="card">
          <div className="login-brand-block">
            <BrandMark variant="login" />
            <h1 className="login-title">مِقياس</h1>
          </div>

          <h2 className="login-heading">تعيين كلمة مرور جديدة</h2>
          <p className="text-muted" style={{ marginBottom: "1rem" }}>
            أدخل كلمة المرور الجديدة لحسابك
          </p>

          <Suspense fallback={<p className="text-muted">جاري التحميل...</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
