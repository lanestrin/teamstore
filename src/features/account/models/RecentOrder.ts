export interface RecentOrder {
	id: number;
	orderNumber: string;
	storeName: string;
	orderDate: string;
	status: "Delivered" | "Shipped";
	total: number;
	image: string;
}
