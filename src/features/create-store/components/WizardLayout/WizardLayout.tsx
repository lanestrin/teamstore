import type { ReactNode } from "react";
import styles from "./WizardLayout.module.scss";

interface WizardLayoutProps {
	step: number;
	title: string;
	description: string;
	children: ReactNode;
	onBack?: () => void;
	onNext?: () => void;
	nextLabel?: string;
	backLabel?: string;
	nextDisabled?: boolean;
	hideBack?: boolean;
}

export default function WizardLayout({
	step,
	title,
	description,
	children,
	onBack,
	onNext,
	nextLabel = "Next",
	backLabel = "Back",
	nextDisabled = false,
	hideBack = false,
}: WizardLayoutProps) {
	return (
		<section className={styles.page}>
			<header className={styles.header}>
				<div className={styles.badge}>
					Step {step}
				</div>

				<h1>{title}</h1>

				<p className={styles.description}>
					{description}
				</p>
			</header>

			<div className={styles.stepContent}>
				{children}
			</div>

			<footer className={styles.actions}>
				{hideBack ? (
					<div />
				) : (
					<button
						type="button"
						className={styles.secondaryButton}
						onClick={onBack}
					>
						{backLabel}
					</button>
				)}

				<button
					type="button"
					className={styles.primaryButton}
					onClick={onNext}
					disabled={nextDisabled}
				>
					{nextLabel}
				</button>
			</footer>
		</section>
	);
}
