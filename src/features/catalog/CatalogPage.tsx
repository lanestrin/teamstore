import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { LuChevronDown, LuSearch, LuX } from "react-icons/lu";

import { api } from "../../../convex/_generated/api";
import ProductCard from "../../components/product-card/ProductCard";
import styles from "./CatalogPage.module.scss";
import CatalogSkeleton from "./CatalogSkeleton";

type SortOption =
  | "featured"
  | "name-ascending"
  | "price-ascending"
  | "price-descending";

type FilterSection = "category" | "color" | "size";

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

function toggleFilterValue<T extends string>(
  currentValues: T[],
  value: T,
): T[] {
  if (currentValues.includes(value)) {
    return currentValues.filter((currentValue) => currentValue !== value);
  }

  return [...currentValues, value];
}

const COLOR_ORDER = [
  "black",
  "white",
  "gray",
  "silver",
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
  "brown",
  "multicolor",
];

const COLOR_LABELS: Record<string, string> = {
  black: "Black",
  white: "White",
  gray: "Gray",
  silver: "Silver",
  red: "Red",
  orange: "Orange",
  yellow: "Yellow",
  green: "Green",
  blue: "Blue",
  purple: "Purple",
  pink: "Pink",
  brown: "Brown",
  multicolor: "Multi",
};

const COLOR_SWATCHES: Record<string, string> = {
  black: "#17191c",
  white: "#ffffff",
  gray: "#7a7f85",
  silver: "#c7cbd0",
  red: "#c92a2a",
  orange: "#e56b1f",
  yellow: "#f2c94c",
  green: "#2f8f4e",
  blue: "#2457a7",
  purple: "#6f42a5",
  pink: "#dc6f9e",
  brown: "#7a5137",
  multicolor:
    "conic-gradient(#c92a2a 0 20%, #e56b1f 20% 40%, #f2c94c 40% 60%, #2f8f4e 60% 80%, #2457a7 80% 100%)",
};

const DARK_COLOR_FAMILIES = new Set([
  "black",
  "gray",
  "red",
  "green",
  "blue",
  "purple",
  "brown",
]);

function compareColorFamilies(
  firstColorFamily: string,
  secondColorFamily: string,
) {
  const firstIndex = COLOR_ORDER.indexOf(firstColorFamily);
  const secondIndex = COLOR_ORDER.indexOf(secondColorFamily);

  if (firstIndex !== -1 && secondIndex !== -1) {
    return firstIndex - secondIndex;
  }

  if (firstIndex !== -1) {
    return -1;
  }

  if (secondIndex !== -1) {
    return 1;
  }

  return firstColorFamily.localeCompare(secondColorFamily);
}

