# CSV-only demo catalog

This package removes the earlier supplier-payload products and replaces the
global catalog with a curated selection generated only from:

```text
product-data-std-all.csv
```

## Included catalog

- 12 products
- 192 variants
- Four common team-color choices per product where available
- Adult sizes: S, M, L, XL, 2XL
- Youth sizes: S, M, L, XL where available
- Hats and bags: OS

- 125400: Athletic Fleece Hoodie (20 variants)
- 121500B: Athletic Fleece Jogger (20 variants)
- 410200: B-Core Quarter-Zip Pullover (20 variants)
- 590000: C2 Utility Polo (20 variants)
- 100000: Fit Flex Tee (20 variants)
- 327850: Player Backpack (4 variants)
- 322970: Sheffield Soccer Jersey (20 variants)
- 1420: Training Shorts (20 variants)
- 104C: Trucker Snapback Cap (4 variants)
- 212000: Youth B-Core Tee (16 variants)
- 245400: Youth Performance Fleece Hoodie (16 variants)
- 1421: Youth Training Shorts (12 variants)

## Install

Copy:

```text
convex/csvDemoCatalog.ts
convex/data/csvDemoCatalogData.ts
```

The old `supplierSeed.ts` and `supplierCatalogData.ts` files are no longer
needed after this replacement.

Run:

```bash
npx convex dev
```

## Replace the current catalog

Call the mutation from an authenticated platform-admin page:

```tsx
const replaceCatalog = useMutation(
  api.csvDemoCatalog.replaceCatalog
);

const result = await replaceCatalog({
  confirmation: "REPLACE_CATALOG",
});
```

This mutation:

1. Deletes every existing `productVariant`.
2. Deletes every existing `product`.
3. Inserts the curated CSV-only catalog.

The operation is destructive and should only be used now, before orders or
store products reference the current catalog IDs.

## Pricing

- `baseCostInCents` comes from the CSV `Cost` column.
- `directPriceInCents` comes from the CSV `MSRP` column.
- Only CSV rows with `Status` equal to `20` were included.

## Images

The selected CSV rows contain complete HTTPS image URLs, so no CDN base URL is
required.

## Source subset

`csv-demo-selection.csv` contains the exact source rows used to generate the
Convex catalog data.
