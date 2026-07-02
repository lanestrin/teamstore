/* ==========================================================
	 Color Utilities

	 Shared helper functions for building dynamic store themes.

	 These utilities are framework agnostic and contain no
	 React-specific logic.
	 ========================================================== */

export interface RgbColor {
	r: number;
	g: number;
	b: number;
}

/* ==========================================================
	 Conversion
	 ========================================================== */

export function hexToRgb(hex: string): RgbColor {
	const normalized = normalizeHex(hex);

	return {
		r: parseInt(normalized.substring(0, 2), 16),
		g: parseInt(normalized.substring(2, 4), 16),
		b: parseInt(normalized.substring(4, 6), 16),
	};
}

export function rgbToHex({
	r,
	g,
	b,
}: RgbColor): string {
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/* ==========================================================
	 Brightness
	 ========================================================== */

export function getBrightness(hex: string): number {
	const { r, g, b } = hexToRgb(hex);

	return (r * 299 + g * 587 + b * 114) / 1000;
}

export function isDarkColor(hex: string): boolean {
	return getBrightness(hex) < 155;
}

export function isLightColor(hex: string): boolean {
	return !isDarkColor(hex);
}

/* ==========================================================
	 Contrast
	 ========================================================== */

export function getContrastTextColor(
	backgroundColor: string,
): string {
	return isDarkColor(backgroundColor)
		? "#FFFFFF"
		: "#111827";
}

/* ==========================================================
	 Private Helpers
	 ========================================================== */

function normalizeHex(hex: string): string {
	const normalized = hex.replace("#", "").trim();

	if (normalized.length === 3) {
		return normalized
			.split("")
			.map((value) => value + value)
			.join("");
	}

	return normalized;
}

function toHex(value: number): string {
	return Math.max(0, Math.min(255, value))
		.toString(16)
		.padStart(2, "0");
}
