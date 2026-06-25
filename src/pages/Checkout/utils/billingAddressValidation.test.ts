import { describe, expect, it } from 'vitest';
import { hasBillingAddressErrors } from '../utils/billingAddressValidation';

const validAddress = {
	billingAddressId: 0,
	m3AddressNumber: 'I000',
	firstName: 'John',
	lastName: 'Smith',
	company: '',
	countryId: 1,
	country: 'United States',
	address1: '123 Main St',
	address2: '',
	city: 'Kansas City',
	stateId: 17,
	state: 'Kansas',
	zip: '66101',
	phone: '(913)555-1212',
	email: '',
};

describe('hasBillingAddressErrors', () => {
	it('returns false for a valid billing address', () => {
		expect(
			hasBillingAddressErrors(validAddress)
		).toBe(false);
	});

	it('returns true when first name is missing', () => {
		expect(
			hasBillingAddressErrors({
				...validAddress,
				firstName: '',
			})
		).toBe(true);
	});

	it('returns true when last name is missing', () => {
		expect(
			hasBillingAddressErrors({
				...validAddress,
				lastName: '',
			})
		).toBe(true);
	});

	it('returns true when address1 is missing', () => {
		expect(
			hasBillingAddressErrors({
				...validAddress,
				address1: '',
			})
		).toBe(true);
	});

	it('returns true when city is missing', () => {
		expect(
			hasBillingAddressErrors({
				...validAddress,
				city: '',
			})
		).toBe(true);
	});

	it('returns true when state is missing', () => {
		expect(
			hasBillingAddressErrors({
				...validAddress,
				state: '',
			})
		).toBe(true);
	});

	it('returns true when zip is missing', () => {
		expect(
			hasBillingAddressErrors({
				...validAddress,
				zip: '',
			})
		).toBe(true);
	});

	it('returns true when first name contains only whitespace', () => {
		expect(
			hasBillingAddressErrors({
				...validAddress,
				firstName: '   ',
			})
		).toBe(true);
	});

	it('returns true when last name contains only whitespace', () => {
		expect(
			hasBillingAddressErrors({
				...validAddress,
				lastName: '   ',
			})
		).toBe(true);
	});

	it('returns true when address1 contains only whitespace', () => {
		expect(
			hasBillingAddressErrors({
				...validAddress,
				address1: '   ',
			})
		).toBe(true);
	});

	it('returns true when city contains only whitespace', () => {
		expect(
			hasBillingAddressErrors({
				...validAddress,
				city: '   ',
			})
		).toBe(true);
	});

	it('returns true when state contains only whitespace', () => {
		expect(
			hasBillingAddressErrors({
				...validAddress,
				state: '   ',
			})
		).toBe(true);
	});

	it('returns true when zip contains only whitespace', () => {
		expect(
			hasBillingAddressErrors({
				...validAddress,
				zip: '   ',
			})
		).toBe(true);
	});

	it('returns true when country is missing', () => {
		expect(
			hasBillingAddressErrors({
				...validAddress,
				country: '',
			})
		).toBe(true);
	});

	it('returns true when country contains only whitespace', () => {
		expect(
			hasBillingAddressErrors({
				...validAddress,
				country: '   ',
			})
		).toBe(true);
	});
});