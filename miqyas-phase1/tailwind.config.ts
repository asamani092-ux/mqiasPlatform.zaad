import type { Config } from "tailwindcss";
import zaadPreset from "@zaad/design-system/tailwind.preset";

/**
 * Tailwind على preset نظام الزاد — preflight معطّل لعدم كسر CSS الحالي.
 */
const config: Config = {
  presets: [zaadPreset as Config],
  content: ["./src/**/*.{ts,tsx,js,jsx}"],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
