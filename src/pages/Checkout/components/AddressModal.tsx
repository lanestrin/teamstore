import { useState, useEffect } from 'react';
import type { IBillingAddressOption, IStateOption } from '../../../models/CheckoutModel';
import styles from './AddressModal.module.scss';
import { FiX } from 'react-icons/fi';

interface IAddressModalProps {
	isOpen: boolean;
	addresses: IBillingAddressOption[];
	selectedAddress: IBillingAddressOption;
	onClose: () => void;
	onSelectAddress: (address: IBillingAddressOption) => void;
	onAddressChange: (address: IBillingAddressOption) => void;
	onUseAddress: (address: IBillingAddressOption) => void;
	onResetAddress: () => void;
}

export default function AddressModal({
	isOpen,
	addresses,
	selectedAddress,
	onClose,
	onSelectAddress,
	onAddressChange,
	onUseAddress,
	onResetAddress,
}: IAddressModalProps) {
	const [attemptedSubmit, setAttemptedSubmit] = useState(false);
	const [states, setStates] = useState<IStateOption[]>([]);
	const [showNewAddressForm, setShowNewAddressForm] = useState(false);

	useEffect(() => {
		const loadStates = async () => {
			try {
				const response = await fetch('/Checkout/BillingStates');
				const data = await response.json();

				setStates(data);
			}
			catch (error) {
				console.error('Failed to load states', error);
			}
		};

		loadStates();
	}, []);

	useEffect(() => {
		if (isOpen) {
			setAttemptedSubmit(false);
			setShowNewAddressForm(selectedAddress.billingAddressId < 0);
		}
	}, [isOpen, selectedAddress.billingAddressId]);

	if (!isOpen) return null;

	const getAddressKey = (address: IBillingAddressOption) =>
		`${address.billingAddressId}-${address.m3AddressNumber}-${address.address1}`;

	const getNextM3AddressNumber = () => {
		let maxAddressNumber = 0;

		addresses.forEach(address => {
			const match = address.m3AddressNumber?.match(/^I(\d+)$/i);

			if (!match) {
				return;
			}

			const value = parseInt(match[1], 10);

			if (!isNaN(value) && value > maxAddressNumber) {
				maxAddressNumber = value;
			}
		});

		return `I${(maxAddressNumber + 1).toString().padStart(3, '0')}`;
	};

	const createNewBillingAddress = () => {
		setAttemptedSubmit(false);
		setShowNewAddressForm(true);

		onSelectAddress({
			billingAddressId: -1,
			m3AddressNumber: getNextM3AddressNumber(),

			firstName: '',
			lastName: '',

			company: '',

			countryId: 220,
			country: 'United States',

			address1: '',
			address2: '',

			city: '',

			stateId: 0,
			state: '',

			zip: '',
			phone: '',
			email: '',
		});
	};

	const selectedState = states.find(
		state =>
			state.id === selectedAddress.stateId ||
			state.name === selectedAddress.state
	);

	const selectedStateValue = selectedState
		? selectedState.id.toString()
		: '';

	const phoneDigits =
		(selectedAddress.phone ?? '').replace(/\D/g, '');

	const zipRegex = /^\d{5}(-\d{4})?$/;

	const zipIsInvalid =
		attemptedSubmit &&
		!!selectedAddress.zip?.trim() &&
		!zipRegex.test(selectedAddress.zip.trim());

	const phoneIsInvalid =
		attemptedSubmit &&
		!!selectedAddress.phone?.trim() &&
		phoneDigits.length !== 10;

	const handleUseAddress = () => {
		setAttemptedSubmit(true);

		if (!showNewAddressForm) {
			onUseAddress({ ...selectedAddress });
			return;
		}

		const phoneDigits =
			(selectedAddress.phone ?? '').replace(/\D/g, '');

		if (
			!selectedAddress.firstName?.trim() ||
			!selectedAddress.lastName?.trim() ||
			!selectedAddress.address1?.trim() ||
			!selectedAddress.city?.trim() ||
			!selectedAddress.stateId ||
			!selectedAddress.zip?.trim() ||
			!selectedAddress.phone?.trim()
		) {
			return;
		}

		if (!zipRegex.test(selectedAddress.zip.trim())) {
			return;
		}

		if (phoneDigits.length !== 10) {
			return;
		}

		const state = states.find(
			stateOption => stateOption.id === selectedAddress.stateId
		);

		onUseAddress({
			...selectedAddress,
			state: state ? state.name : selectedAddress.state,
			country: 'United States',
			countryId: 220,
		});
	};

	const formatPhoneNumber = (value: string) => {
		const digits = value.replace(/\D/g, '').slice(0, 10);

		if (digits.length <= 3) {
			return digits;
		}

		if (digits.length <= 6) {
			return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
		}

		return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
	};

	return (
		<div className={styles.overlay}>
			<div
				className={styles.modal}
				onClick={event => {
					event.stopPropagation();
				}}
			>
				<div className={styles.header}>
					<h2 className={styles.title}>
						Billing Address
					</h2>

					<button
						type="button"
						className={styles.closeButton}
						onClick={onClose}
						aria-label="Close address modal"
					>
						<FiX />
					</button>
				</div>

				{!showNewAddressForm && (
					<div className={styles.fieldGroup}>
						<label
							htmlFor="saved-address"
							className={styles.label}
						>
							Saved Address
						</label>

						<select
							id="saved-address"
							className={styles.select}
							value={getAddressKey(selectedAddress)}
							onChange={event => {
								const selected = addresses.find(
									address =>
										getAddressKey(address) === event.target.value
								);

								if (selected) {
									onSelectAddress({ ...selected });
								}
							}}
						>
							{addresses.map(address => (
								<option
									key={getAddressKey(address)}
									value={getAddressKey(address)}
								>
									{address.firstName} {address.lastName} - {address.address1}
								</option>
							))}
						</select>

						<button
							type="button"
							className={styles.resetAddressButton}
							onClick={createNewBillingAddress}
						>
							New Billing Address
						</button>
					</div>
				)}

				{showNewAddressForm && (
					<div className={styles.formGrid}>
						<div className={styles.fieldGroup}>
							<label className={styles.label}>
								First Name
								<span className={attemptedSubmit && !selectedAddress.firstName?.trim() ? styles.requiredError : styles.required}>
									*
								</span>
							</label>

							<input
								type="text"
								className={`${styles.input} ${attemptedSubmit && !selectedAddress.firstName?.trim() ? styles.inputError : ''}`}
								value={selectedAddress.firstName}
								onChange={event =>
									onAddressChange({
										...selectedAddress,
										firstName: event.target.value,
									})
								}
							/>
						</div>

						<div className={styles.fieldGroup}>
							<label className={styles.label}>
								Last Name
								<span className={attemptedSubmit && !selectedAddress.lastName?.trim() ? styles.requiredError : styles.required}>
									*
								</span>
							</label>

							<input
								type="text"
								className={`${styles.input} ${attemptedSubmit && !selectedAddress.lastName?.trim() ? styles.inputError : ''}`}
								value={selectedAddress.lastName}
								onChange={event =>
									onAddressChange({
										...selectedAddress,
										lastName: event.target.value,
									})
								}
							/>
						</div>

						<div className={styles.fieldGroupFull}>
							<label className={styles.label}>
								Organization
							</label>

							<input
								type="text"
								className={styles.input}
								value={selectedAddress.company ?? ''}
								onChange={event =>
									onAddressChange({
										...selectedAddress,
										company: event.target.value,
									})
								}
							/>
						</div>

						<div className={styles.fieldGroupFull}>
							<label className={styles.label}>
								Address 1
								<span className={attemptedSubmit && !selectedAddress.address1?.trim() ? styles.requiredError : styles.required}>
									*
								</span>
							</label>

							<input
								type="text"
								className={`${styles.input} ${attemptedSubmit && !selectedAddress.address1?.trim() ? styles.inputError : ''}`}
								value={selectedAddress.address1}
								onChange={event =>
									onAddressChange({
										...selectedAddress,
										address1: event.target.value,
									})
								}
							/>
						</div>

						<div className={styles.fieldGroupFull}>
							<label className={styles.label}>
								Address 2
							</label>

							<input
								type="text"
								className={styles.input}
								value={selectedAddress.address2 ?? ''}
								onChange={event =>
									onAddressChange({
										...selectedAddress,
										address2: event.target.value,
									})
								}
							/>
						</div>

						<div className={styles.fieldGroup}>
							<label className={styles.label}>
								City
								<span className={attemptedSubmit && !selectedAddress.city?.trim() ? styles.requiredError : styles.required}>
									*
								</span>
							</label>

							<input
								type="text"
								className={`${styles.input} ${attemptedSubmit && !selectedAddress.city?.trim() ? styles.inputError : ''}`}
								value={selectedAddress.city}
								onChange={event =>
									onAddressChange({
										...selectedAddress,
										city: event.target.value,
									})
								}
							/>
						</div>

						<div className={styles.fieldGroup}>
							<label className={styles.label}>
								State
								<span
									className={attemptedSubmit && !selectedAddress.stateId ? styles.requiredError : styles.required}
								>
									*
								</span>
							</label>

							<select
								className={`${styles.select} ${attemptedSubmit && !selectedAddress.stateId ? styles.inputError : ''}`}
								value={selectedStateValue}
								onChange={event => {
									const state = states.find(
										stateOption => stateOption.id.toString() === event.target.value
									);

									onAddressChange({
										...selectedAddress,
										stateId: state ? state.id : 0,
										state: state ? state.name : '',
									});
								}}
							>
								<option value="">Select State</option>

								{states.map(state => (
									<option
										key={state.id}
										value={state.id.toString()}
									>
										{state.name}
									</option>
								))}
							</select>
						</div>

						<div className={styles.fieldGroup}>
							<label className={styles.label}>
								Country
							</label>

							<select
								className={styles.select}
								value={selectedAddress.countryId}
								onChange={() =>
									onAddressChange({
										...selectedAddress,
										countryId: 220,
										country: 'United States',
									})
								}
							>
								<option value={220}>
									United States
								</option>
							</select>
						</div>

						<div className={styles.fieldGroup}>
							<label className={styles.label}>
								Zip Code
								<span className={attemptedSubmit && !selectedAddress.zip?.trim() ? styles.requiredError : styles.required}>
									*
								</span>
							</label>

							<input
								type="text"
								className={`${styles.input} ${(attemptedSubmit && !selectedAddress.zip?.trim()) || zipIsInvalid ? styles.inputError : ''}`}
								value={selectedAddress.zip}
								onChange={event =>
									onAddressChange({
										...selectedAddress,
										zip: event.target.value,
									})
								}
							/>

							{zipIsInvalid && (
								<p className={styles.validationMessage}>
									Please enter a valid ZIP code.
								</p>
							)}
						</div>

						<div className={styles.fieldGroup}>
							<label className={styles.label}>
								Phone Number
								<span className={attemptedSubmit && !selectedAddress.phone?.trim() ? styles.requiredError : styles.required}>
									*
								</span>
							</label>

							<input
								type="text"
								className={`${styles.input} ${(attemptedSubmit && !selectedAddress.phone?.trim()) || phoneIsInvalid ? styles.inputError : ''}`}
								value={selectedAddress.phone ?? ''}
								onChange={event =>
									onAddressChange({
										...selectedAddress,
										phone: formatPhoneNumber(event.target.value),
									})
								}
							/>

							{phoneIsInvalid && (
								<p className={styles.validationMessage}>
									Please enter a valid 10-digit phone number.
								</p>
							)}
						</div>
					</div>
				)}

				<div className={styles.actions}>
					<button
						type="button"
						className={styles.cancelButton}
						onClick={() => {
							if (showNewAddressForm) {
								setAttemptedSubmit(false);
								setShowNewAddressForm(false);
								onResetAddress();
								return;
							}

							onClose();
						}}
					>
						Cancel
					</button>

					<button
						type="button"
						className={styles.primaryButton}
						onClick={handleUseAddress}
					>
						Use This Address
					</button>
				</div>
			</div>
		</div>
	);
}
