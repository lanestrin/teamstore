import Skeleton from "../../components/skeleton/Skeleton";
import styles from "./AccountSkeleton.module.scss";

export default function AccountSkeleton() {
	return (
		<div className={styles.page}>
			<div className={styles.container}>
				<header className={styles.hero}>
					<Skeleton className={styles.eyebrow} />
					<Skeleton className={styles.title} />
					<Skeleton className={styles.text} />
					<Skeleton className={styles.textShort} />
				</header>

				<section className={styles.actions}>
					<SkeletonActionCard />
					<SkeletonActionCard />
				</section>

				<section className={styles.contentGrid}>
					<SkeletonDashboardCard />
					<SkeletonDashboardCard />
				</section>

				<div className={styles.helpCard}>
					<div>
						<Skeleton className={styles.helpTitle} />
						<Skeleton className={styles.helpText} />
					</div>

					<Skeleton className={styles.helpButton} />
				</div>
			</div>
		</div>
	);
}

function SkeletonActionCard() {
	return (
		<div className={styles.actionCard}>
			<Skeleton className={styles.icon} />
			<Skeleton className={styles.cardTitle} />
			<Skeleton className={styles.cardText} />
			<Skeleton className={styles.cardTextShort} />
			<Skeleton className={styles.button} />
		</div>
	);
}

function SkeletonDashboardCard() {
	return (
		<div className={styles.dashboardCard}>
			<div className={styles.cardHeader}>
				<div>
					<Skeleton className={styles.sectionTitle} />
					<Skeleton className={styles.underline} />
				</div>

				<Skeleton className={styles.headerIcon} />
			</div>

			<div className={styles.list}>
				<Skeleton className={styles.listItem} />
				<Skeleton className={styles.listItem} />
				<Skeleton className={styles.listItem} />
			</div>
		</div>
	);
}
