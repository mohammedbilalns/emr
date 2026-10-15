/**
 * Transforms raw or mechanical validation error messages into human-friendly phrases.
 */
export function formatFriendlyErrorMessage(
	message: string,
	fieldName?: string,
): string {
	const prefix = fieldName
		? `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} `
		: "";

	// Match: "Too small: expected string to have >=2 characters"
	const minStringMatch = /expected string to have >=(\d+) characters/i.exec(
		message,
	);
	if (minStringMatch) {
		return prefix
			? `${prefix}must be at least ${minStringMatch[1]} characters`
			: `Must be at least ${minStringMatch[1]} characters`;
	}

	// Match: "Too big: expected string to have <=80 characters"
	const maxStringMatch = /expected string to have <=(\d+) characters/i.exec(
		message,
	);
	if (maxStringMatch) {
		return prefix
			? `${prefix}cannot exceed ${maxStringMatch[1]} characters`
			: `Cannot exceed ${maxStringMatch[1]} characters`;
	}

	// Match: "Too small: expected number to have >=5"
	const minNumMatch = /expected number to have >=(\d+)/i.exec(message);
	if (minNumMatch) {
		return prefix
			? `${prefix}must be at least ${minNumMatch[1]}`
			: `Must be at least ${minNumMatch[1]}`;
	}

	// Match: "Too big: expected number to have <=60"
	const maxNumMatch = /expected number to have <=(\d+)/i.exec(message);
	if (maxNumMatch) {
		return prefix
			? `${prefix}cannot exceed ${maxNumMatch[1]}`
			: `Cannot exceed ${maxNumMatch[1]}`;
	}

	// Match: "Invalid email"
	if (/invalid email/i.test(message)) {
		return "Please enter a valid email address";
	}

	// Match: "Expected string, received" or "Required"
	if (
		/^required$/i.test(message) ||
		/expected (?:string|number), received (?:undefined|null)/i.test(message)
	) {
		return prefix ? `${prefix}is required` : "This field is required";
	}

	return message;
}
