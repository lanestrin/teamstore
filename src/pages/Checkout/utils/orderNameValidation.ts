export function hasOrderNameErrors(
	orderName: string
): boolean {
	return !orderName.trim();
}