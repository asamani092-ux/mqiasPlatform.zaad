"use client";

import { Toaster } from "sonner";

export default function AppToaster() {
  return (
    <Toaster
      position="top-center"
      dir="rtl"
      richColors
      expand
      duration={4000}
      toastOptions={{
        classNames: {
          toast: "tmkeen-toast",
        },
      }}
    />
  );
}
