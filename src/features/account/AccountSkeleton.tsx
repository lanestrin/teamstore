import styles from "./AccountSkeleton.module.scss";

export default function AccountSkeleton() {
	return (
		<div className={styles.page}>
			<div className={styles.container}>
				<header className={styles.hero}>
					<div className={styles.eyebrow} />
					<div className={styles.title} />
					<div className={styles.text} />
					<div className={styles.textShort} />
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
						<div className={styles.helpTitle} />
						<div className={styles.helpText} />
					</div>

					<div className={styles.helpButton} />
				</div>
			</div>
		</div>
	);
}

function SkeletonActionCard() {
	return (
		<div className={styles.actionCard}>
			<div className={styles.icon} />
			<div className={styles.cardTitle} />
			<div className={styles.cardText} />
			<div className={styles.cardTextShort} />
			<div className={styles.button} />
		</div>
	);
}

function SkeletonDashboardCard() {
	return (
		<div className={styles.dashboardCard}>
			<div className={styles.cardHeader}>
				<div>
					<div className={styles.sectionTitle} />
					<div className={styles.underline} />
				</div>

				<div className={styles.headerIcon} />
			</div>

			<div className={styles.list}>
				<div className={styles.listItem} />
				<div className={styles.listItem} />
				<div className={styles.listItem} />
			</div>
		</div>
	);
}
