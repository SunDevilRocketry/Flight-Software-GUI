import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

Object.defineProperty(window, "scrollTo", { writable: true, value: vi.fn() });

vi.stubGlobal("AudioContext", class {
  currentTime = 0;
  destination = {};
});
vi.stubGlobal("OscillatorNode", class {
  onended: (() => void) | null = null;
  connect() { return this; }
  disconnect() {}
  start() {}
  stop() {}
});
vi.stubGlobal("GainNode", class {
  gain = { exponentialRampToValueAtTime: vi.fn() };
  connect() { return this; }
  disconnect() {}
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
