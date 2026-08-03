import { Suspense } from "react";
import LoginClient from "@/components/LoginClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="page-shell">
          <div className="page-container-narrow">
            <div className="card">
              <p className="text-muted">جاري التحميل...</p>
            </div>
          </div>
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
