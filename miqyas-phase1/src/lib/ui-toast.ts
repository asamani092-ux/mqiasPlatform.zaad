import { toast } from "sonner";

export type ToastDuration = "short" | "normal" | "long";

const DURATION_MS: Record<ToastDuration, number> = {
  short: 2500,
  normal: 4000,
  long: 7000,
};

type ToastOpts = {
  duration?: ToastDuration;
  description?: string;
};

function ms(duration?: ToastDuration) {
  return DURATION_MS[duration ?? "normal"];
}

/** طبقة تنبيه موحّدة — إخفاء تلقائي حسب المدة */
export const notifyToast = {
  success(message: string, opts: ToastOpts = {}) {
    return toast.success(message, { duration: ms(opts.duration), description: opts.description });
  },
  error(message: string, opts: ToastOpts = {}) {
    return toast.error(message, { duration: ms(opts.duration ?? "long"), description: opts.description });
  },
  warning(message: string, opts: ToastOpts = {}) {
    return toast.warning(message, { duration: ms(opts.duration), description: opts.description });
  },
  info(message: string, opts: ToastOpts = {}) {
    return toast.message(message, { duration: ms(opts.duration), description: opts.description });
  },
};
