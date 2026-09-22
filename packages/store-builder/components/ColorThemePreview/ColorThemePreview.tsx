import type { CSSProperties } from "react";

import styles from "./ColorThemePreview.module.scss";

interface ColorThemePreviewProps {
  primaryColor: string;
  secondaryColor: string;
}

function getContrastColor(hexColor: string): "#111111" | "#FFFFFF" {
  const normalized = hexColor.replace("#", "");

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return "#111111";
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance > 0.6 ? "#111111" : "#FFFFFF";
}

export default function ColorThemePreview({ primaryColor, secondaryColor }: ColorThemePreviewProps) {
  const previewStyles = {
    "--preview-primary": primaryColor,
    "--preview-secondary": secondaryColor,
    "--preview-primary-text": getContrastColor(primaryColor),
    "--preview-secondary-text": getContrastColor(secondaryColor),
  } as CSSProperties;

  return (
    <section className={styles.preview} style={previewStyles} aria-labelledby="color-preview-title">
      <div className={styles.previewHeader}>
        <div>
          <span className={styles.eyebrow}>Live color preview</span>

          <h2 id="color-preview-title">Your Team Store</h2>
        </div>

        <div className={styles.swatches} aria-label="Selected colors">
          <span className={styles.primarySwatch} title={`Primary color ${primaryColor}`} />

          <span className={styles.secondarySwatch} title={`Secondary color ${secondaryColor}`} />
        </div>
      </div>

      <div className={styles.storePreview}>
        <div className={styles.storeHeader}>
          <div className={styles.storeBrand}>TEAMSTORE</div>

          <div className={styles.storeNav} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className={styles.hero}>
          <span className={styles.heroLabel}>YOUR TEAM. YOUR COLORS.</span>

          <h3>Official gear for your team</h3>

          <p>Show your colors with fanwear built around your organization.</p>

          <span className={styles.cta}>Shop Fanwear</span>
        </div>

        <div className={styles.products}>
          <div className={styles.productsHeader}>
            <strong>Featured Products</strong>
            <span>Team Favorites</span>
          </div>

          <div className={styles.productGrid} aria-hidden="true">
            <div className={styles.productCard}>
              <div className={styles.productImage}>
                <span className={styles.shirtShape} />
              </div>

              <div className={styles.productLines}>
                <span />
                <span />
              </div>
            </div>

            <div className={styles.productCard}>
              <div className={styles.productImage}>
                <span className={styles.shirtShape} />
              </div>

              <div className={styles.productLines}>
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.colorBar}>
          <span>Primary</span>
          <strong>{primaryColor.toUpperCase()}</strong>

          <span>Secondary</span>
          <strong>{secondaryColor.toUpperCase()}</strong>
        </div>
      </div>
    </section>
  );
}
