import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { createElement } from "react";
import type { ImgHTMLAttributes } from "react";

afterEach(() => {
  cleanup();
});

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => {
    // Render plain img in tests to avoid Next.js image runtime requirements.
    // eslint-disable-next-line @next/next/no-img-element
    return createElement("img", { ...props, alt: props.alt ?? "" });
  },
}));
