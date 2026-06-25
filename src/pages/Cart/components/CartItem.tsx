import { type JSX } from 'react';
import styles from './CartItem.module.scss';
import {
	LuPencil,
	LuHeart,
	LuMinus,
	LuPlus,
	LuTrash2
} from 'react-icons/lu';


interface ICartItemProps {
	imageUrl: string;
	name: string;
	details: string;
	price: number;
	quantity: number;
	personalizationName?: string;
	personalizationNumber?: string;
	supportsPersonalizationName?: boolean;
	supportsPersonalizationNumber?: boolean;
	actionLabel?: string;
	onAction?: () => void;
	onEditPersonalization?: () => void;
	showQuantityControls?: boolean;
	onDecrease: () => void;
	onIncrease: () => void;
	onRemove: () => void;
	compact?: boolean;
}

export default function CartItem({
	imageUrl,
	name,
	details,
	price,
	quantity,
	personalizationName,
	personalizationNumber,
	supportsPersonalizationName,
	supportsPersonalizationNumber,
	actionLabel,
	onAction,
	onEditPersonalization,
	showQuantityControls = true,
	onDecrease,
	onIncrease,
	onRemove,
	compact = false,
}: ICartItemProps): JSX.Element {
	const canEditPersonalization =
		(supportsPersonalizationName ||
			supportsPersonalizationNumber) &&
		!!onEditPersonalization;

	return (
		<div
			className={`${styles.cartItem} ${compact ? styles.compact : ''}`}>
			<div className={styles.imageContainer}>
				<img
					src={imageUrl}
					alt={name}
					className={styles.image}
				/>
			</div>

			<div className={styles.content}>
				<div className={styles.topRow}>
					<div>
						<div className={styles.productInfo}>
							<span className={styles.name}>
								{name}
							</span>

							<div className={styles.details}>
								{details}
							</div>

							{(personalizationName || personalizationNumber) && (
								<div className={styles.details}>
									{supportsPersonalizationName &&
										personalizationName && (
											<div>
												Name: {personalizationName}
											</div>
										)}

									{supportsPersonalizationNumber &&
										personalizationNumber && (
											<div>
												Number: {personalizationNumber}
											</div>
										)}
								</div>
							)}
						</div>
					</div>

					<div className={styles.price}>
						${price.toFixed(2)}
					</div>
				</div>

				<div className={styles.bottomRow}>
					{showQuantityControls && (
						<div className={styles.quantitySection}>
							<span className={styles.qtyLabel}>
								Qty
							</span>

							<div className={styles.quantity}>
								<button
									type="button"
									className={styles.quantityButton}
									onClick={onDecrease}
									aria-label="Decrease Quantity"
								>
									<LuMinus />
								</button>

								<span className={styles.quantityValue}>
									{quantity}
								</span>

								<button
									type="button"
									className={styles.quantityButton}
									onClick={onIncrease}
									aria-label="Increase Quantity"
								>
									<LuPlus />
								</button>
							</div>
						</div>
					)}

					<div className={styles.actions}>
						{canEditPersonalization && (
							<button
								type="button"
								className={styles.utilityButton}
								onClick={onEditPersonalization}
							>
								<LuPencil />

								<span>
									Edit Personalization
								</span>
							</button>
						)}

						{actionLabel && onAction && (
							<button
								type="button"
								className={styles.utilityButton}
								onClick={onAction}
							>
								<LuHeart />

								<span>
									{actionLabel}
								</span>
							</button>
						)}

						<button
							type="button"
							className={styles.removeLink}
							onClick={onRemove}
						>
							<LuTrash2 />

							<span>
								Remove
							</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
