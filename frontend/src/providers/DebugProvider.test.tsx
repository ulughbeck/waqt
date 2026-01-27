import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, renderHook } from "@solidjs/testing-library";
import { DebugProvider, useDebug } from "./DebugProvider";

const STORAGE_KEY = "waqt.debug";

describe("DebugProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("provides default state", () => {
    const { result } = renderHook(() => useDebug(), { wrapper: DebugProvider });
    
    expect(result.state().enabled).toBe(false);
    expect(result.state().timeOverride.active).toBe(false);
    expect(result.state().timeOverride.speed).toBe(1);
    expect(result.state().locationOverride.active).toBe(false);
  });

  it("updates enabled state", () => {
    const { result } = renderHook(() => useDebug(), { wrapper: DebugProvider });
    
    result.setEnabled(true);
    expect(result.state().enabled).toBe(true);
  });

  it("persists state to localStorage", () => {
    const { result } = renderHook(() => useDebug(), { wrapper: DebugProvider });
    
    result.setEnabled(true);
    
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.enabled).toBe(true);
  });

  it("loads state from localStorage on mount", () => {
    const storedState = {
      enabled: true,
      timeOverride: { active: true, speed: 10, date: "2026-01-01", time: "12:00" },
      locationOverride: { active: true, lat: 10, lon: 20, timezone: "UTC" }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedState));

    const { result } = renderHook(() => useDebug(), { wrapper: DebugProvider });
    
    expect(result.state().enabled).toBe(true);
    expect(result.state().timeOverride.active).toBe(true);
    expect(result.state().timeOverride.speed).toBe(10);
    expect(result.state().locationOverride.lat).toBe(10);
  });

  it("updates time override", () => {
    const { result } = renderHook(() => useDebug(), { wrapper: DebugProvider });
    
    result.setTimeOverride({ active: true, speed: 60 });
    
    expect(result.state().timeOverride.active).toBe(true);
    expect(result.state().timeOverride.speed).toBe(60);
  });

  it("updates location override", () => {
    const { result } = renderHook(() => useDebug(), { wrapper: DebugProvider });
    
    result.setLocationOverride({ active: true, lat: 50, lon: -5 });
    
    expect(result.state().locationOverride.active).toBe(true);
    expect(result.state().locationOverride.lat).toBe(50);
    expect(result.state().locationOverride.lon).toBe(-5);
  });

  it("reset restores default state", () => {
    const { result } = renderHook(() => useDebug(), { wrapper: DebugProvider });
    
    result.setEnabled(true);
    result.setTimeOverride({ active: true, speed: 60 });
    result.setLocationOverride({ active: true });
    
    result.reset();
    
    expect(result.state().enabled).toBe(false);
    expect(result.state().timeOverride.active).toBe(false);
    expect(result.state().timeOverride.speed).toBe(1);
    expect(result.state().locationOverride.active).toBe(false);
  });
});
