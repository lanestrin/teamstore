export type ProductCategory =
  | "Required"
  | "Fanwear"
  | "Headwear"
  | "Bags";

export interface IProduct {
  id: number;
  sku: string;
  slug: string;

  storeId?: number;
  storeName?: string;

  category?: ProductCategory;
  isRequired?: boolean;

  name: string;
  image: string;
  price: number;

  teamName?: string;

  description?: string;
  decoration?: string;
  sizingInfo?: string;
  returnsPolicy?: string;

  deadline?: string;
  deliveryEstimate?: string;

  inCart?: boolean;

  images?: string[];

  youthSizes?: string[];
  adultSizes?: string[];

  allowNamePersonalization?: boolean;
  allowNumberPersonalization?: boolean;
}
