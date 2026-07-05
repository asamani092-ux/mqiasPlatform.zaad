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
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span>م</span>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>مِقياس</h1>
          <p className="sub" style={{ marginBottom: 0 }}>جمعية الزاد — قياس الأداء المؤسسي</p>
        </div>

        <h1>تسجيل الدخول</h1>
        <p className="sub">أدخل بيانات حسابك للوصول إلى المنصة</p>

        {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label className="lbl" htmlFor="email">البريد الإلكتروني</label>
            <input
              id="email"
              type="email"
              className="inp"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              dir="ltr"
            />
          </div>
          <div style={{ marginBottom: "1.25rem" }}>
            <label className="lbl" htmlFor="password">كلمة المرور</label>
            <input
              id="password"
              type="password"
              className="inp"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              dir="ltr"
            />
          </div>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? "جاري الدخول..." : "دخول"}
          </button>
        </form>
      </div>
    </div>
  );
}
