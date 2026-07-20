export interface CartItem {
  lineId: string;
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  imageUrl: string;
  color: string;
  size: string;
  unitPriceInCents: number;
  quantity: number;
}

export type AddCartItem = Omit<CartItem, "lineId">;