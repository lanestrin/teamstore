import { useEffect, type JSX, useState } from 'react';
import { FiX } from 'react-icons/fi';
import styles from './CartDrawer.module.scss';
import CartEmptyState from './CartEmptyState';
import CartItem from './CartItem';
import { useNavigate } from 'react-router-dom';

interface IMyCartProps {
	isOpen: boolean;
	onClose: () => void;
	onCartUpdated: () => void;
}

interface ICartItem {
	guid: string;
	name: string;
	productColor: string;
	size_Name: string;
	price: number;
	quantity: number;
	defaultImage: string;
}

interface ICartDetails {
	count: number;
	subtotal: number;
	items: ICartItem[];
}

export default function CartDrawer({
	isOpen,
	onClose,
	onCartUpdated,
}: IMyCartProps): JSX.Element | null {
	const navigate = useNavigate();

	const [cart, setCart] = useState<ICartDetails | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	async function loadCart(showLoading = true) {
		try {
			if (showLoading) {
				setIsLoading(true);
			}

			const response = await fetch('/Checkout/CartDetails');

			if (!response.ok) {
				return;
			}

			const data: ICartDetails = await response.json();

			setCart(data);
		}
		catch (error) {
			console.error('Unable to load cart', error);
		}
		finally {
			if (showLoading) {
				setIsLoading(false);
			}
		}
	}

	async function updateQuantity(
		guid: string,
		quantity: number,
	) {
		if (quantity < 1) {
			return;
		}

		try {
			const response = await fetch(
				'/Checkout/UpdateCartQuantity',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						guid,
						quantity,
					}),
				},
			);

			if (!response.ok) {
				return;
			}

			await loadCart(false);
			onCartUpdated();
		}
		catch (error) {
			console.error('Unable to update quantity', error);
		}
	}

	async function removeItem(guid: string) {
		try {
			const response = await fetch(
				'/Checkout/RemoveCart',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						guid,
					}),
				},
			);

			if (!response.ok) {
				return;
			}

			await loadCart(false);
			onCartUpdated();
		}
		catch (error) {
			console.error('Unable to remove item', error);
		}
	}

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		document.body.style.overflow = 'hidden';

		return () => {
			document.body.style.overflow = '';
		};
	}, [isOpen]);

	useEffect(() => {
		if (isOpen) {
			loadCart();
		}
	}, [isOpen]);

	if (!isOpen) {
		return null;
	}

	return (
		<>
			<div
				className={styles.overlay}
				onClick={onClose}
				role="button"
				tabIndex={0}
				aria-label="Close cart"
				onKeyDown={event => {
					if (event.key === 'Enter' || event.key === ' ') {
						onClose();
					}
				}}
			/>

			<aside
				className={styles.drawer}
				aria-label="Shopping Cart"
			>
				<div className={styles.header}>
					<h2 className={styles.title}>
						MY CART ({cart?.count ?? 0})
					</h2>

					<button
						type="button"
						className={styles.closeButton}
						onClick={onClose}
						aria-label="Close Cart"
					>
						<FiX />
					</button>
				</div>

				{isLoading && (
					<div className={styles.content}>
						Loading...
					</div>
				)}

				{!isLoading && cart && cart.items.length === 0 && (
					<div className={styles.content}>
						<CartEmptyState
							onContinueShopping={() => {
								onClose();
								window.location.href = '/Search/SearchLockers';
							}}
						/>
					</div>
				)}

				{!isLoading && cart && cart.items.length > 0 && (
					<div className={styles.content}>
						{cart.items.map(item => (
							<CartItem
								key={item.guid}
								imageUrl={item.defaultImage}
								name={item.name}
								details={`${item.size_Name} | ${item.productColor}`}
								price={item.price}
								quantity={item.quantity}
								onDecrease={() =>
									updateQuantity(
										item.guid,
										item.quantity - 1,
									)
								}
								onIncrease={() =>
									updateQuantity(
										item.guid,
										item.quantity + 1,
									)
								}
								onRemove={() =>
									removeItem(item.guid)
								}
								compact
							/>
						))}
					</div>
				)}

				<div className={styles.footer}>
					<div className={styles.subtotal}>
						<span>SUBTOTAL</span>
						<strong>
							${(cart?.subtotal ?? 0).toFixed(2)}
						</strong>
					</div>

					<button
						type="button"
						className={styles.secondaryButton}
						onClick={() => {
							onClose();
							navigate('/cart');
						}}
					>
						VIEW CART
					</button>

					<button
						type="button"
						className={styles.primaryButton}
						onClick={async () => {
							try {
								const response = await fetch('/Checkout/IsAuthenticated');
								const data = await response.json();

								onClose();

								if (!data.isAuthenticated) {
									window.location.href = '/Account/Login';
									return;
								}

								navigate('/checkout');
							}
							catch (error) {
								console.error(error);
							}
						}}
					>
						CHECKOUT
					</button>
				</div>
			</aside>
		</>
	);
}
