import { HiOutlineExclamationTriangle } from 'react-icons/hi2';
import styles from './CheckoutErrorModal.module.scss';
import React from 'react';

interface ICheckoutErrorModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function CheckoutErrorModal({
	isOpen,
	onClose,
}: ICheckoutErrorModalProps) {

	if (!isOpen) {
		return null;
	}

	return (
		<div className="modal-overlay">
			<div className="modal modal--lg">
				<div className="modal__header">
					<div className={styles.errorHeader}>
						<HiOutlineExclamationTriangle
							className={styles.errorIcon}
						/>

						<div>
							<h2>ORDER REQUIRES CUSTOMER SUPPORT REVIEW</h2>

							<p className={styles.errorSubtitle}>
								An unexpected issue occurred while processing your order.
							</p>

							<p className={styles.errorSubtitle}>
								Please contact Customer Support before attempting
								to place another order.
							</p>
						</div>
					</div>
				</div>

				<div className="modal__body">
					<div className={styles.warning}>
						Do not submit your order again. If your payment was
						successfully processed, submitting another order could
						result in duplicate charges.
					</div>
				</div>

				<div className="modal__footer">
					<button
						type="button"
						className="button button--secondary"
						onClick={() => {
							window.open(
								'https://championteamwear.com/ContactUs.aspx',
								'_blank',
								'noreferrer'
							);
						}}
					>
						Contact Support
					</button>

					<button
						type="button"
						onClick={onClose}
						className="button button--ghost"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}