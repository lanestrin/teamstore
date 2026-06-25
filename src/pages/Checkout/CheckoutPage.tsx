import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CheckoutPage.module.scss';
import CheckoutSummary from './components/CheckoutSummary';
import AddressModal from './components/AddressModal';
import PaymentSection from './components/PaymentSection';
import type { IBillingAddressOption, ICheckoutData } from '../../models/CheckoutModel';
import { hasBillingAddressErrors } from './utils/billingAddressValidation';
import { hasOrderNameErrors } from './utils/orderNameValidation';
import { getFriendlyPaymentError } from './utils/paymentErrorMessages';
import CheckoutSkeleton from './CheckoutSkeleton';
import CheckoutErrorModal from './components/CheckoutErrorModal';
import { LuShoppingBag, LuClipboardList, LuMapPin } from 'react-icons/lu';

export default function CheckoutPage() {
	const navigate = useNavigate();

	const [orderName, setOrderName] = useState('');
	const [checkoutData, setCheckoutData] = useState<ICheckoutData | null>(null);
	const [billingAddresses, setBillingAddresses] = useState<IBillingAddressOption[]>([]);

	const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
	const [selectedBillingAddress, setSelectedBillingAddress] = useState<IBillingAddressOption | null>(null);
	const [editingBillingAddress, setEditingBillingAddress] = useState<IBillingAddressOption | null>(null);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [attemptedSubmit, setAttemptedSubmit] = useState(false);
	const [showCheckoutErrorModal, setShowCheckoutErrorModal] = useState(false); //Used for network or order creation issues
	const [paymentErrorMessage, setPaymentErrorMessage] = useState(''); // Used for payment issues

	useEffect(() => {
		fetch('/Checkout/CheckoutData')
			.then(response => response.json())
			.then((data: ICheckoutData) => {
				setCheckoutData(data);
				setOrderName(data.orderName ?? '');
			})
			.catch(error => {
				console.error('Failed to load checkout data:', error);
			});
	}, []);

	useEffect(() => {
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			if (!isSubmitting) {
				return;
			}

			event.preventDefault();
			event.returnValue = '';
		};

		window.addEventListener('beforeunload', handleBeforeUnload);

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		};
	}, [isSubmitting]);

	if (!checkoutData) {
		return (
			<div className={styles.checkoutPage}>
				<div className={styles.container}>
					<CheckoutSkeleton />
				</div>
			</div>
		);
	}

	const loadBillingAddresses = async () => {
		if (billingAddresses.length === 0) {
			const response = await fetch('/Checkout/BillingAddresses');
			const data = await response.json();

			const usAddresses = data.filter(
				(address: IBillingAddressOption) => address.countryId === 220
			);

			setBillingAddresses(usAddresses);

			setEditingBillingAddress(
				selectedBillingAddress
					? { ...selectedBillingAddress }
					: {
						...checkoutData.billingAddress,
						address2: checkoutData.billingAddress.address2 ?? '',
						email: checkoutData.billingAddress.email ?? '',
					}
			);
		}
		else {
			setEditingBillingAddress(
				selectedBillingAddress
					? { ...selectedBillingAddress }
					: {
						...checkoutData.billingAddress,
						address2: checkoutData.billingAddress.address2 ?? '',
						email: checkoutData.billingAddress.email ?? '',
					}
			);
		}

		setIsAddressModalOpen(true);
	};

	const itemCount = checkoutData.items.reduce(
		(count, item) => count + item.quantity,
		0
	);

	const billingAddress = selectedBillingAddress ?? checkoutData.billingAddress;

	const billingAddressHasErrors = hasBillingAddressErrors(billingAddress);

	const hasPaymentErrors = () => {
		if (checkoutData?.isNet30) {
			return false;
		}

		return !(
			(document.getElementById('payment__cardHolderName') as HTMLInputElement)?.value &&
			(document.getElementById('payment__cardNumber') as HTMLInputElement)?.value &&
			(document.getElementById('payment__expiration__month') as HTMLInputElement)?.value &&
			(document.getElementById('payment__expiration__year') as HTMLInputElement)?.value &&
			(document.getElementById('payment__expiration__cvs') as HTMLInputElement)?.value
		);
	};

	const testSubmitOrder = async () => {
		setPaymentErrorMessage('');
		setAttemptedSubmit(true);

		if (hasOrderNameErrors(orderName)) {
			return;
		}

		if (hasBillingAddressErrors(billingAddress)) {
			return;
		}

		if (hasPaymentErrors()) {
			return;
		}

		if (isSubmitting) {
			return;
		}

		setShowCheckoutErrorModal(false);
		setIsSubmitting(true);

		try {
			const response = await fetch('/Checkout/SubmitOrder', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},

				body: JSON.stringify({
					orderName: orderName,
					billingAddress: billingAddress,
					payment: {
						cardHolderName:
							(document.getElementById(
								'payment__cardHolderName'
							) as HTMLInputElement)?.value,

						creditCardNumber:
							(document.getElementById(
								'payment__cardNumber'
							) as HTMLInputElement)?.value,

						expirationMonth:
							(document.getElementById(
								'payment__expiration__month'
							) as HTMLInputElement)?.value,

						expirationYear:
							(document.getElementById(
								'payment__expiration__year'
							) as HTMLInputElement)?.value,

						cvv2Code:
							(document.getElementById(
								'payment__expiration__cvs'
							) as HTMLInputElement)?.value,
					},
				}),
			});

			const result = await response.json();

			console.log(result);

			if (result.success) {
				setPaymentErrorMessage('');
				setShowCheckoutErrorModal(false);

				window.dispatchEvent(
					new Event('cartUpdated')
				);

				navigate(
					`/checkout/thank-you/${result.orderId}`,
					{
						state: {
							items: checkoutData.items,
							subtotal: checkoutData.subtotal,
							salesTax: checkoutData.salesTax,
							total: checkoutData.total,
						},
					}
				);

				return;
			}

			// Backend returned a failure but did not provide a reason.
			// Treat this as an order-processing issue and direct the
			// customer to support instead of implying a payment failure.
			if (!result.errorMessage) {
				setShowCheckoutErrorModal(true);
				return;
			}

			setPaymentErrorMessage(
				getFriendlyPaymentError(
					result.errorMessage
				)
			);
		}
		catch (error) {
			console.error(error);

			setShowCheckoutErrorModal(true);
		}
		finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<div className={styles.checkoutPage}>
				<div className={styles.container}>
					<div className={styles.header}>
						<div>
							<h1 className={styles.title}>
								Checkout
							</h1>

							<p className={styles.subtitle}>
								Review your order and complete your purchase.
							</p>
						</div>
					</div>

					<div className={styles.layout}>
						<div className={styles.contentColumn}>
							<section className={styles.card}>
								<div className={styles.cardHeader}>
									<div className={styles.cardHeaderContent}>
										<div className={styles.cardIcon}>
											<LuShoppingBag />
										</div>

										<div>
											<h2 className={styles.cardTitle}>
												Review Order
											</h2>

											<p className={styles.cardSubtitle}>
												Confirm your order details before payment.
											</p>
										</div>
									</div>

									<button
										type="button"
										className={styles.secondaryButton}
										onClick={() => {
											navigate('/cart');
										}}
									>
										Edit Cart
									</button>
								</div>

								<div className={styles.itemList}>
									{checkoutData.items.map(item => (
										<div
											key={item.id}
											className={styles.reviewItem}
										>
											<div className={styles.itemImageWrap}>
												<img
													src={item.imageUrl}
													alt={item.name}
													className={styles.itemImage}
												/>
											</div>

											<div className={styles.itemContent}>
												<div className={styles.itemTopRow}>
													<div>
														<span className={styles.itemName}>
															{item.name}
														</span>

														<p className={styles.itemDetails}>
															{item.details}
														</p>

														{(item.personalizationName || item.personalizationNumber) && (
															<div className={styles.personalization}>
																{item.personalizationName && (
																	<div>
																		Name: {item.personalizationName}
																	</div>
																)}

																{item.personalizationNumber && (
																	<div>
																		Number: {item.personalizationNumber}
																	</div>
																)}
															</div>
														)}
													</div>

													<div className={styles.itemPrice}>
														${(item.price * item.quantity).toFixed(2)}
													</div>
												</div>

												<div className={styles.itemBottomRow}>
													<span>
														Qty {item.quantity}
													</span>

													<span>
														${item.price.toFixed(2)} each
													</span>
												</div>
											</div>
										</div>
									))}
								</div>
							</section>

							<section className={styles.card}>
								<div className={styles.cardHeader}>
									<div className={styles.cardHeaderContent}>
										<div className={styles.cardIcon}>
											<LuClipboardList />
										</div>

										<div>
											<h2 className={styles.cardTitle}>
												Order Information
											</h2>

											{attemptedSubmit && hasOrderNameErrors(orderName) ? (
												<p className={styles.validationMessage}>
													Required to continue checkout.
												</p>
											) : (
												<p className={styles.cardSubtitle}>
													Give this order a name for future reference.
												</p>
											)}
										</div>
									</div>
								</div>

								<div className={styles.fieldGroup}>
									<label
										htmlFor="order-name"
										className={styles.label}
									>
										Order Name
										<span
											className={
												attemptedSubmit && hasOrderNameErrors(orderName)
													? styles.requiredError
													: styles.required
											}
										>
											*
										</span>
									</label>

									<input
										id="order-name"
										type="text"
										className={`${styles.input} ${attemptedSubmit && hasOrderNameErrors(orderName)
											? styles.inputError
											: ''
											}`}
										value={orderName}
										onChange={event => {
											setOrderName(event.target.value);
										}}
									/>
								</div>
							</section>

							<section className={styles.card}>
								<div className={styles.cardHeader}>
									<div className={styles.cardHeaderContent}>
										<div className={styles.cardIcon}>
											<LuMapPin />
										</div>

										<div>
											<h2 className={styles.cardTitle}>
												Billing Address
											</h2>

											{attemptedSubmit && billingAddressHasErrors ? (
												<p className={styles.validationMessage}>
													Address information is incomplete.
												</p>
											) : (
												<p className={styles.cardSubtitle}>
													This address will be used for payment verification.
												</p>
											)}
										</div>
									</div>

									<button
										type="button"
										className={styles.secondaryButton}
										onClick={loadBillingAddresses}
									>
										Edit Address
									</button>
								</div>

								<div
									className={`${styles.addressCard} ${attemptedSubmit && billingAddressHasErrors
										? styles.addressError
										: ''
										}`}
								>
									<div>
										<strong>
											{billingAddress.firstName} {billingAddress.lastName}
										</strong>

										{billingAddress.company && (
											<p>
												{billingAddress.company}
											</p>
										)}

										<p>
											{billingAddress.address1}
										</p>

										<p>
											{billingAddress.city}, {billingAddress.state} {billingAddress.zip}
										</p>

										<p>
											{billingAddress.country}
										</p>

										{billingAddress.phone && (
											<p>
												{billingAddress.phone}
											</p>
										)}
									</div>
								</div>
							</section>

							{checkoutData.isNet30 ? (
								<section className={styles.card}>
									<div className={styles.cardHeader}>
										<div className={styles.cardHeaderContent}>
											<div>
												<h2 className={styles.cardTitle}>
													Payment Information
												</h2>

												<p className={styles.cardSubtitle}>
													This store is configured for Net 30 billing. No credit card is required.
												</p>
											</div>
										</div>
									</div>
								</section>
							) : (
								<div
									className={
										attemptedSubmit && (hasPaymentErrors() || paymentErrorMessage)
											? styles.paymentErrorWrapper
											: ''
									}
								>
									<PaymentSection
										hasPaymentErrors={hasPaymentErrors()}
										attemptedSubmit={attemptedSubmit}
										paymentErrorMessage={paymentErrorMessage}
									/>
								</div>
							)}
						</div>

						<AddressModal
							isOpen={isAddressModalOpen}
							addresses={billingAddresses}
							selectedAddress={
								editingBillingAddress ??
								selectedBillingAddress ??
								({
									...checkoutData.billingAddress,
									address2: checkoutData.billingAddress.address2 ?? '',
									email: checkoutData.billingAddress.email ?? '',
								} as IBillingAddressOption)
							}
							onClose={() => {
								setIsAddressModalOpen(false);
							}}
							onSelectAddress={address => {
								setEditingBillingAddress({ ...address });
							}}
							onAddressChange={address => {
								setEditingBillingAddress({ ...address });
							}}
							onUseAddress={address => {
								setEditingBillingAddress({ ...address });
								setSelectedBillingAddress({ ...address });
								setIsAddressModalOpen(false);
							}}
							onResetAddress={() => {
								if (!editingBillingAddress) {
									return;
								}

								if (editingBillingAddress.billingAddressId < 0) {
									setEditingBillingAddress({
										...checkoutData.billingAddress,
										address2: checkoutData.billingAddress.address2 ?? '',
										email: checkoutData.billingAddress.email ?? '',
									});

									return;
								}

								const original = billingAddresses.find(
									address =>
										address.billingAddressId ===
										editingBillingAddress.billingAddressId
								);

								if (original) {
									setEditingBillingAddress({ ...original });
								}
							}}
						/>

						<CheckoutSummary
							itemCount={itemCount}
							subtotal={checkoutData.subtotal}
							salesTax={checkoutData.salesTax ?? 0}
							total={checkoutData.total ?? checkoutData.subtotal}
							isSubmitting={isSubmitting}
							onCompleteOrder={testSubmitOrder}
						/>
					</div>
				</div>
			</div>

			{showCheckoutErrorModal &&
				<CheckoutErrorModal
					isOpen={showCheckoutErrorModal}
					onClose={() => {
						setShowCheckoutErrorModal(false);
					}}
				/>
			}

		</>
	);
}
