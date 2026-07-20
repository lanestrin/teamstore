import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { LuSearch } from "react-icons/lu";

import { api } from "../../../convex/_generated/api";
import ProductCard from "../../components/product-card/ProductCard";
import styles from "./CatalogPage.module.scss";
import CatalogSkeleton from "./CatalogSkeleton";

type SortOption =
  | "featured"
  | "name-ascending"
  | "price-ascending"
  | "price-descending";

function formatPrice(
  minPriceInCents: number | null,
  maxPriceInCents: number | null,
) {
  if (minPriceInCents === null) {
    return "Unavailable";
  }

  const minimumPrice = (minPriceInCents / 100).toFixed(2);

  if (maxPriceInCents !== null && maxPriceInCents !== minPriceInCents) {
    return `From $${minimumPrice}`;
  }

  return `$${minimumPrice}`;
}

function toggleFilterValue(currentValues: string[], value: string): string[] {
  if (currentValues.includes(value)) {
    return currentValues.filter((currentValue) => currentValue !== value);
  }

  return [...currentValues, value];
}

const SIZE_ORDER = [
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "3XL",
  "4XL",
  "5XL",
  "6XL",
  "OS",
];

const SIZE_ALIASES: Record<string, string> = {
  XXL: "2XL",
  XXXL: "3XL",
  XXXXL: "4XL",
  XXXXXL: "5XL",
  OSFA: "OS",
  "ONE SIZE": "OS",
  "ONE SIZE FITS ALL": "OS",
};

function normalizeSize(size: string) {
  const normalizedSize = size.trim().toUpperCase();

  return SIZE_ALIASES[normalizedSize] ?? normalizedSize;
}

function expandSize(size: string) {
  return size.split("/").map(normalizeSize).filter(Boolean);
}

function getFilterSizes(sizes: string[]) {
  return [...new Set(sizes.flatMap(expandSize))];
}

function compareSizes(firstSize: string, secondSize: string) {
  const firstIndex = SIZE_ORDER.indexOf(firstSize);
  const secondIndex = SIZE_ORDER.indexOf(secondSize);

  if (firstIndex !== -1 && secondIndex !== -1) {
    return firstIndex - secondIndex;
  }

  if (firstIndex !== -1) {
    return -1;
  }

  if (secondIndex !== -1) {
    return 1;
  }

  return firstSize.localeCompare(secondSize, undefined, {
    numeric: true,
  });
}

