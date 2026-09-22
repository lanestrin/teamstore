import type { CSSProperties } from "react";
import { LuSearch, LuShoppingCart, LuTruck } from "react-icons/lu";

import { createStoreTheme } from "../../utils/theme/createStoreTheme";

import BenefitsPreview from "../BenefitsPreview/BenefitsPreview";
import FooterPreview from "../FooterPreview/FooterPreview";
import ProductPreview, { type ProductPreviewItem } from "../ProductPreview/ProductPreview";

import styles from "../LivePreview/LivePreview.module.scss";

interface StorefrontPreviewProps {
  primaryColor: string;
  secondaryColor: string;

  organizationName: string;
  storeName: string;
  storeDescription: string;

  logoUrl?: string | null;

  requiredProducts?: readonly ProductPreviewItem[];
  fanwearProducts?: readonly ProductPreviewItem[];
}

export default function StorefrontPreview({
  primaryColor,
  secondaryColor,
  organizationName,
  storeName,
  storeDescription,
  logoUrl,
  requiredProducts,
  fanwearProducts,
}: StorefrontPreviewProps) {
  const theme = createStoreTheme(primaryColor, secondaryColor);

  const showRequiredProducts = requiredProducts === undefined || requiredProducts.length > 0;

  const showFanwearProducts = fanwearProducts === undefined || fanwearProducts.length > 0;

  return (
    <div className={styles.storePreview}>
      <div className={styles.browser}>
        <div className={styles.browserBar}>
          <span />
          <span />
          <span />
        </div>

        <div className={styles.store}>
          <div
            className={styles.promoBar}
            style={{
              background: theme.promoBar.background,
              color: theme.promoBar.text,
            }}
          >
            <LuTruck aria-hidden="true" />

            <span>Free shipping on orders over $75</span>
          </div>

          <header
            className={styles.storeHeader}
            style={
              {
                "--primary-color": primaryColor,
                "--header-muted-text-color": theme.header.text,
                background: theme.header.background,
                color: theme.header.text,
              } as CSSProperties
            }
          >
            <div className={styles.brand}>
              {logoUrl && <img src={logoUrl} alt={`${organizationName} logo`} className={styles.logoImage} />}

              <div>
                <strong>{storeName}</strong>
                <span>{organizationName}</span>
              </div>
            </div>

            <nav className={styles.nav}>
              <span>Shop</span>

              {showRequiredProducts && <span>Required Items</span>}

              {showFanwearProducts && <span>Fanwear</span>}

              <span>About Us</span>
            </nav>

            <div className={styles.actions}>
              <LuSearch aria-hidden="true" />

              <div className={styles.cart}>
                <LuShoppingCart aria-hidden="true" />

                <span
                  style={{
                    background: theme.badge.background,
                    color: theme.badge.text,
                  }}
                >
                  2
                </span>
              </div>
            </div>
          </header>

          <section
            className={[styles.hero, theme.hero.disableGradients ? styles.heroNoGradients : ""].filter(Boolean).join(" ")}
            style={
              {
                "--hero-primary": primaryColor,
                "--hero-secondary": secondaryColor,
                "--hero-base": theme.hero.backgroundColor,
                backgroundColor: theme.hero.backgroundColor,
                color: theme.hero.text,
              } as CSSProperties
            }
          >
            <div
              className={styles.heroTexture}
              style={{
                backgroundImage: theme.hero.backgroundImage,
              }}
            />

            <div className={styles.heroContent}>
              <span>Official gear for</span>

              <h3>{storeName}</h3>

              <p>{storeDescription}</p>

              <div className={styles.heroActions}>
                {showRequiredProducts && (
                  <button
                    type="button"
                    style={{
                      background: theme.buttons.primary.background,
                      color: theme.buttons.primary.text,
                    }}
                  >
                    Shop Required Items
                  </button>
                )}

                {showFanwearProducts && (
                  <button
                    type="button"
                    style={{
                      background: theme.buttons.secondary.background,
                      color: theme.buttons.secondary.text,
                      borderColor: theme.buttons.secondary.border,
                    }}
                  >
                    Shop Fanwear
                  </button>
                )}
              </div>
            </div>

            {logoUrl && (
              <div className={styles.heroArtwork}>
                <img src={logoUrl} alt={`${organizationName} logo`} className={styles.heroLogo} />
              </div>
            )}
          </section>

          <BenefitsPreview brandColor={theme.brand.color} />

          {showRequiredProducts && (
            <ProductPreview title="Required Team Items" brandColor={theme.brand.color} showStatus products={requiredProducts} />
          )}

          {showFanwearProducts && <ProductPreview title="Featured Fanwear" brandColor={theme.brand.color} products={fanwearProducts} />}

          <FooterPreview brandColor={theme.brand.color} />
        </div>
      </div>
    </div>
  );
}
