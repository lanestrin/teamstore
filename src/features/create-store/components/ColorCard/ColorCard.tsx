import { LuCheck } from "react-icons/lu";

import styles from "./ColorCard.module.scss";

interface ColorCardProps {
	primaryColor: string;
	secondaryColor: string;
	selected?: boolean;
	onClick?: () => void;
}

export default function ColorCard({
	primaryColor,
	secondaryColor,
	selected = false,
	onClick,
}: ColorCardProps) {
	return (
		<button
			type="button"
			className={`${styles.card} ${selected ? styles.selected : ""
				}`}
			onClick={onClick}
		>
			<div className={styles.colors}>
				<div
					className={styles.primary}
					style={{
						backgroundColor: primaryColor,
					}}
				/>

				<div
					className={styles.secondary}
					style={{
						backgroundColor: secondaryColor,
					}}
				/>
			</div>

			{selected && (
				<div className={styles.check}>
					<LuCheck />
				</div>
			)}
		</button>
	);
}
