import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { LuSearch } from "react-icons/lu";

import { api } from "../../../convex/_generated/api";
import ProductCard from "../../components/product-card/ProductCard";
import styles from "./CatalogPage.module.scss";

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

export default function CatalogPage() {
  const products = useQuery(api.products.listActive, {});

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
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

  const brands = useMemo(() => {
    if (!products) {
      return [];
    }

    return [
      ...new Set(
        products.flatMap((product) => {
          const brand = product.brand?.trim();

          return brand ? [brand] : [];
        }),
      ),
    ].sort((firstBrand, secondBrand) => firstBrand.localeCompare(secondBrand));
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
        product.category.toLowerCase().includes(normalizedSearchTerm) ||
        product.brand?.toLowerCase().includes(normalizedSearchTerm) ||
        product.division?.toLowerCase().includes(normalizedSearchTerm);

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(product.category);

      const matchesBrand =
        selectedBrands.length === 0 ||
        (product.brand !== undefined && selectedBrands.includes(product.brand));

      return matchesSearch && matchesCategory && matchesBrand;
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
  }, [products, searchTerm, selectedCategories, selectedBrands, sortOption]);

  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    selectedCategories.length > 0 ||
    selectedBrands.length > 0;

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategories([]);
    setSelectedBrands([]);
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.pageHeader}>
          <div>
            <span className={styles.eyebrow}>Blank apparel</span>

            <h1>Catalog</h1>

            <p>
              Shop individual blank apparel, headwear, bags, and accessories.
              Select a product to choose its color, size, and quantity.
            </p>
          </div>

          <div className={styles.productTotal}>
            <strong>{products?.length ?? 0}</strong>
            <span>Products</span>
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

            {brands.length > 0 && (
              <fieldset className={styles.filterGroup}>
                <legend>Brand</legend>

                <div className={styles.filterOptions}>
                  {brands.map((brand) => (
                    <label key={brand} className={styles.filterOption}>
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand)}
                        onChange={() =>
                          setSelectedBrands((currentBrands) =>
                            toggleFilterValue(currentBrands, brand),
                          )
                        }
                      />

                      <span>{brand}</span>
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
                      imageUrl: product.imageUrls[0],
                      priceLabel: formatPrice(
                        product.minPriceInCents,
                        product.maxPriceInCents,
                      ),
                      productUrl: `/product/${product.slug}`,
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
