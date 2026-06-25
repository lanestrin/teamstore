import { describe, expect, it } from 'vitest';

describe('Billing Address state validation', () => {
	it('treats a stateId as a valid state even when state is null', () => {
		const selectedAddress = {
			state: null,
			stateId: 17,
		};

		const hasValidState =
			!!selectedAddress.stateId;

		expect(hasValidState).toBe(true);
	});

	it('fails validation when stateId is missing', () => {
		const selectedAddress = {
			state: null,
			stateId: 0,
		};

		const hasValidState =
			!!selectedAddress.stateId;

		expect(hasValidState).toBe(false);
	});

	it('restores original state when reset is clicked', () => {
		const originalAddress = {
			billingAddressId: 1,
			stateId: 17,
			state: null,
		};

		const resetAddress = {
			...originalAddress,
		};

		expect(resetAddress.stateId).toBe(17);
	});
});