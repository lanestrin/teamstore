import {
	LuShieldCheck,
	LuUserRound,
	LuRefreshCw,
} from "react-icons/lu";

import styles from "./BenefitsPreview.module.scss";

interface BenefitsPreviewProps {
	brandColor: string;
}

const benefits = [
	{
		title: "Team Approved",
		description:
			"All items meet team requirements",
		icon: LuShieldCheck,
	},
	{
		title: "Quality Gear",
		description:
			"Premium brands you trust",
		icon: LuUserRound,
	},
	{
		title: "Easy Returns",
		description:
			"30-day hassle free returns",
		icon: LuRefreshCw,
	},
];

export default function BenefitsPreview({
	brandColor,
}: BenefitsPreviewProps) {
	return (
		<section className={styles.benefits}>
			{benefits.map((benefit) => {
				const Icon = benefit.icon;

				return (
					<article
						key={benefit.title}
						className={styles.item}
					>
						<div className={styles.icon}>
							<Icon
								style={{
									color: brandColor,
								}}
							/>
						</div>

						<div className={styles.content}>
							<h3>{benefit.title}</h3>

							<p>
								{
									benefit.description
								}
							</p>
						</div>
					</article>
				);
			})}
		</section>
	);
}