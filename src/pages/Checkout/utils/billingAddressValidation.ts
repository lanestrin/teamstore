import type { IBillingAddress } from '../../../models/CheckoutModel';

export function hasBillingAddressErrors(
	billingAddress: IBillingAddress
): boolean {
	return (
		!billingAddress.firstName?.trim() ||
		!billingAddress.lastName?.trim() ||
		!billingAddress.country?.trim() ||
		!billingAddress.address1?.trim() ||
		!billingAddress.city?.trim() ||
		!billingAddress.state?.trim() ||
		!billingAddress.zip?.trim()
	);
}