import { LuPackage } from "react-icons/lu";

import type {
  ManagedProductPreview,
  ManagedStore,
  ManagedStoreProduct,
} from "../types";
import StoreProductRow from "./StoreProductRow";
import styles from "./StoreProductList.module.scss";

interface StoreProductListProps {
  products: ManagedStore["products"];
  isBusy: boolean;
  getPreview: (product: ManagedStoreProduct) => ManagedProductPreview | null;
  onView: (product: ManagedStoreProduct) => void;
  onEditColor: (product: ManagedStoreProduct) => void;
  onEditArtwork: (product: ManagedStoreProduct) => void;
  onRemove: (product: ManagedStoreProduct) => void;
}

function ProductGroup({
  title,
  description,
  products,
  isBusy,
  getPreview,
  onView,
  onEditColor,
  onEditArtwork,
  onRemove,
}: {
  title: string;
  description: string;
  products: ManagedStore["products"];
  isBusy: boolean;
  getPreview: (product: ManagedStoreProduct) => ManagedProductPreview | null;
  onView: (product: ManagedStoreProduct) => void;
  onEditColor: (product: ManagedStoreProduct) => void;
  onEditArtwork: (product: ManagedStoreProduct) => void;
  onRemove: (product: ManagedStoreProduct) => void;
}) {
  if (products.length === 0) return null;

  return (
    <section className={styles.group}>
      <div className={styles.groupHeader}>
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <span className={styles.countBadge}>{products.length}</span>
      </div>

      <div className={styles.list}>
        {products.map((product) => (
          <StoreProductRow
            key={product.storeProductId}
            product={product}
            preview={getPreview(product)}
            isBusy={isBusy}
            onView={onView}
            onEditColor={onEditColor}
            onEditArtwork={onEditArtwork}
            onRemove={onRemove}
          />
        ))}
      </div>
    </section>
  );
}

export default function StoreProductList({
  products,
  isBusy,
  getPreview,
  onView,
  onEditColor,
  onEditArtwork,
  onRemove,
}: StoreProductListProps) {
  if (products.length === 0) {
    return (
      <div className={styles.emptyState}>
        <LuPackage aria-hidden="true" />
        <h3>No products</h3>
        <p>This store does not currently have any products.</p>
      </div>
    );
  }

  const requiredProducts = products.filter((product) => product.isRequired);
  const optionalProducts = products.filter((product) => !product.isRequired);

  return (
    <div className={styles.sections}>
      <ProductGroup
        title="Required Products"
        description="Items customers are expected to purchase for this store."
        products={requiredProducts}
        isBusy={isBusy}
        getPreview={getPreview}
        onView={onView}
        onEditColor={onEditColor}
        onEditArtwork={onEditArtwork}
        onRemove={onRemove}
      />

      <ProductGroup
        title="Fanwear Products"
        description="Optional products customers can purchase from the store."
        products={optionalProducts}
        isBusy={isBusy}
        getPreview={getPreview}
        onView={onView}
        onEditColor={onEditColor}
        onEditArtwork={onEditArtwork}
        onRemove={onRemove}
      />
    </div>
  );
}
