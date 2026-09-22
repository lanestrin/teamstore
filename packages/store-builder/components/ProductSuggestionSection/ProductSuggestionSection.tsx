import { useId } from "react";
import { LuLoaderCircle } from "react-icons/lu";

import type { ProductArtworkPlacement } from "../../lib/decorationProfiles";
import { NO_ARTWORK_TEMPLATE_ID } from "../../lib/productGeneration";
import type { GeneratedSuggestion, ProductColorOption } from "../../lib/productStep.types";
import ProductSuggestionCard from "../ProductSuggestionCard/ProductSuggestionCard";

import styles from "./ProductSuggestionSection.module.scss";

interface ProductSuggestionSectionProps {
  title: string;
  description: string;
  section: GeneratedSuggestion["section"];
  suggestions: readonly GeneratedSuggestion[];
  isLoading: boolean;
  artworkSvgsByTemplateId: Readonly<Record<string, string>>;
  getArtworkName: (artworkTemplateId: string) => string;
  getEffectiveColor: (suggestion: GeneratedSuggestion) => ProductColorOption;
  getArtworkPlacement: (suggestion: GeneratedSuggestion) => ProductArtworkPlacement;
  isSelected: (suggestion: GeneratedSuggestion) => boolean;
  isRequired: (suggestion: GeneratedSuggestion) => boolean;
  onSelectionChange: (suggestion: GeneratedSuggestion, checked: boolean) => void;
  onRequiredClick: (suggestion: GeneratedSuggestion) => void;
  onEdit: (suggestion: GeneratedSuggestion) => void;
}

export default function ProductSuggestionSection({
  title,
  description,
  section,
  suggestions,
  isLoading,
  artworkSvgsByTemplateId,
  getArtworkName,
  getEffectiveColor,
  getArtworkPlacement,
  isSelected,
  isRequired,
  onSelectionChange,
  onRequiredClick,
  onEdit,
}: ProductSuggestionSectionProps) {
  const headingId = useId();

  const sectionSuggestions = suggestions.filter((suggestion) => suggestion.section === section);

  if (!isLoading && sectionSuggestions.length === 0) {
    return null;
  }

  return (
    <section className={styles.section} aria-labelledby={headingId} aria-busy={isLoading}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 id={headingId}>{title}</h2>

          <p>{description}</p>
        </div>

        {!isLoading && <span className={styles.sectionCount}>{sectionSuggestions.length} suggestions</span>}
      </div>

      {isLoading ? (
        <div className={styles.loading} role="status">
          <LuLoaderCircle className={styles.loadingIcon} aria-hidden="true" />

          <span>Generating product suggestions…</span>
        </div>
      ) : (
        <div className={styles.productGrid}>
          {sectionSuggestions.map((suggestion) => {
            const color = getEffectiveColor(suggestion);
            const placement = getArtworkPlacement(suggestion);

            return (
              <ProductSuggestionCard
                key={suggestion.combinationKey}
                suggestion={suggestion}
                color={color}
                placement={placement}
                artworkName={
                  suggestion.artworkTemplateId === NO_ARTWORK_TEMPLATE_ID ? "None" : getArtworkName(suggestion.artworkTemplateId)
                }
                artworkSvg={artworkSvgsByTemplateId[suggestion.artworkTemplateId] ?? null}
                isSelected={isSelected(suggestion)}
                isRequired={isRequired(suggestion)}
                onSelectionChange={(checked) => onSelectionChange(suggestion, checked)}
                onRequiredClick={() => onRequiredClick(suggestion)}
                onEdit={() => onEdit(suggestion)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
