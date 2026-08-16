import Skeleton from "../../components/skeleton/Skeleton";
import pageStyles from "./CatalogPage.module.scss";
import styles from "./CatalogSkeleton.module.scss";

const SKELETON_CARD_COUNT = 6;
const CATEGORY_FILTER_COUNT = 6;
const SIZE_FILTER_COUNT = 7;
const COLOR_THUMBNAIL_COUNT = 5;

export default function CatalogSkeleton() {
  return (
    <main className={pageStyles.page} aria-busy="true" aria-label="Loading product catalog">
      <span className={pageStyles.visuallyHidden}>Loading product catalog</span>

      <div className={pageStyles.container}>
        <header className={pageStyles.pageHeader}>
          <div className={styles.headerCopy}>
            <Skeleton className={styles.eyebrow} />
            <Skeleton className={styles.title} />
            <Skeleton className={styles.description} />
            <Skeleton className={styles.descriptionShort} />
          </div>

          <Skeleton className={styles.productTotal} />
        </header>

        <div className={pageStyles.toolbar}>
          <Skeleton className={styles.search} />
          <Skeleton className={styles.sort} />
        </div>

        <div className={pageStyles.catalogLayout}>
          <aside className={`${pageStyles.filters} ${styles.filters}`}>
            <Skeleton className={styles.filterHeading} />

            <FilterGroupSkeleton optionCount={CATEGORY_FILTER_COUNT} labelWidth="70%" />

            <FilterGroupSkeleton optionCount={SIZE_FILTER_COUNT} labelWidth="35%" />
          </aside>

          <section className={pageStyles.results}>
            <div className={pageStyles.resultsHeader}>
              <Skeleton className={styles.resultsCount} />
            </div>

            <div className={pageStyles.productGrid}>
              {Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

interface FilterGroupSkeletonProps {
  optionCount: number;
  labelWidth: string;
}

function FilterGroupSkeleton({ optionCount, labelWidth }: FilterGroupSkeletonProps) {
  return (
    <div className={styles.filterGroup}>
      <Skeleton className={styles.filterLegend} />

      <div className={styles.filterOptions}>
        {Array.from({ length: optionCount }).map((_, index) => (
          <div key={index} className={styles.filterOption}>
            <Skeleton className={styles.checkbox} />

            <Skeleton className={styles.filterLabel} style={{ width: labelWidth }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className={styles.card}>
      <Skeleton className={styles.cardImage} />

      <div className={styles.cardContent}>
        <Skeleton className={styles.cardTitle} />
        <Skeleton className={styles.cardTitleShort} />

        <div className={styles.thumbnails}>
          {Array.from({ length: COLOR_THUMBNAIL_COUNT }).map((_, index) => (
            <Skeleton key={index} className={styles.thumbnail} />
          ))}
        </div>

        <Skeleton className={styles.cardMeta} />
        <Skeleton className={styles.cardPrice} />
      </div>
    </div>
  );
}
