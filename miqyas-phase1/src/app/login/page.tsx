"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import BrandMark from "@/components/BrandMark";

type SubmitState = "idle" | "loading" | "success";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitState("loading");

    const result = await signIn("credentials", {
      email,
      password,
      rememberMe: rememberMe ? "true" : "false",
      redirect: false,
    });

    if (result?.error) {
      setSubmitState("idle");
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      return;
    }

    setSubmitState("success");
    router.push("/dashboard");
    router.refresh();
  }

  const buttonLabel =
    submitState === "loading"
      ? "جاري الدخول..."
      : submitState === "success"
        ? "تم بنجاح"
        : "دخول";

  return (
    <div className="page-shell">
      <div className="page-container-narrow">
        <div className="card">
          <div className="login-brand-block">
            <BrandMark variant="login" />
            <h1 className="login-title">مِقياس</h1>
            <p className="text-muted" style={{ marginBottom: 0 }}>
              قياس الأداء المؤسسي
            </p>
          </div>

          <h2 className="login-heading">تسجيل الدخول</h2>
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
            <div style={{ marginBottom: "1rem" }}>
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.25rem",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                تذكرني
              </label>
              <Link href="/forgot-password" className="text-muted" style={{ fontSize: "0.9rem" }}>
                نسيت كلمة المرور؟
              </Link>
            </div>
            <button
              type="submit"
              className="btn-primary"
              style={{ width: "100%" }}
              disabled={submitState !== "idle"}
            >
              {buttonLabel}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
