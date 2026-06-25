declare var AdyenCheckout: any;

export default async function startCheckout() {
	const clientKey = window.AdyenClientKey;
	const paymentMethodMock = {
		paymentMethods: [
			{
				brands: [
					'mc',
					'amex',
					'visa',
					'discover'
				],
				name: 'Credit Card',
				type: 'scheme'
			}
		]
	};

	const configuration = {
		paymentMethodsResponse: paymentMethodMock,
		clientKey,
		locale: 'en_US',
		environment: window.AdyenEnv,
		showPayButton: false,
		paymentMethodsConfiguration: {
			card: {
				hasHolderName: true,
				holderNameRequired: true
			}
		}
	};
	try {
		const checkoutConfig = await AdyenCheckout(configuration);

		const checkout = checkoutConfig.create('card', {
			onChange: (state: any) => {
				const adyenCard = state.data.paymentMethod;

				if (state.isValid) {
					let encryptedCardHolderName = adyenCard.holderName;
					let encryptedCardNumber = adyenCard.encryptedCardNumber;
					let encryptedExpiryMonth = adyenCard.encryptedExpiryMonth;
					let encryptedExpiryYear = adyenCard.encryptedExpiryYear;
					let encryptedSecurityCode = adyenCard.encryptedSecurityCode;

					const cardHolderName = document.getElementById(
						'payment__cardHolderName'
					) as HTMLInputElement;

					const cardNumber = document.getElementById(
						'payment__cardNumber'
					) as HTMLInputElement;

					const expiryMonth = document.getElementById(
						'payment__expiration__month'
					) as HTMLInputElement;

					const expiryYear = document.getElementById(
						'payment__expiration__year'
					) as HTMLInputElement;

					const securityCode = document.getElementById(
						'payment__expiration__cvs'
					) as HTMLInputElement;

					cardHolderName.value = encryptedCardHolderName;
					cardNumber.value = encryptedCardNumber;
					expiryMonth.value = encryptedExpiryMonth;
					expiryYear.value = encryptedExpiryYear;
					securityCode.value = encryptedSecurityCode;
				}
			}
		}).mount(document.getElementById('payment'));
		return checkout;
	} catch (error) {
		console.error(error);
		alert('Error occurred. Look at console for details');
	}
}