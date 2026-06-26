import styles from "./TrendingProducts.module.scss";
import ProductCard from "../../../../components/product-card/ProductCard";
import { fanwearProducts } from "../../../../mocks/products";


export default function TrendingProducts() {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2>Trending Products</h2>

        <a href="/products">
          View all →
        </a>
      </div>

      <div className={styles.grid}>
        {fanwearProducts.slice(0, 5).map((product) => (
          <ProductCard
            key={product.id}
            product={product}
          />
        ))}
      </div>
    </section>
  );
}
