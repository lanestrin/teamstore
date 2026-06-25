import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { HiOutlineArrowLeft } from 'react-icons/hi2';
import styles from './ThankYouPage.module.scss';
import MainLayout from '../../layouts/MainLayout';
import useHideMvcLayout from '../../hooks/useHideMvcLayout';

export default function ThankYouPage() {
	useHideMvcLayout();

	const navigate = useNavigate();
	const { orderId } = useParams();
	const location = useLocation();

	const orderData = location.state as {
		items?: Array<{
			id: string;
			name: string;
			details: string;
			quantity: number;
			price: number;
			imageUrl: string;
			personalizationName?: string;
			personalizationNumber?: string;
		}>;
		subtotal?: number;
		salesTax?: number;
		total?: number;
	} | null;

	return (
		<MainLayout>
			<div className={styles.page}>
				<div className={styles.container}>
					<div className={styles.hero}>
						<h1 className={styles.title}>
							Thank you for your order!
						</h1>

						<div className={styles.orderPill}>
							<span>Order Number:</span>
							<strong>#{orderId}</strong>
						</div>
					</div>

					<div className={styles.infoCard}>
						<h2 className={styles.infoTitle}>
							What Happens Next
						</h2>

						<p className={styles.infoText}>
							All items included in your order will be shipped directly to your
							Coach's Assistant owner. Please note that your order will begin
							production after the Coach's Assistant locker room deadline expires.
							Once your order is processed, you will receive an automated email
							with your order details. To view the status of your order, log in
							to your online account.
						</p>
					</div>

					<div className={styles.summaryCard}>
						<h2 className={styles.sectionTitle}>
							Order Summary
						</h2>

						<div className={styles.summaryContent}>
							{orderData?.items?.length ? (
								<>
									{orderData.items.map(item => (
										<div
											key={item.id}
											className={styles.summaryItem}
										>
											<div className={styles.summaryItemLeft}>
												<img
													src={item.imageUrl}
													alt={item.name}
													className={styles.summaryImage}
												/>

												<div>
													<div className={styles.itemName}>
														{item.name}
													</div>

													<div className={styles.itemDetails}>
														{item.details}
													</div>

													<div className={styles.itemDetails}>
														Qty: {item.quantity}
													</div>

													{item.personalizationName && (
														<div className={styles.itemDetails}>
															Name: {item.personalizationName}
														</div>
													)}

													{item.personalizationNumber && (
														<div className={styles.itemDetails}>
															Number: {item.personalizationNumber}
														</div>
													)}
												</div>
											</div>

											<div className={styles.itemPrice}>
												${(item.price * item.quantity).toFixed(2)}
											</div>
										</div>
									))}

									<div className={styles.summaryTotals}>
										<div>
											<span>Subtotal</span>
											<span>${(orderData.subtotal ?? 0).toFixed(2)}</span>
										</div>

										<div>
											<span>Sales Tax</span>
											<span>${(orderData.salesTax ?? 0).toFixed(2)}</span>
										</div>

										<div className={styles.totalRow}>
											<span>Total</span>
											<span>${(orderData.total ?? 0).toFixed(2)}</span>
										</div>
									</div>
								</>
							) : (
								<div className={styles.summaryPlaceholder}>
									Order details unavailable.
								</div>
							)}
						</div>
					</div>

					<div className={styles.actions}>
						<button
							type="button"
							className={styles.primaryButton}
							onClick={() => navigate('/')}
						>
							Continue Shopping
						</button>

						<button
							type="button"
							className={styles.secondaryButton}
							onClick={() => navigate('/')}
						>
							<HiOutlineArrowLeft />
							<span>Return Home</span>
						</button>

					</div>
				</div>
			</div>
		</MainLayout>
	);
}