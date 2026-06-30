import { useCreateStore } from "../../context/CreateStoreContext";

import styles from "./LivePreview.module.scss";

export default function LivePreview() {
	const {
		primaryColor,
		secondaryColor,
	} = useCreateStore();

	return (
		<aside className={styles.preview}>
			<div className={styles.header}>
				<span className={styles.badge}>
					Live Preview
				</span>

				<div className={styles.titleRow}>
					<h2>Your Store</h2>

					<div
						className={styles.colorPalette}
						aria-label="Selected team colors"
					>
						<span
							className={styles.primaryColor}
							style={{
								backgroundColor:
									primaryColor,
							}}
						/>

						<span
							className={
								styles.secondaryColor
							}
							style={{
								backgroundColor:
									secondaryColor,
							}}
						/>
					</div>
				</div>

				<p>
					Every change you make will appear
					here instantly.
				</p>
			</div>

			<div className={styles.storePreview}>
				<div className={styles.browser}>
					<div className={styles.browserBar}>
						<span />
						<span />
						<span />
					</div>

					<div className={styles.store}>
						<div
							className={
								styles.storeHeader
							}
						/>

						<div className={styles.hero} />

						<div
							className={
								styles.products
							}
						>
							<div
								className={
									styles.productCard
								}
							/>

							<div
								className={
									styles.productCard
								}
							/>

							<div
								className={
									styles.productCard
								}
							/>

							<div
								className={
									styles.productCard
								}
							/>
						</div>
					</div>
				</div>
			</div>
		</aside>
	);
}
