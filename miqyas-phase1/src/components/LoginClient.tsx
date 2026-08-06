"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import BrandMark from "@/components/BrandMark";
import { safeCallbackUrl } from "@/lib/safe-callback-url";

type SubmitState = "idle" | "loading" | "success";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  function syncFromDom() {
    const domEmail = emailRef.current?.value?.trim() ?? "";
    const domPassword = passwordRef.current?.value ?? "";
    if (domEmail && domEmail !== email) setEmail(domEmail);
    if (domPassword && domPassword !== password) setPassword(domPassword);
    return { email: domEmail || email, password: domPassword || password };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitState("loading");

    const creds = syncFromDom();

    const result = await signIn("credentials", {
      email: creds.email,
      password: creds.password,
      rememberMe: rememberMe ? "true" : "false",
      redirect: false,
    });

    if (result?.error) {
      setSubmitState("idle");
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      return;
    }

    setSubmitState("success");
    router.push(safeCallbackUrl(searchParams.get("callbackUrl")));
    router.refresh();
  }

  const buttonLabel =
    submitState === "loading"
      ? "جاري الدخول..."
      : submitState === "success"
        ? "تم بنجاح"
        : "دخول";

  return (
    <div className="page-shell login-shell">
      <div className="page-container-narrow">
        <div className="card">
          <div className="login-brand-block">
            <BrandMark variant="login" />
            <h1 className="login-title">مِقياس</h1>
            <p className="login-tagline">قياس الأداء المؤسسي</p>
          </div>

          <h2 className="login-heading">تسجيل الدخول</h2>
          <p className="login-lead">أدخل بيانات حسابك للوصول إلى المنصة</p>

          {error ? (
            <div className="alert alert-error" style={{ marginBottom: "var(--space-4)" }} role="alert">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} autoComplete="on">
            <div className="login-field">
              <label className="label-field" htmlFor="email">
                البريد الإلكتروني
              </label>
              <input
                ref={emailRef}
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
              />
            </div>
            <div className="login-field">
              <label className="label-field" htmlFor="password">
                كلمة المرور
              </label>
              <input
                ref={passwordRef}
                id="password"
                name="password"
                type="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onInput={(e) => {
                  const next = (e.target as HTMLInputElement).value;
                  setPassword(next);
                  const domEmail = emailRef.current?.value?.trim() ?? "";
                  if (domEmail && !email) setEmail(domEmail);
                }}
                required
                autoComplete="current-password"
                dir="ltr"
              />
            </div>
            <div className="login-meta-row">
              <label className="login-remember">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                تذكرني
              </label>
              <Link href="/forgot-password" className="text-muted">
                نسيت كلمة المرور؟
              </Link>
            </div>
            <button
              type="submit"
              className="btn-primary login-submit"
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
