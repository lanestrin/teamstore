import hoodie from "../assets/images/hoodie.png";
import hoodie2 from "../assets/images/hoodie2.png";
import tee from "../assets/images/tee.png";
import backpack from "../assets/images/backpack.png";
import cap from "../assets/images/cap.png";

import type { IProduct } from "../types/product.types";

const apparelSizes = {
  youthSizes: ["YS", "YM", "YL"],

  adultSizes: ["S", "M", "L", "XL", "2XL"],
};

export const requiredProducts: IProduct[] = [
  {
    id: 1,
    sku: "JAG-HOOD-001",
    slug: "required-team-hoodie",
    name: "Required Team Hoodie",
    image: hoodie,
    price: 42.0,
    deadline: "2026-08-15",
    inCart: true,

    isRequired: true,

    description: "Official Jaguars Soccer team hoodie required for all rostered players.",

    deliveryEstimate: "September 1 - September 5, 2026",

    images: [hoodie, hoodie, hoodie, hoodie],

    ...apparelSizes,

    allowNamePersonalization: true,
    allowNumberPersonalization: true,
  },

  {
    id: 2,
    sku: "JAG-HOOD-002",
    slug: "required-practice-hoodie",
    name: "Required Practice Hoodie",
    image: hoodie2,
    price: 38.0,
    deadline: "2026-08-15",
    inCart: false,

    isRequired: true,

    description: "Lightweight practice hoodie approved for all Jaguars Soccer training sessions.",

    deliveryEstimate: "September 1 - September 5, 2026",

    images: [hoodie2, hoodie2, hoodie2, hoodie2],

    ...apparelSizes,
  },

  {
    id: 3,
    sku: "JAG-TEE-001",
    slug: "required-team-tee",
    name: "Required Team Tee",
    image: tee,
    price: 24.0,
    deadline: "2026-08-15",
    inCart: true,

    isRequired: true,

    description: "Official Jaguars Soccer performance tee required for all players.",

    deliveryEstimate: "September 1 - September 5, 2026",

    images: [tee, tee, tee, tee],

    ...apparelSizes,

    allowNamePersonalization: true,
    allowNumberPersonalization: true,
  },
];

export const fanwearProducts: IProduct[] = [
  {
    id: 4,
    sku: "JAG-FAN-001",
    slug: "jaguars-fan-hoodie",
    name: "Jaguars Fan Hoodie",
    image: hoodie,
    price: 45.0,

    description: "Comfortable fleece hoodie for Jaguars Soccer families and supporters.",

    deliveryEstimate: "Ships within 10 business days",

    images: [hoodie, hoodie, hoodie, hoodie],

    ...apparelSizes,
  },

  {
    id: 5,
    sku: "JAG-FAN-002",
    slug: "jaguars-sideline-cap",
    name: "Jaguars Sideline Cap",
    image: cap,
    price: 28.0,

    description: "Official Jaguars Soccer sideline cap worn by players, coaches, and supporters.",

    deliveryEstimate: "Ships within 10 business days",

    images: [cap, cap, cap, cap],

    adultSizes: ["S/M", "L/XL"],
  },

  {
    id: 6,
    sku: "JAG-FAN-003",
    slug: "jaguars-backpack",
    name: "Jaguars Backpack",
    image: backpack,
    price: 55.0,

    description: "Durable backpack designed for practices, tournaments, and travel.",

    deliveryEstimate: "Ships within 10 business days",

    images: [backpack, backpack, backpack, backpack],
  },

  {
    id: 7,
    sku: "JAG-FAN-004",
    slug: "jaguars-spirit-tee",
    name: "Jaguars Spirit Tee",
    image: tee,
    price: 22.0,

    description: "Lightweight spirit tee perfect for game day and everyday wear.",

    deliveryEstimate: "Ships within 10 business days",

    images: [tee, tee, tee, tee],

    ...apparelSizes,
  },

  {
    id: 8,
    sku: "JAG-FAN-005",
    slug: "jaguars-alumni-hoodie",
    name: "Jaguars Alumni Hoodie",
    image: hoodie2,
    price: 48.0,

    description: "Premium alumni hoodie celebrating Jaguars Soccer tradition.",

    deliveryEstimate: "Ships within 10 business days",

    images: [hoodie2, hoodie2, hoodie2, hoodie2],

    ...apparelSizes,
  },

  {
    id: 9,
    sku: "JAG-FAN-006",
    slug: "jaguars-travel-backpack",
    name: "Jaguars Travel Backpack",
    image: backpack,
    price: 60.0,

    description: "Large-capacity travel backpack for tournaments and overnight trips.",

    deliveryEstimate: "Ships within 10 business days",

    images: [backpack, backpack, backpack, backpack],
  },

  {
    id: 10,
    sku: "JAG-FAN-007",
    slug: "jaguars-fan-cap",
    name: "Jaguars Fan Cap",
    image: cap,
    price: 26.0,

    description: "Classic Jaguars Soccer cap for parents and supporters.",

    deliveryEstimate: "Ships within 10 business days",

    images: [cap, cap, cap, cap],

    adultSizes: ["S/M", "L/XL"],
  },

  {
    id: 11,
    sku: "JAG-FAN-008",
    slug: "jaguars-performance-tee",
    name: "Jaguars Performance Tee",
    image: tee,
    price: 25.0,

    description: "Moisture-wicking performance tee featuring Jaguars Soccer branding.",

    deliveryEstimate: "Ships within 10 business days",

    images: [tee, tee, tee, tee],

    ...apparelSizes,
  },

  {
    id: 12,
    sku: "JAG-FAN-009",
    slug: "jaguars-spirit-hoodie",
    name: "Jaguars Spirit Hoodie",
    image: hoodie,
    price: 44.0,

    description: "Everyday spirit hoodie built for comfort and school pride.",

    deliveryEstimate: "Ships within 10 business days",

    images: [hoodie, hoodie, hoodie, hoodie],

    ...apparelSizes,
  },

  {
    id: 13,
    sku: "JAG-FAN-010",
    slug: "jaguars-booster-club-tee",
    name: "Jaguars Booster Club Tee",
    image: tee,
    price: 20.0,

    description: "Official Booster Club tee supporting Jaguars Soccer programs.",

    deliveryEstimate: "Ships within 10 business days",

    images: [tee, tee, tee, tee],

    ...apparelSizes,
  },

  {
    id: 14,
    sku: "JAG-FAN-011",
    slug: "jaguars-coaches-cap",
    name: "Jaguars Coaches Cap",
    image: cap,
    price: 30.0,

    description: "Premium coaches cap featuring embroidered Jaguars Soccer branding.",

    deliveryEstimate: "Ships within 10 business days",

    images: [cap, cap, cap, cap],

    adultSizes: ["S/M", "L/XL"],
  },

  {
    id: 15,
    sku: "JAG-FAN-012",
    slug: "jaguars-premium-backpack",
    name: "Jaguars Premium Backpack",
    image: backpack,
    price: 65.0,

    description: "Premium travel backpack with expanded storage and team branding.",

    deliveryEstimate: "Ships within 10 business days",

    images: [backpack, backpack, backpack, backpack],
  },

  {
    id: 16,
    sku: "JAG-FAN-013",
    slug: "jaguars-performance-hoodie",
    name: "Jaguars Performance Hoodie",
    image: hoodie2,
    price: 52.0,

    description: "Performance fleece hoodie built for athletes and everyday wear.",

    deliveryEstimate: "Ships within 10 business days",

    images: [hoodie2, hoodie2, hoodie2, hoodie2],

    ...apparelSizes,
  },
];
