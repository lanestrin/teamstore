import { useQuery } from "convex/react";
import { Link } from "react-router-dom";

import { api } from "../../../../../convex/_generated/api";
import ProductCard from "../../../../components/product-card/ProductCard";
import styles from "./TrendingProducts.module.scss";

function formatPrice(minPriceInCents: number | null, maxPriceInCents: number | null) {
  if (minPriceInCents === null) {
    return "Unavailable";
  }

  const minimumPrice = (minPriceInCents / 100).toFixed(2);

  if (maxPriceInCents !== null && maxPriceInCents !== minPriceInCents) {
    return `From $${minimumPrice}`;
  }

  return `$${minimumPrice}`;
}

export default function TrendingProducts() {
  const products = useQuery(api.products.listTrending, {
    limit: 5,
  });

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2>Trending Products</h2>

        <Link to="/products">View all →</Link>
      </div>

      <div className={styles.grid}>
        {products === undefined && <p>Loading products...</p>}

        {products?.length === 0 && <p>No products are currently available.</p>}

        {products?.map((product) => {
          const imageUrl = product.imageUrls[0];

          if (!imageUrl) {
            return null;
          }

          return (
            <ProductCard
              key={product._id}
              product={{
                id: product._id,
                name: product.name,
                imageUrl,
                priceLabel: formatPrice(product.minPriceInCents, product.maxPriceInCents),
                productUrl: `/product/${product.slug}`,
              }}
            />
          );
        })}
      </div>
    </section>
  );
}
