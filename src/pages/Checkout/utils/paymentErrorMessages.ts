export function getFriendlyPaymentError(
	errorMessage: string
): string {
	const error = errorMessage.toLowerCase();

	if (error.includes('card code does not match')) {
		return 'The security code (CVV) does not match the card on file.';
	}

	if (error.includes('zip code entered does not match')) {
		return 'The billing ZIP code does not match the card issuer records.';
	}

	if (
		error.includes('neither the entered street address') ||
		error.includes('address does not match')
	) {
		return 'The billing address does not match the card issuer records.';
	}

	if (error.includes('duplicate payment attempt')) {
		return 'This payment appears to have already been submitted.';
	}

	if (error.includes('insufficient funds')) {
		return 'The card was declined due to insufficient funds.';
	}

	if (error.includes('expired')) {
		return 'The card has expired.';
	}

	if (error.includes('expiry incorrect')) {
		return 'The card expiration date is invalid. Please verify the month and year and try again.';
	}

	return errorMessage;
}