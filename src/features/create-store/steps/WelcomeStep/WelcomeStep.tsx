import { LuArrowRight, LuClock3, LuStore } from "react-icons/lu";

import styles from "./WelcomeStep.module.scss";

interface WelcomeStepProps {
	onStart?: () => void;
}

export default function WelcomeStep({
	onStart,
}: WelcomeStepProps) {
	return (
		<section className={styles.step}>
			<span className={styles.badge}>
				Create Your TeamStore
			</span>

			<h1>
				Build your online team store in
				about 5 minutes.
			</h1>

			<p className={styles.description}>
				We'll guide you through a few simple
				steps to personalize your store,
				select products, and launch your
				team's online shop.
			</p>

			<div className={styles.features}>
				<div className={styles.feature}>
					<LuClock3 />

					<div>
						<h3>Fast Setup</h3>

						<p>
							Most stores are ready in
							under five minutes.
						</p>
					</div>
				</div>

				<div className={styles.feature}>
					<LuStore />

					<div>
						<h3>Professional Storefront</h3>

						<p>
							Your store is generated
							automatically and can be
							customized later.
						</p>
					</div>
				</div>
			</div>

			<button
				type="button"
				className={styles.startButton}
				onClick={onStart}
			>
				Start Building

				<LuArrowRight />
			</button>
		</section>
	);
}
