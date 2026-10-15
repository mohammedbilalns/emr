import { useEffect, useState } from "react";

/**
 * Delays updating a value until after the specified delay has elapsed without new changes.
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedValue(value);
		}, delayMs);

		return () => {
			clearTimeout(timer);
		};
	}, [value, delayMs]);

	return debouncedValue;
}
