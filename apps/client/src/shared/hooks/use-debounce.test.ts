import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebounce } from "./use-debounce";

describe("useDebounce hook", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns initial value immediately", () => {
		const { result } = renderHook(() => useDebounce("initial", 300));
		expect(result.current).toBe("initial");
	});

	it("delays updating value until delay elapses", () => {
		const { result, rerender } = renderHook(
			({ val, delay }) => useDebounce(val, delay),
			{
				initialProps: { val: "first", delay: 300 },
			},
		);

		expect(result.current).toBe("first");

		// Change input prop
		rerender({ val: "second", delay: 300 });

		// Before timeout, value remains 'first'
		act(() => {
			vi.advanceTimersByTime(200);
		});
		expect(result.current).toBe("first");

		// After timeout finishes, value updates to 'second'
		act(() => {
			vi.advanceTimersByTime(100);
		});
		expect(result.current).toBe("second");
	});
});
