import { LuCheck, LuLogOut } from "react-icons/lu";

import styles from "./ProgressSidebar.module.scss";
import { images } from "../../../assets/images";

interface ProgressSidebarProps {
	currentStep: number;
}

const steps = [
	{
		title: "Choose Colors",
		description: "Pick your team colors",
	},
	{
		title: "Organization",
		description: "Tell us about your team",
	},
	{
		title: "Products",
		description: "Choose what to sell",
	},
	{
		title: "Store Settings",
		description: "Dates, ordering & options",
	},
	{
		title: "Review",
		description: "Review and publish",
	},
];

export default function ProgressSidebar({
	currentStep,
}: ProgressSidebarProps) {
	return (
		<aside className={styles.sidebar}>
			<div className={styles.header}>
				<img
					src={images.teamstore}
					alt="TeamStore"
					className={styles.logo}
				/>

				<span className={styles.label}>
					Create Your Store
				</span>

				<h2>TeamStore Setup</h2>

				<p>
					Build your online store
					in just a few minutes.
				</p>
			</div>

			<nav className={styles.steps}>
				{steps.map((step, index) => {
					const stepNumber = index + 1;

					const isActive =
						stepNumber === currentStep;

					const isComplete =
						stepNumber < currentStep;

					return (
						<div
							key={step.title}
							className={styles.step}
						>
							{index <
								steps.length - 1 && (
									<div
										className={`${styles.line}
										${isComplete
												? styles.lineComplete
												: ""
											}`}
									/>
								)}

							<div
								className={`${styles.circle}
									${isActive
										? styles.active
										: ""
									}
									${isComplete
										? styles.complete
										: ""
									}`}
							>
								{isComplete ? (
									<LuCheck />
								) : (
									stepNumber
								)}
							</div>

							<div className={styles.content}>
								<h3>{step.title}</h3>

								<p>{step.description}</p>
							</div>
						</div>
					);
				})}
			</nav>

			<div className={styles.footer}>
				<button
					type="button"
					className={styles.exitButton}
				>
					<LuLogOut />

					<div>
						<span>Save & Exit</span>

						<small>
							Progress saved automatically
						</small>
					</div>
				</button>
			</div>
		</aside>
	);
}
