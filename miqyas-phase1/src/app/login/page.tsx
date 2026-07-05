"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(
        result.error.includes("المحاولات")
          ? "تم تجاوز عدد المحاولات، حاول بعد 15 دقيقة"
          : "البريد الإلكتروني أو كلمة المرور غير صحيحة",
      );
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="page-shell">
      <div className="page-container-narrow">
        <div className="card">
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "3rem",
                height: "3rem",
                borderRadius: "var(--tmkeen-radius-lg)",
                background: "var(--tmkeen-primary)",
                color: "#fff",
                fontSize: "1.5rem",
                fontWeight: 800,
                marginBottom: "0.75rem",
              }}
            >
              م
            </span>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--tmkeen-primary)" }}>مِقياس</h1>
            <p className="text-muted" style={{ marginBottom: 0 }}>جمعية الزاد — قياس الأداء المؤسسي</p>
          </div>

          <h2 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "0.5rem" }}>تسجيل الدخول</h2>
          <p className="text-muted">أدخل بيانات حسابك للوصول إلى المنصة</p>

          {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "1rem" }}>
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
              />
            </div>
            <div style={{ marginBottom: "1.25rem" }}>
              <label className="label-field" htmlFor="password">كلمة المرور</label>
              <input
                id="password"
                type="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                dir="ltr"
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading ? "جاري الدخول..." : "دخول"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
