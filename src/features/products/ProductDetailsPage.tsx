import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { LuChevronLeft } from "react-icons/lu";
import { Link, useParams } from "react-router-dom";

import { api } from "../../../convex/_generated/api";
import { useCart } from "../cart/CartContext";
import ProductDetails from "./components/ProductDetails/ProductDetails";
import ProductGallery from "./components/ProductGallery/ProductGallery";
import ProductInfo from "./components/ProductInfo/ProductInfo";
import styles from "./ProductDetailsPage.module.scss";

function formatPrice(minPriceInCents: number | null, maxPriceInCents: number | null) {
  if (minPriceInCents === null) {
    return "Unavailable";
  }

  const minimumPrice = (minPriceInCents / 100).toFixed(2);

  if (maxPriceInCents !== null && maxPriceInCents !== minPriceInCents) {
    return `From $${minimumPrice}`;
  }

  return `$${minimumPrice}`;
}

export default function ProductDetailsPage() {
  const { slug } = useParams<{
    slug: string;
  }>();

  const { addItem } = useCart();

  const product = useQuery(api.products.getActiveBySlug, slug ? { slug } : "skip");

  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isAddedToCart, setIsAddedToCart] = useState(false);

  const confirmationTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (confirmationTimeoutRef.current !== undefined) {
        window.clearTimeout(confirmationTimeoutRef.current);
      }
    };
  }, []);

  if (!slug) {
    return <div className={styles.notFound}>Product not found</div>;
  }

  if (product === undefined) {
    return <div className={styles.notFound}>Loading product...</div>;
  }

  if (product === null) {
    return <div className={styles.notFound}>Product not found</div>;
  }

  const selectedColorOption = product.colors.find((option) => option.color === selectedColor) ?? product.colors[0];

  if (!selectedColorOption) {
    return <div className={styles.notFound}>Product options are unavailable</div>;
  }

  const selectedVariant = selectedColorOption.variants.find((variant) => variant.size === selectedSize);

  const priceLabel = selectedVariant
    ? formatPrice(selectedVariant.directPriceInCents, selectedVariant.directPriceInCents)
    : formatPrice(selectedColorOption.minPriceInCents, selectedColorOption.maxPriceInCents);

  const colorOptions = product.colors.flatMap((option) => {
    const thumbnail = option.images.find((image) => image.view === "front") ?? option.images[0];

    if (!thumbnail) {
      return [];
    }

    return [
      {
        name: option.color,
        imageUrl: thumbnail.url,
      },
    ];
  });

  const clearAddedConfirmation = () => {
    setIsAddedToCart(false);

    if (confirmationTimeoutRef.current !== undefined) {
      window.clearTimeout(confirmationTimeoutRef.current);
      confirmationTimeoutRef.current = undefined;
    }
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    setSelectedSize("");
    clearAddedConfirmation();
  };

  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    clearAddedConfirmation();
  };

  const handleAddToCart = () => {
    if (!selectedVariant) {
      return;
    }

    const productImage = selectedColorOption.images.find((image) => image.view === "front") ?? selectedColorOption.images[0];

    if (!productImage) {
      return;
    }

    addItem({
      productId: product._id,
      variantId: selectedVariant._id,
      slug: product.slug,
      name: product.name,
      imageUrl: productImage.url,
      color: selectedColorOption.color,
      size: selectedVariant.size,
      unitPriceInCents: selectedVariant.directPriceInCents,
      quantity,
    });

    setQuantity(1);
    setIsAddedToCart(true);

    if (confirmationTimeoutRef.current !== undefined) {
      window.clearTimeout(confirmationTimeoutRef.current);
    }

    confirmationTimeoutRef.current = window.setTimeout(() => {
      setIsAddedToCart(false);
      confirmationTimeoutRef.current = undefined;
    }, 3000);
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link to="/products" className={styles.backLink}>
          <LuChevronLeft />
          Back to Products
        </Link>

        <section className={styles.productSection}>
          <div className={styles.galleryColumn}>
            <ProductGallery
              key={selectedColorOption.color}
              name={product.name}
              color={selectedColorOption.color}
              images={selectedColorOption.images}
            />
          </div>

          <div className={styles.contentColumn}>
            <ProductInfo
              name={product.name}
              category={product.category}
              priceLabel={priceLabel}
              colors={colorOptions}
              selectedColor={selectedColorOption.color}
              onColorChange={handleColorChange}
              sizes={selectedColorOption.sizes}
              selectedSize={selectedSize}
              quantity={quantity}
              isAddedToCart={isAddedToCart}
              onSizeChange={handleSizeChange}
              onQuantityChange={setQuantity}
              onAddToCart={handleAddToCart}
            />

            <ProductDetails description={product.description} />
          </div>
        </section>
      </div>
    </div>
  );
}
