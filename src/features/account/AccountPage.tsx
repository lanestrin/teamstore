import { LuSearch, LuStore } from "react-icons/lu";
import { useNavigate } from "react-router-dom";

import FavoriteStores from "./components/FavoriteStores/FavoriteStores";
import RecentOrders from "./components/RecentOrders/RecentOrders";

import styles from "./AccountPage.module.scss";

import ActionCard from "./components/ActionCard/ActionCard";
import HelpCard from "./components/HelpCard/HelpCard";
import { favoriteStores, recentOrders } from "../../mocks/account";

interface AccountPageProps {
	hasStore?: boolean;
}

export default function AccountPage({
	hasStore = false,
}: AccountPageProps) {
	const navigate = useNavigate();

	//const favoriteStores: FavoriteStore[] = [];

	//const recentOrders: RecentOrder[] = [];

	return (
		<div className={styles.page}>
			<div className={styles.container}>
				<header className={styles.hero}>
					<span className={styles.eyebrow}>
						ACCOUNT
					</span>

					<h1>Welcome back, Lan!</h1>

					<p>
						Manage your orders, discover new
						stores, or launch your own TeamStore.
					</p>
				</header>

				<section className={styles.actions}>
					<ActionCard
						icon={LuSearch}
						title="Find a Store"
						description="Browse apparel from your favorite teams, schools, and organizations."
						actionText="Browse Stores"
						onClick={() => navigate("/stores")}
					/>

					<ActionCard
						icon={LuStore}
						title={
							hasStore
								? "My Stores"
								: "Create a Store"
						}
						description={
							hasStore
								? "Manage your stores, products, and orders."
								: "Launch your own online store in minutes."
						}
						actionText={
							hasStore
								? "Open Workspace"
								: "Create Store"
						}
						onClick={() =>
							navigate(
								hasStore
									? "/account"
									: "/create-store"
							)
						}
					/>
				</section>

				<section className={styles.contentGrid}>
					<FavoriteStores
						stores={favoriteStores}
					/>

					<RecentOrders
						orders={recentOrders}
					/>
				</section>

				<HelpCard />
			</div>
		</div>
	);
}
