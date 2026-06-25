import { type JSX } from 'react';
import { LuShoppingCart } from 'react-icons/lu';
import styles from './CartEmptyState.module.scss';

interface ICartEmptyStateProps {
	onContinueShopping?: () => void;
}

export default function CartEmptyState({
	onContinueShopping,
}: ICartEmptyStateProps): JSX.Element {
	return (
		<div className={styles.emptyState}>
			<div className={styles.iconContainer}>
				<LuShoppingCart className={styles.icon} />
			</div>

			<h3 className={styles.title}>
				Your cart is empty
			</h3>

			<p className={styles.description}>
				Browse products and add items to your cart to get started.
			</p>

			<button
				type="button"
				className={styles.button}
				onClick={onContinueShopping}
			>
				Continue Shopping
			</button>
		</div>
	);
}
