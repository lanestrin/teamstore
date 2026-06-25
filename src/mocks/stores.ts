export interface Store {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export const stores: Store[] = [
  {
    id: 1,
    name: "Blue Valley Soccer",
    slug: "blue-valley-soccer",
    description: "Official team apparel and fan gear."
  },
  {
    id: 2,
    name: "Kansas City FC",
    slug: "kansas-city-fc",
    description: "Custom apparel for players and supporters."
  },
  {
    id: 3,
    name: "Liberty Baseball",
    slug: "liberty-baseball",
    description: "Performance apparel and team merchandise."
  }
];
