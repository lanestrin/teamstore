import { getContrastTextColor, isLightColor } from "./color";

export interface StoreTheme {
	hero: {
		background: string;
		text: string;
	};

	promoBar: {
		background: string;
		text: string;
	};

	buttons: {
		primary: {
			background: string;
			text: string;
		};

		secondary: {
			background: string;
			text: string;
			border: string;
		};
	};

	logo: {
		border: string;
		text: string;
	};

	brand: {
		color: string;
		text: string;
	}
}

export function createStoreTheme(
	primaryColor: string,
	secondaryColor: string,
): StoreTheme {
	const heroText =
		getContrastTextColor(primaryColor);

	const primaryButtonText =
		getContrastTextColor(secondaryColor);

	const secondaryButtonText =
		getContrastTextColor("#FFFFFF");

	// White (or other very light colors) make poor accent colors.
	// In those cases we fall back to the primary brand color.
	const brand = isLightColor(secondaryColor)
		? primaryColor
		: secondaryColor;

	return {
		hero: {
			background: `linear-gradient(135deg, ${primaryColor}, #111827)`,
			text: heroText,
		},

		promoBar: {
			background: primaryColor,
			text: heroText,
		},

		buttons: {
			primary: {
				background: secondaryColor,
				text: primaryButtonText,
			},

			secondary: {
				background: "#FFFFFF",
				text: secondaryButtonText,
				border: "#E5E7EB",
			},
		},

		logo: {
			border: brand,
			text: brand,
		},

		brand: {
			color: brand,
			text: getContrastTextColor(brand),
		},
	};
}
