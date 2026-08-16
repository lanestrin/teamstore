import { images } from "../assets/images";
import type { FavoriteStore } from "../features/account/models/FavoriteStore";
import type { RecentOrder } from "../features/account/models/RecentOrder";

export const favoriteStores: FavoriteStore[] = [
  {
    id: 1,
    name: "Tigers FC",
    location: "Kansas, KS",
    logo: images.logos.tigers,
  },
  {
    id: 2,
    name: "Westview HS",
    location: "Olathe, KS",
    logo: images.logos.knights,
  },
  {
    id: 3,
    name: "Lions Soccer",
    location: "Overland Park, KS",
    logo: images.logos.lions,
  },
];

export const recentOrders: RecentOrder[] = [
  {
    id: 1,
    orderNumber: "TS-10428",
    storeName: "Tigers FC",
    orderDate: "May 12, 2026",
    status: "Delivered",
    total: 245.0,
    image: images.products.hoodie,
  },
  {
    id: 2,
    orderNumber: "TS-10311",
    storeName: "Westview HS",
    orderDate: "Apr 28, 2026",
    status: "Shipped",
    total: 89.99,
    image: images.products.backpack,
  },
  {
    id: 3,
    orderNumber: "TS-10207",
    storeName: "Lions Soccer",
    orderDate: "Apr 10, 2026",
    status: "Delivered",
    total: 56.5,
    image: images.products.cap,
  },
];
