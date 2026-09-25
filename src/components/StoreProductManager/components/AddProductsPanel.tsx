import { LuPackage } from "react-icons/lu";

import ProductSuggestionControls from "../../../../packages/store-builder/components/ProductSuggestionControls/ProductSuggestionControls";
import ProductSuggestionSection from "../../../../packages/store-builder/components/ProductSuggestionSection/ProductSuggestionSection";
import type { useStoreProductsManager } from "../hooks/useStoreProductsManager";
import styles from "./AddProductsPanel.module.scss";

type ProductManager = ReturnType<typeof useStoreProductsManager>;

interface AddProductsPanelProps {
  manager: ProductManager;
}

export default function AddProductsPanel({ manager }: AddProductsPanelProps) {
  const { editorState } = manager;
  if (!editorState) return null;

  return (
    <div className={styles.editor}>
      <ProductSuggestionControls
        activity={editorState.activity}
        primaryColorFamily={editorState.primaryColorFamily}
        secondaryColorFamily={editorState.secondaryColorFamily}
        selectedCount={manager.selectedCount}
        suggestionCount={manager.suggestions.length}
        availableProductColorFamilies={manager.availableProductColorFamilies}
        isLoading={manager.isLoading}
        canRegenerate={Boolean(editorState.primaryColorFamily)}
        onActivityChange={manager.handleActivityChange}
        onPrimaryColorChange={manager.handlePrimaryColorChange}
        onSecondaryColorChange={manager.handleSecondaryColorChange}
        onRegenerate={manager.regenerate}
      />

      {manager.hasRequiredProducts && (
        <section className={styles.deadline}>
          <div>
            <h3>Required items deadline</h3>
            <p>Set the deadline for customers to order required products.</p>
          </div>
          <label>
            <span>Order deadline</span>
            <input
              type="date"
              value={editorState.requiredItemsDeadline}
              min={manager.todayDate}
              onChange={manager.handleDeadlineChange}
              required
            />
          </label>
        </section>
      )}

      {manager.deadlinePast && (
        <p className={styles.validationMessage}>
          Choose today or a future date for the required-items deadline.
        </p>
      )}

      {!manager.isLoading && manager.productOptions.length === 0 ? (
        <div className={styles.emptyState}>
          <LuPackage aria-hidden="true" />
          <h3>No products available</h3>
          <p>No catalog products are available for this store configuration.</p>
        </div>
      ) : (
        <>
          {manager.isUsingColorFallback && (
            <aside className={styles.fallbackNotice}>
              No exact primary + secondary color combination is available. Showing products that match the primary color instead.
            </aside>
          )}

          {manager.showUniforms && (
            <ProductSuggestionSection
              title="Uniforms"
              description="Uniform products available for this store."
              section="uniforms"
              suggestions={manager.suggestions}
              isLoading={manager.isLoading}
              artworkSvgsByTemplateId={manager.artworkPreviewSvgsById}
              getArtworkName={manager.getArtworkName}
              getEffectiveColor={manager.getEffectiveColor}
              getArtworkPlacement={manager.getArtworkPlacement}
              isSelected={manager.isSuggestionSelected}
              isRequired={manager.isSuggestionRequired}
              onSelectionChange={manager.handleSelectionChange}
              onRequiredClick={manager.handleRequiredClick}
              onEdit={manager.openSuggestionEditor}
            />
          )}

          {manager.showFanwear && (
            <ProductSuggestionSection
              title="Fanwear"
              description="Fanwear products available for this store."
              section="fanwear"
              suggestions={manager.suggestions}
              isLoading={manager.isLoading}
              artworkSvgsByTemplateId={manager.artworkPreviewSvgsById}
              getArtworkName={manager.getArtworkName}
              getEffectiveColor={manager.getEffectiveColor}
              getArtworkPlacement={manager.getArtworkPlacement}
              isSelected={manager.isSuggestionSelected}
              isRequired={manager.isSuggestionRequired}
              onSelectionChange={manager.handleSelectionChange}
              onRequiredClick={manager.handleRequiredClick}
              onEdit={manager.openSuggestionEditor}
            />
          )}
        </>
      )}
    </div>
  );
}
