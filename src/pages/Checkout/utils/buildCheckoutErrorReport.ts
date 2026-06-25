interface CheckoutErrorReportParams {
	error: unknown;
	orderName: string;
	customerId?: string | number;
	customerName?: string;
	email?: string;

	subtotal?: number;
	salesTax?: number;
	total?: number;

	billingAddress?: {
		firstName?: string;
		lastName?: string;
		company?: string;
		address1?: string;
		address2?: string;
		city?: string;
		state?: string;
		zip?: string;
	};

	items?: Array<{
		name?: string;
		size?: string;
		color?: string;
		quantity?: number;
		price?: number;
	}>;

	adyenResult?: string;
	pspReference?: string;
	merchantReference?: string;
}

export function buildCheckoutErrorReport({
	error,
	orderName,
	customerId,
	customerName,
	email,
	subtotal,
	salesTax,
	total,
	billingAddress,
	items,
	adyenResult,
	pspReference,
	merchantReference,
}: CheckoutErrorReportParams): string {
	const errorObject =
		error instanceof Error
			? error
			: new Error(String(error));

	const itemLines =
		items?.length
			? items
				.map(
					(item) =>
						`- ${item.name ?? 'Unknown Item'}${item.size ? ` / ${item.size}` : ''
						}${item.color ? ` / ${item.color}` : ''
						} / Qty ${item.quantity ?? 0}${item.price != null
							? ` / $${item.price.toFixed(2)}`
							: ''
						}`
				)
				.join('\n')
			: 'No item information available';

	return `
ORDER PROCESSING ERROR REPORT
=============================

IMPORTANT:
Payment may have been successfully processed, but the order could not be completed.

Customer has been instructed NOT to resubmit the order.

CUSTOMER INFORMATION
--------------------

Timestamp:
${new Date().toISOString()}

Customer ID:
${customerId ?? 'Unknown'}

Customer Name:
${customerName ?? 'Unknown'}

Email:
${email ?? 'Unknown'}

Order Name:
${orderName}

ORDER DETAILS
-------------

Subtotal:
$${subtotal?.toFixed(2) ?? '0.00'}

Tax:
$${salesTax?.toFixed(2) ?? '0.00'}

Total:
$${total?.toFixed(2) ?? '0.00'}

Items:
${itemLines}

Billing Address:
${billingAddress?.firstName ?? ''} ${billingAddress?.lastName ?? ''}
${billingAddress?.company ?? ''}
${billingAddress?.address1 ?? ''}
${billingAddress?.address2 ?? ''}
${billingAddress?.city ?? ''}, ${billingAddress?.state ?? ''} ${billingAddress?.zip ?? ''}

PAYMENT INFORMATION
-------------------

Adyen Result:
${adyenResult ?? 'Unknown'}

PSP Reference:
${pspReference ?? 'Unknown'}

Merchant Reference:
${merchantReference ?? 'Unknown'}

TECHNICAL INFORMATION
---------------------

Page:
Checkout

Function:
submitOrder

Browser:
${navigator.userAgent}

Error Message:
${errorObject.message}

Stack Trace:
${errorObject.stack ?? 'No stack trace available'}
`.trim();
}