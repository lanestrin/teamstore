export type ProductCollectionActivity =
  | "basketball"
  | "baseball"
  | "football"
  | "soccer"
  | "softball"
  | "volleyball"
  | "wrestling"
  | "spirit-wear"
  | "other";

export type ProductCollectionSection =
  | "uniforms"
  | "fanwear";

export type ArtworkPlacementKey =
  | "center-chest"
  | "left-chest"
  | "left-leg"
  | "front-center";

export interface ProductCollectionItem {
  providerProductId: string;
  section: ProductCollectionSection;
  suggestedRequired: boolean;
  artworkPlacementKey: ArtworkPlacementKey;
  sortOrder: number;
}

export type ProductCollections = Record<
  ProductCollectionActivity,
  readonly ProductCollectionItem[]
>;

export const PRODUCT_COLLECTION_PROVIDER =
  "augusta-csv";

export const PRODUCT_COLLECTIONS = {
  basketball: [
    {
      providerProductId: "560R",
      section: "uniforms",
      suggestedRequired: true,
      artworkPlacementKey: "center-chest",
      sortOrder: 1,
    },
    {
      providerProductId: "720700",
      section: "uniforms",
      suggestedRequired: true,
      artworkPlacementKey: "left-leg",
      sortOrder: 2,
    },
    {
      providerProductId: "560RW",
      section: "uniforms",
      suggestedRequired: true,
      artworkPlacementKey: "center-chest",
      sortOrder: 3,
    },
    {
      providerProductId: "721600",
      section: "uniforms",
      suggestedRequired: true,
      artworkPlacementKey: "left-leg",
      sortOrder: 4,
    },
    {
      providerProductId: "412000",
      section: "fanwear",
      suggestedRequired: false,
      artworkPlacementKey: "center-chest",
      sortOrder: 1,
    },
    {
      providerProductId: "410400",
      section: "fanwear",
      suggestedRequired: false,
      artworkPlacementKey: "center-chest",
      sortOrder: 2,
    },
    {
      providerProductId: "125400",
      section: "fanwear",
      suggestedRequired: false,
      artworkPlacementKey: "center-chest",
      sortOrder: 3,
    },
    {
      providerProductId: "225400B",
      section: "fanwear",
      suggestedRequired: false,
      artworkPlacementKey: "center-chest",
      sortOrder: 4,
    },
    {
      providerProductId: "416000",
      section: "fanwear",
      suggestedRequired: false,
      artworkPlacementKey: "center-chest",
      sortOrder: 5,
    },
    {
      providerProductId: "410200",
      section: "fanwear",
      suggestedRequired: false,
      artworkPlacementKey: "left-chest",
      sortOrder: 6,
    },
    {
      providerProductId: "222576",
      section: "fanwear",
      suggestedRequired: false,
      artworkPlacementKey: "left-chest",
      sortOrder: 7,
    },
    {
      providerProductId: "498F",
      section: "fanwear",
      suggestedRequired: false,
      artworkPlacementKey: "front-center",
      sortOrder: 8,
    },
  ],

  baseball: [],
  football: [],
  soccer: [],
  softball: [],
  volleyball: [],
  wrestling: [],
  "spirit-wear": [],
  other: [],
} satisfies ProductCollections;