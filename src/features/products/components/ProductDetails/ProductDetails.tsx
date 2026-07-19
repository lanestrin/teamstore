import { useState } from "react";
import { LuChevronDown } from "react-icons/lu";

import styles from "./ProductDetails.module.scss";

type ProductDetailSection = "details" | "sizing" | "care" | "returns";

interface ProductDetailsProps {
  description?: string;
}

const FALLBACK_DESCRIPTION =
  "A quality product selected for everyday wear and performance.";

function getDescriptionFeatures(description?: string) {
  if (!description?.includes("*")) {
    return [];
  }

  return description
    .split("*")
    .map((feature) => feature.trim())
    .filter(Boolean);
}

export default function ProductDetails({ description }: ProductDetailsProps) {
  const [openSections, setOpenSections] = useState<ProductDetailSection[]>([
    "details",
  ]);

  const descriptionText = description?.trim() || FALLBACK_DESCRIPTION;
  const descriptionFeatures = getDescriptionFeatures(descriptionText);

  const toggleSection = (section: ProductDetailSection) => {
    setOpenSections((currentSections) =>
      currentSections.includes(section)
        ? currentSections.filter((item) => item !== section)
        : [...currentSections, section],
    );
  };

  const isOpen = (section: ProductDetailSection) =>
    openSections.includes(section);

  return (
    <section className={styles.details}>
      <div className={styles.accordionGroup}>
        <div className={styles.accordion}>
          <button
            type="button"
            className={styles.accordionHeader}
            aria-expanded={isOpen("details")}
            aria-controls="product-details-content"
            onClick={() => toggleSection("details")}
          >
            <span>Product Details</span>

            <LuChevronDown
              aria-hidden="true"
              className={isOpen("details") ? styles.rotate : ""}
            />
          </button>

          {isOpen("details") && (
            <div
              id="product-details-content"
              className={styles.accordionContent}
            >
              {descriptionFeatures.length > 1 ? (
                <ul>
                  {descriptionFeatures.map((feature, index) => (
                    <li key={`${feature}-${index}`}>{feature}</li>
                  ))}
                </ul>
              ) : (
                <p>{descriptionText}</p>
              )}
            </div>
          )}
        </div>

        <div className={styles.accordion}>
          <button
            type="button"
            className={styles.accordionHeader}
            aria-expanded={isOpen("sizing")}
            aria-controls="product-sizing-content"
            onClick={() => toggleSection("sizing")}
          >
            <span>Sizing Information</span>

            <LuChevronDown
              aria-hidden="true"
              className={isOpen("sizing") ? styles.rotate : ""}
            />
          </button>

          {isOpen("sizing") && (
            <div
              id="product-sizing-content"
              className={styles.accordionContent}
            >
              <p>
                Review the available sizes before placing your order. Sizing may
                vary by product and manufacturer.
              </p>

              <ul>
                <li>Select from the currently available sizes</li>
                <li>Review product-specific measurements when available</li>
                <li>Consider sizing up when between sizes</li>
              </ul>
            </div>
          )}
        </div>

        <div className={styles.accordion}>
          <button
            type="button"
            className={styles.accordionHeader}
            aria-expanded={isOpen("care")}
            aria-controls="product-care-content"
            onClick={() => toggleSection("care")}
          >
            <span>Care Instructions</span>

            <LuChevronDown
              aria-hidden="true"
              className={isOpen("care") ? styles.rotate : ""}
            />
          </button>

          {isOpen("care") && (
            <div id="product-care-content" className={styles.accordionContent}>
              <p>
                Follow the garment care label to protect the product, material,
                and printed details.
              </p>

              <ul>
                <li>Wash with similar colors</li>
                <li>Use mild detergent</li>
                <li>Avoid bleach unless the care label permits it</li>
                <li>Follow the recommended drying instructions</li>
              </ul>
            </div>
          )}
        </div>

        <div className={styles.accordion}>
          <button
            type="button"
            className={styles.accordionHeader}
            aria-expanded={isOpen("returns")}
            aria-controls="product-returns-content"
            onClick={() => toggleSection("returns")}
          >
            <span>Returns &amp; Exchanges</span>

            <LuChevronDown
              aria-hidden="true"
              className={isOpen("returns") ? styles.rotate : ""}
            />
          </button>

          {isOpen("returns") && (
            <div
              id="product-returns-content"
              className={styles.accordionContent}
            >
              <p>
                Return eligibility depends on the product condition and the
                applicable store policy.
              </p>

              <ul>
                <li>Items must be unused and in their original condition</li>
                <li>Personalized items may not be eligible for return</li>
                <li>Contact support for damaged or incorrect products</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
