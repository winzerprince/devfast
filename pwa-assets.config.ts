import { defineConfig } from "@vite-pwa/assets-generator/config";

export default defineConfig({
  preset: {
    transparent: {
      sizes: [192, 512],
      favicons: [[64, "favicon.ico"]],
      padding: 0.15,
      resizeOptions: { background: "#f97316" },
    },
    maskable: {
      sizes: [512],
      padding: 0.1,
      resizeOptions: { background: "#ffffff" },
    },
    apple: {
      sizes: [180],
      padding: 0.15,
      resizeOptions: { background: "#f97316" },
    },
  },
  images: "public/logo.png",
});
