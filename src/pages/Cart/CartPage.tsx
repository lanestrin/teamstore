import { useEffect, useState, type JSX } from 'react';

import CartEmptyState from './components/CartEmptyState';
import CartItem from './components/CartItem';
import CartSummary from './components/CartSummary';

import styles from './CartPage.module.scss';
import RequiredProgress from '../../components/required-progress/RequiredProgress';
import { requiredProducts } from '../../mocks/products';

interface ICartItem {
	guid: string;
	name: string;
	productColor: string;
	size_Name: string;
	price: number;
	quantity: number;
	defaultImage: string;
	personalizationName?: string;
	personalizationNumber?: string;
	supportsPersonalizationName: boolean;
	supportsPersonalizationNumber: boolean;
	teamStoreProductId?: number;
	teamStoreProductVersionId?: number;
	sizeId?: number;
}

interface ICartDetails {
	count: number;
	subtotal: number;
	items: ICartItem[];
	savedItems: ICartItem[];
}

export default function CartPage(): JSX.Element {
	const [cart, setCart] = useState<ICartDetails | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const [selectedItem, setSelectedItem] = useState<ICartItem | null>(null);
	const [editName, setEditName] = useState('');
	const [editNumber, setEditNumber] = useState('');
	const [isSavingPersonalization, setIsSavingPersonalization] = useState(false);

	const completedRequired =
		requiredProducts.filter(
			(product) => product.inCart
		).length;

	const totalRequired =
		requiredProducts.length;

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

			window.dispatchEvent(
				new CustomEvent('cartUpdated'),
			);

			closePersonalizationModal();
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

			window.dispatchEvent(
				new CustomEvent('cartUpdated'),
			);
		}
		catch (error) {
			console.error('Unable to remove item', error);
		}
	}

	async function moveToSaved(guid: string) {
		try {
			const response = await fetch(
				'/Checkout/MoveToSave',
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

			window.dispatchEvent(
				new CustomEvent('cartUpdated'),
			);
		}
		catch (error) {
			console.error('Unable to move item to saved', error);
		}
	}

	async function moveToCart(guid: string) {
		try {
			const response = await fetch(
				'/Checkout/MoveToCurrent',
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

			window.dispatchEvent(
				new CustomEvent('cartUpdated'),
			);
		}
		catch (error) {
			console.error('Unable to move item to cart', error);
		}
	}

	async function deleteSaved(guid: string) {
		try {
			const response = await fetch(
				'/Checkout/DeleteSaved',
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

			window.dispatchEvent(
				new CustomEvent('cartUpdated'),
			);
		}
		catch (error) {
			console.error('Unable to delete saved item', error);
		}
	}

	function openPersonalizationModal(item: ICartItem) {
		setSelectedItem(item);
		setEditName(item.personalizationName ?? '');
		setEditNumber(item.personalizationNumber ?? '');
	}

	function closePersonalizationModal() {
		setSelectedItem(null);
		setEditName('');
		setEditNumber('');
		setIsSavingPersonalization(false);
	}

	async function savePersonalization() {
		if (!selectedItem) {
			return;
		}

		try {
			setIsSavingPersonalization(true);

			const response = await fetch(
				'/Checkout/UpdatePersonalization',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						guid: selectedItem.guid,
						personalizationName: editName,
						personalizationNumber: editNumber,
					}),
				},
			);

			if (!response.ok) {
				return;
			}

			await loadCart(false);

			window.dispatchEvent(
				new CustomEvent('cartUpdated'),
			);

			closePersonalizationModal();
		}
		catch (error) {
			console.error(
				'Unable to update personalization',
				error,
			);
		}
		finally {
			setIsSavingPersonalization(false);
		}
	}

	useEffect(() => {
		setCart({
			count: 3,
			subtotal: 104,
			items: [
				{
					guid: "1",
					name: "Required Team Hoodie",
					productColor: "Gray",
					size_Name: "Adult M",
					price: 42,
					quantity: 1,
					defaultImage:
						"/src/assets/images/hoodie.png",
					personalizationName: "Ethan",
					personalizationNumber: "12",
					supportsPersonalizationName: true,
					supportsPersonalizationNumber: true,
				},
				{
					guid: "2",
					name: "Required Team Tee",
					productColor: "Gray",
					size_Name: "Adult L",
					price: 24,
					quantity: 1,
					defaultImage:
						"/src/assets/images/tee.png",
					supportsPersonalizationName: false,
					supportsPersonalizationNumber: false,
				},
			],
			savedItems: [],
		});
	}, []);

	return (
		<>
			<div className={styles.cartPage}>
				<div className={styles.container}>
					<div className={styles.header}>
						<div>
							<h1 className={styles.title}>
								Shopping Cart
							</h1>

							<p className={styles.subtitle}>
								Review your items before checkout.
							</p>
						</div>
					</div>

					{isLoading && (
						<div className={styles.loading}>
							Loading cart...
						</div>
					)}

					{!isLoading && cart && cart.items.length === 0 && cart.savedItems.length === 0 && (
						<CartEmptyState
							onContinueShopping={() => {
								window.location.href = '/Search/SearchLockers';
							}}
						/>
					)}

					{!isLoading && cart && (cart.items.length > 0 || cart.savedItems.length > 0) && (
						<div className={styles.layout}>
							<div className={styles.contentColumn}>
								{cart.items.length > 0 && (
									<div className={styles.items}>
										{cart.items.map(item => (
											<CartItem
												key={item.guid}
												imageUrl={item.defaultImage}
												name={item.name}
												details={`${item.size_Name} | ${item.productColor}`}
												price={item.price}
												quantity={item.quantity}
												personalizationName={item.personalizationName}
												personalizationNumber={item.personalizationNumber}
												supportsPersonalizationName={item.supportsPersonalizationName}
												supportsPersonalizationNumber={item.supportsPersonalizationNumber}
												showQuantityControls={true}
												actionLabel="Save For Later"
												onAction={() =>
													moveToSaved(item.guid)
												}
												onEditPersonalization={() =>
													openPersonalizationModal(item)
												}
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
											/>
										))}
									</div>
								)}

								{cart.savedItems.length > 0 && (
									<div className={styles.savedItems}>
										<h2 className={styles.savedItemsTitle}>
											Saved For Later ({cart.savedItems.length})
										</h2>

										{cart.savedItems.map(item => (
											<CartItem
												key={item.guid}
												imageUrl={item.defaultImage}
												name={item.name}
												details={`${item.size_Name} | ${item.productColor}`}
												price={item.price}
												quantity={item.quantity}
												personalizationName={item.personalizationName}
												personalizationNumber={item.personalizationNumber}
												supportsPersonalizationName={item.supportsPersonalizationName}
												supportsPersonalizationNumber={item.supportsPersonalizationNumber}
												showQuantityControls={false}
												actionLabel="Move To Cart"
												onAction={() =>
													moveToCart(item.guid)
												}
												onEditPersonalization={() =>
													openPersonalizationModal(item)
												}
												onDecrease={() => { }}
												onIncrease={() => { }}
												onRemove={() =>
													deleteSaved(item.guid)
												}
											/>
										))}
									</div>
								)}
							</div>

							{cart.items.length > 0 && (
								<div className={styles.summaryColumn}>
									<RequiredProgress
										completed={completedRequired}
										total={totalRequired}
										items={requiredProducts.map(
											(product) => ({
												id: product.id,
												name: product.name,
												completed: product.inCart,
											})
										)}
									/>

									<CartSummary
										itemCount={cart.count}
										subtotal={cart.subtotal}
									/>
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{selectedItem && (
				<div className={styles.modalOverlay}>
					<div className={styles.modal}>
						<h2 className={styles.modalTitle}>
							Edit Personalization
						</h2>

						<p className={styles.modalSubtitle}>
							Update the name or number for this item.
						</p>

						{selectedItem.supportsPersonalizationName && (
							<div className={styles.modalField}>
								<label
									htmlFor="personalization-name"
									className={styles.modalLabel}
								>
									Name
								</label>

								<input
									id="personalization-name"
									type="text"
									className={styles.modalInput}
									value={editName}
									onChange={event => {
										setEditName(event.target.value);
									}}
								/>
							</div>
						)}

						{selectedItem.supportsPersonalizationNumber && (
							<div className={styles.modalField}>
								<label
									htmlFor="personalization-number"
									className={styles.modalLabel}
								>
									Number
								</label>

								<input
									id="personalization-number"
									type="text"
									className={styles.modalInput}
									value={editNumber}
									onChange={event => {
										setEditNumber(event.target.value);
									}}
								/>
							</div>
						)}

						<div className={styles.modalActions}>
							<button
								type="button"
								className={styles.modalCancelButton}
								onClick={
									closePersonalizationModal
								}
							>
								Cancel
							</button>

							<button
								type="button"
								className={styles.modalSaveButton}
								onClick={
									savePersonalization
								}
								disabled={
									isSavingPersonalization
								}
							>
								{isSavingPersonalization
									? 'Saving...'
									: 'Save Changes'}
							</button>
						</div>
					</div>
				</div>
			)}

		</>
	);
}
