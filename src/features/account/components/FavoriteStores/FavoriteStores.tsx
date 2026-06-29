import { LuHeart } from "react-icons/lu";

import EmptyState from "../EmptyState/EmptyState";

import styles from "./FavoriteStores.module.scss";

import type { FavoriteStore } from "../../models/FavoriteStore";

interface FavoriteStoresProps {
	stores: FavoriteStore[];
	onBrowseStores?: () => void;
	onViewAll?: () => void;
}

export default function FavoriteStores({
	stores,
	onBrowseStores,
	onViewAll,
}: FavoriteStoresProps) {
	const hasStores = stores.length > 0;

	return (
		<section className={styles.card}>
			<div className={styles.header}>
				<div>
					<h2>Favorite Stores</h2>

					<div className={styles.underline} />
				</div>

				<LuHeart className={styles.headerIcon} />
			</div>

			{hasStores ? (
				<>
					<ul className={styles.list}>
						{stores.map((store) => (
							<li
								key={store.id}
								className={styles.store}
							>
								<div className={styles.logo}>
									<img
										src={store.logo}
										alt={store.name}
									/>
								</div>

								<div className={styles.info}>
									<h3>{store.name}</h3>

									<p>{store.location}</p>
								</div>
							</li>
						))}
					</ul>

					<button
						type="button"
						className={styles.viewAll}
						onClick={onViewAll}
					>
						View All Favorite Stores
					</button>
				</>
			) : (
				<EmptyState
					icon={LuHeart}
					title="No Favorite Stores"
					description="Save your favorite teams and organizations to quickly find them later."
					actionText="Browse Stores"
					onActionClick={onBrowseStores}
				/>
			)}
		</section>
	);
}
