import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LuChevronLeft } from "react-icons/lu";
import { requiredProducts, fanwearProducts } from "../../mocks/products";

import styles from "./ProductPage.module.scss";

import ProductGallery from "./components/ProductGallery/ProductGallery";
import ProductInfo from "./components/ProductInfo/ProductInfo";
import ProductDetails from "./components/ProductDetails/ProductDetails";

export default function ProductPage() {
  const { sku } = useParams();

  const product = [
    ...requiredProducts,
    ...fanwearProducts,
  ].find((p) => p.sku === sku);

  const [selectedSize, setSelectedSize] =
    useState("");

  const [quantity, setQuantity] =
    useState(1);

  if (!product) {
    return (
      <div className={styles.notFound}>
        Product not found
      </div>
    );
  }

  const images =
    product.images?.length
      ? product.images
      : [product.image];

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link
          to="/store/jaguars-soccer"
          className={styles.backLink}
        >
          <LuChevronLeft />
          Back to Jaguars Soccer
        </Link>

        <section
          className={styles.productSection}
        >
          <div
            className={styles.galleryColumn}
          >
            <ProductGallery
              name={product.name}
              images={images}
            />
          </div>

          <div
            className={styles.contentColumn}
          >
            <ProductInfo
              name={product.name}
              teamName="Jaguars Soccer"
              price={product.price}
              isRequired={
                product.isRequired
              }
              deadline={
                product.deadline
              }
              deliveryEstimate={
                product.deliveryEstimate
              }
              youthSizes={
                product.youthSizes
              }
              adultSizes={
                product.adultSizes
              }
              selectedSize={
                selectedSize
              }
              quantity={quantity}
              onSizeChange={
                setSelectedSize
              }
              onQuantityChange={
                setQuantity
              }
              allowNamePersonalization={
                product.allowNamePersonalization
              }
              allowNumberPersonalization={
                product.allowNumberPersonalization
              }
            />

            <ProductDetails
              description={
                product.description
              }
            />
          </div>
        </section>

      </div>
    </div>
  );
}
