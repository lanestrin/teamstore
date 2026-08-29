If later on you want to add more products, run the script in this order.

npx tsx scripts/auditCatalogImages.ts --products 100
npx tsx scripts/auditCatalogColors.ts
npx tsx scripts/classifyCatalogColors.ts
npx tsx scripts/generateSelectedProductsData.ts
