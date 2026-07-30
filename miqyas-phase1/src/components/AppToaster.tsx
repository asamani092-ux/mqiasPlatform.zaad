"use client";

import { Toaster } from "sonner";

export default function AppToaster() {
  return (
    <Toaster
      position="top-center"
      dir="rtl"
      richColors
      closeButton
      expand
      duration={4000}
      gap={10}
      toastOptions={{
        classNames: {
          toast: "app-toast",
          title: "app-toast-title",
          description: "app-toast-desc",
          success: "app-toast--success",
          error: "app-toast--error",
          warning: "app-toast--warning",
        },
      }}
    />
  );
}
