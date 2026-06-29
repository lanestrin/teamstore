import { LuChevronRight, LuPackage } from "react-icons/lu";

import EmptyState from "../EmptyState/EmptyState";

import styles from "./RecentOrders.module.scss";

import type { RecentOrder } from "../../models/RecentOrder";

interface RecentOrdersProps {
	orders: RecentOrder[];
	onViewOrders?: () => void;
}

export default function RecentOrders({
	orders,
	onViewOrders,
}: RecentOrdersProps) {
	const hasOrders = orders.length > 0;

	return (
		<section className={styles.card}>
			<div className={styles.header}>
				<div>
					<h2>Recent Orders</h2>

					<div className={styles.underline} />
				</div>

				<LuPackage className={styles.headerIcon} />
			</div>

			{hasOrders ? (
				<>
					<ul className={styles.list}>
						{orders.map((order) => (
							<li
								key={order.id}
								className={styles.order}
							>
								<div className={styles.image}>
									<img
										src={order.image}
										alt={order.storeName}
									/>
								</div>

								<div className={styles.details}>
									<h3>
										Order #{order.orderNumber}
									</h3>

									<p className={styles.store}>
										{order.storeName}
									</p>

									<p className={styles.date}>
										{order.orderDate}
									</p>
								</div>

								<div className={styles.summary}>
									<span
										className={`${styles.status} ${order.status === "Delivered"
												? styles.delivered
												: styles.shipped
											}`}
									>
										{order.status}
									</span>

									<span className={styles.total}>
										$
										{order.total.toFixed(2)}
									</span>
								</div>

								<button
									type="button"
									className={styles.chevron}
									aria-label={`View order ${order.orderNumber}`}
								>
									<LuChevronRight />
								</button>
							</li>
						))}
					</ul>

					<button
						type="button"
						className={styles.viewAll}
						onClick={onViewOrders}
					>
						View All Orders
					</button>
				</>
			) : (
				<EmptyState
					icon={LuPackage}
					title="No Recent Orders"
					description="Orders you've placed will appear here once you purchase from a TeamStore."
					actionText="Find a Store"
					onActionClick={onViewOrders}
				/>
			)}
		</section>
	);
}
