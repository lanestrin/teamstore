import { useState } from "react";

import styles from "./ProductGallery.module.scss";
import { LuSearch } from "react-icons/lu";

interface ProductGalleryProps {
  name: string;
  images: string[];
}

export default function ProductGallery({
  name,
  images,
}: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] =
    useState(0);

  return (
    <div className={styles.gallery}>
      <div className={styles.thumbnails}>
        {images.map((image, index) => (
          <button
            key={index}
            type="button"
            className={
              selectedImage === index
                ? styles.activeThumb
                : ""
            }
            onClick={() =>
              setSelectedImage(index)
            }
          >
            <img
              src={image}
              alt={`${name} ${index + 1}`}
            />
          </button>
        ))}
      </div>

      <div className={styles.mainImage}>
        <img
          src={images[selectedImage]}
          alt={name}
        />

        <div className={styles.zoomHint}>
          <LuSearch />
          <span>Roll over image to zoom</span>
        </div>
      </div>
    </div>
  );
}
