import React, { type JSX } from 'react';
import {
	HiOutlineBadgeCheck,
	HiOutlineLockClosed,
	HiOutlineShieldCheck,
} from 'react-icons/hi';
import { IoChatbubbleOutline } from 'react-icons/io5';
import styles from './CheckoutSummary.module.scss';

interface CheckoutSummaryProps {
	itemCount: number;
	subtotal: number;
	salesTax: number;
	total: number;
	isSubmitting: boolean;
	onCompleteOrder: () => void;
}

export default function CheckoutSummary({
	itemCount,
	subtotal,
	salesTax,
	total,
	isSubmitting,
	onCompleteOrder,
}: CheckoutSummaryProps): JSX.Element {
	return (
		<aside className={`card card--padded ${styles.summary}`}>
			<h2 className={styles.summaryTitle}>
				ORDER SUMMARY
			</h2>

			<div className={styles.summaryRow}>
				<span>
					Items ({itemCount})
				</span>

				<strong>
					${subtotal.toFixed(2)}
				</strong>
			</div>

			<div className={styles.summaryRow}>
				<span>
					Sales Tax
				</span>

				<strong>
					${salesTax.toFixed(2)}
				</strong>
			</div>

			<div className={styles.summaryDivider} />

			<div className={styles.totalRow}>
				<span>
					Total
				</span>

				<strong>
					${total.toFixed(2)}
				</strong>
			</div>

			<button
				type="button"
				className={`button button--secondary ${styles.checkoutButton}`}
				onClick={onCompleteOrder}
				disabled={isSubmitting}
			>
				<HiOutlineLockClosed />

				<span>
					{isSubmitting
						? 'Processing Order...'
						: 'Complete Order'}
				</span>
			</button>

			<div className={styles.summaryDivider} />

			<div className={styles.trustSection}>
				<div className={styles.trustItem}>
					<HiOutlineShieldCheck className={styles.trustIcon} />

					<div>
						<div className={styles.trustTitle}>
							Secure Checkout
						</div>

						<div className={styles.trustText}>
							Encrypted payment processing
						</div>
					</div>
				</div>

				<div className={styles.trustItem}>
					<HiOutlineBadgeCheck className={styles.trustIcon} />

					<div>
						<div className={styles.trustTitle}>
							Order Review
						</div>

						<div className={styles.trustText}>
							Confirm details before submitting
						</div>
					</div>
				</div>

				<div className={styles.trustItem}>
					<IoChatbubbleOutline className={styles.trustIcon} />

					<div>
						<div className={styles.trustTitle}>
							Need Help?
						</div>

						<div className={styles.trustText}>
							<a
								href="https://championteamwear.com/ContactUs.aspx"
								target="_blank"
								rel="noreferrer"
							>
								Contact our support team
							</a>
						</div>
					</div>
				</div>
			</div>
		</aside>
	);
}