export default function CatalogPage() {
  const products = useQuery(api.products.listActive, {});

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>("featured");

  const categories = useMemo(() => {
    if (!products) {
      return [];
    }

    return [...new Set(products.map((product) => product.category))].sort(
      (firstCategory, secondCategory) =>
        firstCategory.localeCompare(secondCategory),
    );
  }, [products]);

  const sizes = useMemo(() => {
    if (!products) {
      return [];
    }

    return getFilterSizes(
      products.flatMap((product) => product.availableSizes),
    ).sort(compareSizes);
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products) {
      return [];
    }

    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    const matchingProducts = products.filter((product) => {
      const matchesSearch =
        !normalizedSearchTerm ||
        product.name.toLowerCase().includes(normalizedSearchTerm) ||
        product.category.toLowerCase().includes(normalizedSearchTerm);

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(product.category);

      const productFilterSizes = getFilterSizes(product.availableSizes);

      const matchesSize =
        selectedSizes.length === 0 ||
        selectedSizes.some((size) => productFilterSizes.includes(size));

      return matchesSearch && matchesCategory && matchesSize;
    });

    if (sortOption === "featured") {
      return matchingProducts;
    }

    return [...matchingProducts].sort((firstProduct, secondProduct) => {
      if (sortOption === "name-ascending") {
        return firstProduct.name.localeCompare(secondProduct.name);
      }

      const firstPrice =
        firstProduct.minPriceInCents ?? Number.POSITIVE_INFINITY;

      const secondPrice =
        secondProduct.minPriceInCents ?? Number.POSITIVE_INFINITY;

      if (sortOption === "price-ascending") {
        return firstPrice - secondPrice;
      }

      return secondPrice - firstPrice;
    });
  }, [products, searchTerm, selectedCategories, selectedSizes, sortOption]);

  if (products === undefined) {
    return <CatalogSkeleton />;
  }

  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    selectedCategories.length > 0 ||
    selectedSizes.length > 0;

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategories([]);
    setSelectedSizes([]);
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.pageHeader}>
          <div>
            <span className={styles.eyebrow}>Blank apparel</span>
          </div>
        </header>

        <div className={styles.toolbar}>
          <label className={styles.searchField}>
            <span className={styles.visuallyHidden}>
              Search the product catalog
            </span>

            <LuSearch aria-hidden="true" />

            <input
              type="search"
              value={searchTerm}
              placeholder="Search products"
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>

          <div className={styles.sortField}>
            <label htmlFor="catalog-sort">Sort by</label>

            <select
              id="catalog-sort"
              value={sortOption}
              onChange={(event) =>
                setSortOption(event.target.value as SortOption)
              }
            >
              <option value="featured">Featured</option>
              <option value="name-ascending">Name: A–Z</option>
              <option value="price-ascending">Price: Low to high</option>
              <option value="price-descending">Price: High to low</option>
            </select>
          </div>
        </div>

        <div className={styles.catalogLayout}>
          <aside className={styles.filters}>
            <div className={styles.filterHeader}>
              <h2>Filters</h2>

              {hasActiveFilters && (
                <button type="button" onClick={clearFilters}>
                  Clear all
                </button>
              )}
            </div>

            <fieldset className={styles.filterGroup}>
              <legend>Category</legend>

              <div className={styles.filterOptions}>
                {categories.map((category) => (
                  <label key={category} className={styles.filterOption}>
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() =>
                        setSelectedCategories((currentCategories) =>
                          toggleFilterValue(currentCategories, category),
                        )
                      }
                    />

                    <span>{category}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {sizes.length > 0 && (
              <fieldset className={styles.filterGroup}>
                <legend>Size</legend>

                <div className={styles.filterOptions}>
                  {sizes.map((size) => (
                    <label key={size} className={styles.filterOption}>
                      <input
                        type="checkbox"
                        checked={selectedSizes.includes(size)}
                        onChange={() =>
                          setSelectedSizes((currentSizes) =>
                            toggleFilterValue(currentSizes, size),
                          )
                        }
                      />

                      <span>{size}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
          </aside>

          <section className={styles.results}>
            <div className={styles.resultsHeader}>
              <p>
                <strong>{filteredProducts.length}</strong>{" "}
                {filteredProducts.length === 1 ? "product" : "products"}
              </p>

              {hasActiveFilters && (
                <span>Filtered from {products?.length ?? 0}</span>
              )}
            </div>

            {products === undefined && (
              <div className={styles.statusMessage}>Loading catalog...</div>
            )}

            {products !== undefined && filteredProducts.length === 0 && (
              <div className={styles.emptyState}>
                <h2>No products found</h2>

                <p>
                  Try changing your search or removing one of the selected
                  filters.
                </p>

                {hasActiveFilters && (
                  <button type="button" onClick={clearFilters}>
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {products !== undefined && filteredProducts.length > 0 && (
              <div className={styles.productGrid}>
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={{
                      id: product._id,
                      name: product.name,
                      imageUrl:
                        product.colorOptions[0]?.imageUrl ??
                        product.imageUrls[0],
                      priceLabel: formatPrice(
                        product.minPriceInCents,
                        product.maxPriceInCents,
                      ),
                      productUrl: `/product/${product.slug}`,
                      colorOptions: product.colorOptions,
                      availableSizeCount: product.availableSizes.length,
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
