import { describe, expect, it } from 'vitest';
import { hasOrderNameErrors } from './orderNameValidation';

describe('hasOrderNameErrors', () => {
	it('returns false for a valid order name', () => {
		expect(
			hasOrderNameErrors('Summer Team Order')
		).toBe(false);
	});

	it('returns true for an empty string', () => {
		expect(
			hasOrderNameErrors('')
		).toBe(true);
	});

	it('returns true for whitespace only', () => {
		expect(
			hasOrderNameErrors('     ')
		).toBe(true);
	});

	it('returns false when the value contains leading whitespace', () => {
		expect(
			hasOrderNameErrors('   Summer Team Order')
		).toBe(false);
	});

	it('returns false when the value contains trailing whitespace', () => {
		expect(
			hasOrderNameErrors('Summer Team Order   ')
		).toBe(false);
	});
});