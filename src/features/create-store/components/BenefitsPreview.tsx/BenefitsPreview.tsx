import { LuShieldCheck, LuUserRound, LuRefreshCw } from "react-icons/lu";

import styles from "./BenefitsPreview.module.scss";

interface BenefitsPreviewProps {
	brandColor: string;
}

export default function BenefitsPreview({
	brandColor,
}: BenefitsPreviewProps) {
	return (
		<section className={styles.benefits}>
			<div>
				<LuShieldCheck
					style={{ color: brandColor }}
				/>

				<strong>Team Approved</strong>

				<span>
					All items meet team requirements
				</span>
			</div>

			<div>
				<LuUserRound
					style={{ color: brandColor }}
				/>

				<strong>Quality Gear</strong>

				<span>
					Premium brands you trust
				</span>
			</div>

			<div>
				<LuRefreshCw
					style={{ color: brandColor }}
				/>

				<strong>Easy Returns</strong>

				<span>
					30-day hassle free returns
				</span>
			</div>
		</section>
	);
}
