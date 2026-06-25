import { type JSX } from 'react';
import styles from './CartSummary.module.scss';
import { useNavigate } from 'react-router-dom';
import { LuLock, LuShieldCheck, LuBadgeCheck, LuMessageCircle } from 'react-icons/lu';

interface CartSummaryProps {
	itemCount: number;
	subtotal: number;
}

export default function CartSummary({
	itemCount,
	subtotal,
}: CartSummaryProps): JSX.Element {
	const navigate = useNavigate();

	return (
		<div className={styles.summary}>
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
					Shipping
				</span>

				<span>
					Calculated at checkout
				</span>
			</div>

			<div className={styles.summaryDivider} />

			<div className={styles.totalRow}>
				<span>
					Estimated Total
				</span>

				<strong>
					${subtotal.toFixed(2)}
				</strong>
			</div>

			<button
				type="button"
				className={styles.checkoutButton}
				onClick={() => {
					navigate('/checkout');
				}}
			>
				<LuLock />

				<span>
					Proceed to Checkout
				</span>
			</button>

			<div className={styles.summaryDivider} />

			<div className={styles.trustSection}>
				<div className={styles.trustItem}>
					<LuShieldCheck
						className={styles.trustIcon}
					/>

					<div>
						<div
							className={
								styles.trustTitle
							}
						>
							Secure Checkout
						</div>

						<div
							className={
								styles.trustText
							}
						>
							Your information is safe
						</div>
					</div>
				</div>

				<div className={styles.trustItem}>
					<LuBadgeCheck
						className={styles.trustIcon}
					/>

					<div>
						<div
							className={
								styles.trustTitle
							}
						>
							Satisfaction Guaranteed
						</div>

						<div
							className={
								styles.trustText
							}
						>
							Love it or return it
						</div>
					</div>
				</div>

				<div className={styles.trustItem}>
					<LuMessageCircle
						className={styles.trustIcon}
					/>

					<div>
						<div
							className={styles.trustTitle}
						>
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
		</div>
	);
}