function formatColorFamily(colorFamily: string) {
  return (
    COLOR_LABELS[colorFamily] ??
    colorFamily.replace(
      /(^|-)([a-z])/g,
      (_, separator, character: string) =>
        `${separator === "-" ? " " : ""}${character.toUpperCase()}`,
    )
  );
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
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>("featured");
  const [openSections, setOpenSections] = useState<
    Record<FilterSection, boolean>
  >({
    category: false,
    color: true,
    size: false,
  });

  const categories = useMemo(() => {
    if (!products) {
      return [];
    }

    return [...new Set(products.map((product) => product.category))].sort(
      (firstCategory, secondCategory) =>
        firstCategory.localeCompare(secondCategory),
    );
  }, [products]);

  const colorFamilies = useMemo(() => {
    if (!products) {
      return [];
    }

    return [
      ...new Set(products.flatMap((product) => product.availableColorFamilies)),
    ]
      .filter((colorFamily) => colorFamily !== "unknown")
      .sort(compareColorFamilies);
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

      const matchesColor =
        selectedColor === null ||
        product.availableColorFamilies.some(
          (colorFamily) => colorFamily === selectedColor,
        );

      const productFilterSizes = getFilterSizes(product.availableSizes);

      const matchesSize =
        selectedSizes.length === 0 ||
        selectedSizes.some((size) => productFilterSizes.includes(size));

      return matchesSearch && matchesCategory && matchesColor && matchesSize;
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
  }, [
    products,
    searchTerm,
    selectedCategories,
    selectedColor,
    selectedSizes,
    sortOption,
  ]);

  if (products === undefined) {
    return <CatalogSkeleton />;
  }

  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    selectedCategories.length > 0 ||
    selectedColor !== null ||
    selectedSizes.length > 0;

  function clearFilters() {
    setSearchTerm("");
    setSelectedCategories([]);
    setSelectedColor(null);
    setSelectedSizes([]);
  }

  function toggleSection(section: FilterSection) {
    setOpenSections((currentSections) => ({
      ...currentSections,
      [section]: !currentSections[section],
    }));
  }

  function toggleColor(colorFamily: string) {
    setSelectedColor((currentColor) =>
      currentColor === colorFamily ? null : colorFamily,
    );
  }

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

        {hasActiveFilters && (
          <div className={styles.activeFilterBar} aria-label="Active filters">
            <span className={styles.activeFilterLabel}>Active filters</span>

            {searchTerm.trim() && (
              <button
                type="button"
                className={styles.filterChip}
                onClick={() => setSearchTerm("")}
                aria-label={`Remove search filter ${searchTerm.trim()}`}
              >
                Search: {searchTerm.trim()}
                <LuX aria-hidden="true" />
              </button>
            )}

            {selectedCategories.map((category) => (
              <button
                key={category}
                type="button"
                className={styles.filterChip}
                onClick={() =>
                  setSelectedCategories((currentCategories) =>
                    toggleFilterValue(currentCategories, category),
                  )
                }
                aria-label={`Remove category filter ${category}`}
              >
                {category}
                <LuX aria-hidden="true" />
              </button>
            ))}

            {selectedColor && (
              <button
                type="button"
                className={styles.filterChip}
                onClick={() => setSelectedColor(null)}
                aria-label={`Remove color filter ${formatColorFamily(
                  selectedColor,
                )}`}
              >
                {formatColorFamily(selectedColor)}
                <LuX aria-hidden="true" />
              </button>
            )}

            {selectedSizes.map((size) => (
              <button
                key={size}
                type="button"
                className={styles.filterChip}
                onClick={() =>
                  setSelectedSizes((currentSizes) =>
                    toggleFilterValue(currentSizes, size),
                  )
                }
                aria-label={`Remove size filter ${size}`}
              >
                {size}
                <LuX aria-hidden="true" />
              </button>
            ))}
          </div>
        )}

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

            <div className={styles.filterSections}>
              <section className={styles.filterSection}>
                <button
                  type="button"
                  className={styles.filterSectionButton}
                  onClick={() => toggleSection("category")}
                  aria-expanded={openSections.category}
                  aria-controls="catalog-category-filters"
                >
                  <span>Category</span>

                  <span className={styles.filterSectionMeta}>
                    {selectedCategories.length > 0
                      ? `${selectedCategories.length} selected`
                      : "Any"}

                    <LuChevronDown
                      className={`${styles.filterSectionIcon} ${
                        openSections.category
                          ? styles.filterSectionIconOpen
                          : ""
                      }`}
                      aria-hidden="true"
                    />
                  </span>
                </button>

                {openSections.category && (
                  <div
                    id="catalog-category-filters"
                    className={styles.filterSectionBody}
                  >
                    <div className={styles.categoryOptions}>
                      {categories.map((category) => (
                        <label key={category} className={styles.categoryOption}>
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
                  </div>
                )}
              </section>

              {colorFamilies.length > 0 && (
                <section className={styles.filterSection}>
                  <button
                    type="button"
                    className={styles.filterSectionButton}
                    onClick={() => toggleSection("color")}
                    aria-expanded={openSections.color}
                    aria-controls="catalog-color-filters"
                  >
                    <span>Color</span>

                    <span className={styles.filterSectionMeta}>
                      {selectedColor ? formatColorFamily(selectedColor) : "Any"}

                      <LuChevronDown
                        className={`${styles.filterSectionIcon} ${
                          openSections.color ? styles.filterSectionIconOpen : ""
                        }`}
                        aria-hidden="true"
                      />
                    </span>
                  </button>

                  {openSections.color && (
                    <div
                      id="catalog-color-filters"
                      className={styles.filterSectionBody}
                    >
                      <div
                        className={styles.colorGrid}
                        role="radiogroup"
                        aria-label="Filter by color"
                      >
                        {colorFamilies.map((colorFamily) => {
                          const isSelected = selectedColor === colorFamily;
                          const isDark = DARK_COLOR_FAMILIES.has(colorFamily);

                          return (
                            <button
                              key={colorFamily}
                              type="button"
                              className={`${styles.colorOption} ${
                                isSelected ? styles.colorOptionSelected : ""
                              }`}
                              onClick={() => toggleColor(colorFamily)}
                              role="radio"
                              aria-checked={isSelected}
                              aria-label={`${
                                isSelected ? "Remove" : "Filter by"
                              } ${formatColorFamily(colorFamily)}`}
                            >
                              <span
                                className={`${styles.colorSwatch} ${
                                  isSelected ? styles.colorSwatchSelected : ""
                                } ${
                                  isDark
                                    ? styles.colorSwatchDark
                                    : styles.colorSwatchLight
                                }`}
                                style={{
                                  background:
                                    COLOR_SWATCHES[colorFamily] ?? "#d7d9dc",
                                }}
                                aria-hidden="true"
                              />

                              <span>{formatColorFamily(colorFamily)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {sizes.length > 0 && (
                <section className={styles.filterSection}>
                  <button
                    type="button"
                    className={styles.filterSectionButton}
                    onClick={() => toggleSection("size")}
                    aria-expanded={openSections.size}
                    aria-controls="catalog-size-filters"
                  >
                    <span>Size</span>

                    <span className={styles.filterSectionMeta}>
                      {selectedSizes.length > 0
                        ? `${selectedSizes.length} selected`
                        : "Any"}

                      <LuChevronDown
                        className={`${styles.filterSectionIcon} ${
                          openSections.size ? styles.filterSectionIconOpen : ""
                        }`}
                        aria-hidden="true"
                      />
                    </span>
                  </button>

                  {openSections.size && (
                    <div
                      id="catalog-size-filters"
                      className={styles.filterSectionBody}
                    >
                      <div
                        className={styles.sizeGrid}
                        aria-label="Filter by size"
                      >
                        {sizes.map((size) => {
                          const isSelected = selectedSizes.includes(size);

                          return (
                            <button
                              key={size}
                              type="button"
                              className={`${styles.sizeOption} ${
                                isSelected ? styles.sizeOptionSelected : ""
                              }`}
                              onClick={() =>
                                setSelectedSizes((currentSizes) =>
                                  toggleFilterValue(currentSizes, size),
                                )
                              }
                              aria-pressed={isSelected}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>
          </aside>

          <section className={styles.results}>
            <div className={styles.resultsHeader}>
              <p>
                <strong>{filteredProducts.length}</strong>{" "}
                {filteredProducts.length === 1 ? "product" : "products"}
              </p>

              {hasActiveFilters && <span>Filtered from {products.length}</span>}
            </div>

            {filteredProducts.length === 0 && (
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

            {filteredProducts.length > 0 && (
              <div className={styles.productGrid}>
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    preferredColorFamily={selectedColor}
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
