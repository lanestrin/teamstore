import { useState } from "react";
import { LuPlus, LuTriangleAlert } from "react-icons/lu";

import ProductArtworkEditorModal from "../../../packages/store-builder/components/ProductArtworkEditorModal/ProductArtworkEditorModal";
import AddProductsPanel from "./components/AddProductsPanel";
import ProductColorEditorModal from "./components/ProductColorEditorModal";
import StoreProductList from "./components/StoreProductList";
import ProductViewModal from "./components/ProductViewModal";
import { useStoreProductsManager } from "./hooks/useStoreProductsManager";
import type { ManagedStore, ManagedStoreProduct } from "./types";
import styles from "./StoreProductsManager.module.scss";

interface StoreProductsManagerProps {
  store: ManagedStore;
}

export default function StoreProductsManager({ store }: StoreProductsManagerProps) {
  const manager = useStoreProductsManager(store);
  const [viewingProduct, setViewingProduct] = useState<ManagedStoreProduct | null>(null);

  if (!manager.editorState) {
    return (
      <div className={styles.configurationError}>
        <LuTriangleAlert aria-hidden="true" />
        <div>
          <h2>Product configuration is incomplete</h2>
          <p>This store is missing the activity or product color configuration required to manage its products.</p>
        </div>
      </div>
    );
  }

  function editArtwork(product: ManagedStoreProduct) {
    manager.openExistingProductEditor(product.productId, product.colorKey, product.artworkTemplateId);
  }

  function removeProduct(product: ManagedStoreProduct) {
    void manager.removeProduct(product.productId, product.colorKey, product.artworkTemplateId, product.name);
  }

  const editingColorOptions = manager.editingColorProduct
    ? manager.getProductColorOptions(manager.editingColorProduct.productId)
    : [];

  return (
    <>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>PRODUCTS</span>
          <h2>Store Products</h2>
          <p>Manage the products available to customers in this store.</p>
        </div>

        {manager.isAdding ? (
          <div className={styles.headerActions}>
            <button type="button" className={styles.secondaryAction} disabled={manager.isSaving} onClick={manager.cancelAdding}>
              Cancel
            </button>
            <button
              type="button"
              className={styles.primaryAction}
              disabled={manager.isSaving || manager.isLoading || manager.selectedCount === 0 || manager.deadlineMissing || manager.deadlinePast}
              onClick={() => void manager.saveAddedProducts()}
            >
              {manager.isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        ) : (
          <button type="button" className={styles.primaryAction} onClick={manager.beginAdding}>
            <LuPlus aria-hidden="true" />
            Add Products
          </button>
        )}
      </div>

      {manager.isAdding ? (
        <AddProductsPanel manager={manager} />
      ) : (
        <StoreProductList
          products={store.products}
          isBusy={manager.isLoading || manager.isSaving}
          getPreview={manager.getManagedProductPreview}
          onView={setViewingProduct}
          onEditColor={manager.openColorEditor}
          onEditArtwork={editArtwork}
          onRemove={removeProduct}
        />
      )}

      {viewingProduct && (
        <ProductViewModal
          product={viewingProduct}
          preview={manager.getManagedProductPreview(viewingProduct)}
          onClose={() => setViewingProduct(null)}
        />
      )}

      {manager.editingColorProduct && manager.editingColorKey && (
        <ProductColorEditorModal
          productName={manager.editingColorProduct.name}
          colorOptions={editingColorOptions}
          selectedColorKey={manager.editingColorKey}
          isSaving={manager.isSaving}
          onSelect={manager.setEditingColorKey}
          onSave={() => void manager.saveProductColor()}
          onClose={manager.closeColorEditor}
        />
      )}

      {manager.editingSuggestion && manager.editingProduct && (
        <ProductArtworkEditorModal
          suggestion={manager.editingSuggestion}
          color={manager.getEffectiveColor(manager.editingSuggestion)}
          artworkSvg={manager.artworkPreviewSvgsById[manager.editingProduct.artworkTemplateId] ?? null}
          artworkOptions={manager.artworkOptions}
          selectedArtworkId={manager.editingProduct.artworkTemplateId}
          placement={manager.editingProduct.placement}
          onArtworkChange={manager.handleEditorArtworkChange}
          onPlacementChange={manager.handleEditorPlacementChange}
          onSave={() => void manager.saveProductArtwork()}
          onClose={manager.closeProductEditor}
        />
      )}
    </>
  );
}
