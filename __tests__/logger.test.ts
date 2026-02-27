import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
vi.stubGlobal("fetch", mockFetch);

// Mock expo-constants
vi.mock("expo-constants", () => ({
  default: { expoConfig: { version: "1.0.0" } },
}));

// Mock react-native Platform
vi.mock("react-native", () => ({
  Platform: { OS: "android" },
}));

describe("Logger Service", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should import logger without crashing", async () => {
    const { logger } = await import("../lib/logger");
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.fatal).toBe("function");
    expect(typeof logger.captureError).toBe("function");
    expect(typeof logger.screen).toBe("function");
    expect(typeof logger.apiCall).toBe("function");
  });

  it("should flush immediately on error level", async () => {
    const { logger, flushLogs } = await import("../lib/logger");
    logger.error("api", "Test error message", { code: 500 });
    // Error logs trigger immediate flush
    await vi.runAllTimersAsync();
    // fetch should have been called
    expect(mockFetch).toHaveBeenCalled();
  });

  it("should set and clear logger user context", async () => {
    const { setLoggerUser, clearLoggerUser } = await import("../lib/logger");
    expect(() => setLoggerUser({ userId: "123", userEmail: "test@test.com" })).not.toThrow();
    expect(() => clearLoggerUser()).not.toThrow();
  });

  it("should capture Error objects", async () => {
    const { logger } = await import("../lib/logger");
    const err = new Error("Test error");
    expect(() => logger.captureError("crash", err, { context: "test" })).not.toThrow();
  });

  it("should log navigation screen", async () => {
    const { logger } = await import("../lib/logger");
    expect(() => logger.screen("Dashboard")).not.toThrow();
  });

  it("should log API calls with correct level", async () => {
    const { logger } = await import("../lib/logger");
    expect(() => logger.apiCall("GET", "/api/users", 200, 150)).not.toThrow();
    expect(() => logger.apiCall("POST", "/api/login", 401, 50)).not.toThrow();
  });

  it("flushLogs should not throw when queue is empty", async () => {
    const { flushLogs } = await import("../lib/logger");
    await expect(flushLogs()).resolves.not.toThrow();
  });
});
