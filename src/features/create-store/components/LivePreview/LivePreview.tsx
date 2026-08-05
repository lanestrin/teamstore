import { useEffect, useState, type CSSProperties } from "react";
import { LuTruck, LuSearch, LuShoppingCart } from "react-icons/lu";

import { useCreateStore } from "../../context/CreateStoreContext";
import { createStoreTheme } from "../../utils/theme/createStoreTheme";

import styles from "./LivePreview.module.scss";
import FooterPreview from "../FooterPreview/FooterPreview";
import ProductPreview from "../ProductPreview/ProductPreview";
import BenefitsPreview from "../BenefitsPreview/BenefitsPreview";

function useFileDataUrl(file: File | null): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setDataUrl(null);
      return;
    }

    const reader = new FileReader();
    let isCancelled = false;

    reader.onload = () => {
      if (!isCancelled && typeof reader.result === "string") {
        setDataUrl(reader.result);
      }
    };

    reader.onerror = () => {
      if (!isCancelled) {
        setDataUrl(null);
      }
    };

    reader.readAsDataURL(file);

    return () => {
      isCancelled = true;

      if (reader.readyState === FileReader.LOADING) {
        reader.abort();
      }
    };
  }, [file]);

  return dataUrl;
}

export default function LivePreview() {
  const { primaryColor, secondaryColor, storeDraft } = useCreateStore();

  const theme = createStoreTheme(primaryColor, secondaryColor);

  const organizationName = storeDraft.organizationName || "Your Organization";

  const organizationSlug = storeDraft.organizationSlug || "your-organization";

  const storeName = storeDraft.storeName || "Your Team Store";

  const storeDescription =
    storeDraft.storeDescription || "Show your pride. Represent your team.";

  const storeSlug = storeDraft.storeSlug || "your-store-name";

  const logoUrl = useFileDataUrl(storeDraft.logoFile);

  return (
    <aside className={styles.preview}>
      <div className={styles.header}>
        <span className={styles.badge}>Live Preview</span>

        <div className={styles.titleRow}>
          <h2>{storeName}</h2>

          <div
            className={styles.colorPalette}
            aria-label="Selected team colors"
          >
            <span
              className={styles.primaryColor}
              style={{
                backgroundColor: primaryColor,
              }}
            />

            <span
              className={styles.secondaryColor}
              style={{
                backgroundColor: secondaryColor,
              }}
            />
          </div>
        </div>

        <p>
          teamstore.com/store/{organizationSlug}/{storeSlug}
        </p>
      </div>

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
              <LuTruck />

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
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt={`${organizationName} logo`}
                    className={styles.logoImage}
                  />
                )}

                <div>
                  <strong>{storeName}</strong>
                  <span>{organizationName}</span>
                </div>
              </div>

              <nav className={styles.nav}>
                <span>Shop</span>
                <span>Required Items</span>
                <span>Fanwear</span>
                <span>About Us</span>
              </nav>

              <div className={styles.actions}>
                <LuSearch />

                <div className={styles.cart}>
                  <LuShoppingCart />

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
              className={[
                styles.hero,
                theme.hero.disableGradients ? styles.heroNoGradients : "",
              ]
                .filter(Boolean)
                .join(" ")}
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
                  <button
                    type="button"
                    style={{
                      background: theme.buttons.primary.background,
                      color: theme.buttons.primary.text,
                    }}
                  >
                    Shop Required Items
                  </button>

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
                </div>
              </div>

              {logoUrl && (
                <div className={styles.heroArtwork}>
                  <img
                    src={logoUrl}
                    alt={`${organizationName} logo`}
                    className={styles.heroLogo}
                  />
                </div>
              )}
            </section>

            <BenefitsPreview brandColor={theme.brand.color} />

            <ProductPreview
              title="Required Team Items"
              brandColor={theme.brand.color}
              showStatus
            />

            <ProductPreview
              title="Featured Fanwear"
              brandColor={theme.brand.color}
            />

            <FooterPreview brandColor={theme.brand.color} />
          </div>
        </div>
      </div>
    </aside>
  );
}
