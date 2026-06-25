import React from 'react';
import { useEffect } from 'react';
import styles from './PaymentSection.module.scss';
import startCheckout from '../AdyenCard';
import { HiOutlineCreditCard } from 'react-icons/hi';

interface IPaymentSection {
	hasPaymentErrors: boolean;
	attemptedSubmit: boolean;
	paymentErrorMessage?: string;
}

export default function PaymentSection({
	hasPaymentErrors,
	attemptedSubmit,
	paymentErrorMessage,
}: IPaymentSection) {
	useEffect(() => {
		startCheckout();
	}, []);

	return (
		<section className={`card card--padded ${styles.paymentSection}`}>
			<div className={styles.cardHeader}>
				<div className={styles.cardHeaderContent}>
					<div className={styles.cardIcon}>
						<HiOutlineCreditCard />
					</div>

					<div>
						<h2 className={styles.cardTitle}>
							Payment Information
						</h2>

						{paymentErrorMessage ? (
							<p className={styles.validationMessage}>
								{paymentErrorMessage}
							</p>
						) : attemptedSubmit && hasPaymentErrors ? (
							<p className={styles.validationMessage}>
								Payment information is required.
							</p>
						) : (
							<p className={styles.cardSubtitle}>
								Secure payment processing powered by Adyen.
							</p>
						)}
					</div>
				</div>
			</div>

			<div
				id="payment"
				className={styles.cardContainer}
			/>

			<input
				type="hidden"
				id="payment__cardHolderName"
			/>

			<input
				type="hidden"
				id="payment__cardNumber"
			/>

			<input
				type="hidden"
				id="payment__expiration__month"
			/>

			<input
				type="hidden"
				id="payment__expiration__year"
			/>

			<input
				type="hidden"
				id="payment__expiration__cvs"
			/>
		</section>
	);
}