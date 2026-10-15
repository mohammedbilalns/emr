/**
 * Escapes special regular expression characters in user input to prevent ReDoS and pattern syntax errors.
 */
export function escapeRegex(input: string): string {
	return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
