import {
  LuCalendar,
  LuMinus,
  LuPackage,
  LuPlus,
  LuRuler,
  LuTriangleAlert,
} from "react-icons/lu";

import styles from "./ProductInfo.module.scss";

interface ProductInfoProps {
  name: string;
  teamName: string;
  price: number;
  isRequired?: boolean;
  deadline?: string;
  deliveryEstimate?: string;
  youthSizes?: string[];
  adultSizes?: string[];
  selectedSize: string;
  quantity: number;
  onSizeChange: (size: string) => void;
  onQuantityChange: (quantity: number) => void;
  allowNamePersonalization?: boolean;
  allowNumberPersonalization?: boolean;
}

export default function ProductInfo({
  name,
  teamName,
  price,
  isRequired,
  deadline,
  deliveryEstimate,
  youthSizes = [],
  adultSizes = [],
  selectedSize,
  quantity,
  onSizeChange,
  onQuantityChange,
  allowNamePersonalization,
  allowNumberPersonalization,
}: ProductInfoProps) {
  return (
    <div className={styles.info}>
      {isRequired && (
        <div className={styles.requiredBadge}>
          REQUIRED TEAM ITEM
        </div>
      )}

      <h1>{name}</h1>

      <div className={styles.teamName}>
        {teamName}
      </div>

      <div className={styles.price}>
        ${price.toFixed(2)}
      </div>

      {deadline && (
        <div className={styles.alertCard}>
          <div className={styles.iconWarning}>
            <LuTriangleAlert />
          </div>

          <div>
            <div className={styles.cardTitle}>
              REQUIRED FOR ALL PLAYERS
            </div>

            <div className={styles.cardText}>
              This item must be purchased
              before the order deadline.
            </div>

            <div className={styles.highlight}>
              Order by{" "}
              {new Date(
                deadline
              ).toLocaleDateString()}
            </div>
          </div>
        </div>
      )}

      {deliveryEstimate && (
        <div className={styles.deliveryCard}>
          <div className={styles.iconDelivery}>
            <LuPackage />
          </div>

          <div>
            <div className={styles.cardTitle}>
              EXPECTED DELIVERY
            </div>

            <div className={styles.deliveryDate}>
              {deliveryEstimate}
            </div>

            <div className={styles.cardText}>
              Orders will be delivered
              to the team.
            </div>
          </div>
        </div>
      )}

      <div className={styles.sectionLabel}>
        SELECT SIZE
      </div>

      {youthSizes.length > 0 && (
        <>
          <div className={styles.groupLabel}>
            Youth Sizes
          </div>

          <div className={styles.sizeGrid}>
            {youthSizes.map((size) => (
              <button
                key={size}
                type="button"
                className={
                  selectedSize === size
                    ? styles.activeSize
                    : ""
                }
                onClick={() =>
                  onSizeChange(size)
                }
              >
                <span>{size}</span>

                <small>In Stock</small>
              </button>
            ))}
          </div>
        </>
      )}

      {adultSizes.length > 0 && (
        <>
          <div className={styles.groupLabel}>
            Adult Sizes
          </div>

          <div className={styles.sizeGrid}>
            {adultSizes.map((size) => (
              <button
                key={size}
                type="button"
                className={
                  selectedSize === size
                    ? styles.activeSize
                    : ""
                }
                onClick={() =>
                  onSizeChange(size)
                }
              >
                <span>{size}</span>

                <small>In Stock</small>
              </button>
            ))}
          </div>
        </>
      )}

      <button
        type="button"
        className={styles.sizeChart}
      >
        <LuRuler />
        Size Chart
      </button>

      {(allowNamePersonalization ||
        allowNumberPersonalization) && (
          <div
            className={styles.personalization}
          >
            <div
              className={styles.sectionLabel}
            >
              PERSONALIZATION
            </div>

            {allowNamePersonalization && (
              <div
                className={
                  styles.personalizationField
                }
              >
                <label>
                  Player Name
                </label>

                <input
                  type="text"
                  placeholder="Enter player name"
                  maxLength={18}
                />
              </div>
            )}

            {allowNumberPersonalization && (
              <div
                className={
                  styles.personalizationField
                }
              >
                <label>
                  Player Number
                </label>

              <input
                type="text"
                inputMode="numeric"
                maxLength={2}
                placeholder="00"
              />
              </div>
            )}

            <div
              className={
                styles.personalizationNote
              }
            >
              Personalized items are custom
              produced and cannot be returned.
            </div>
          </div>
        )}

      <div className={styles.quantitySection}>
        <label>Quantity</label>

        <div
          className={styles.quantityControls}
        >
          <button
            type="button"
            onClick={() =>
              onQuantityChange(
                Math.max(
                  1,
                  quantity - 1
                )
              )
            }
          >
            <LuMinus />
          </button>

          <span>{quantity}</span>

          <button
            type="button"
            onClick={() =>
              onQuantityChange(
                quantity + 1
              )
            }
          >
            <LuPlus />
          </button>
        </div>
      </div>

      <button
        className={styles.addToCart}
        disabled={!selectedSize}
      >
        {selectedSize
          ? "ADD TO CART"
          : "SELECT SIZE"}
      </button>

      <div className={styles.cartNote}>
        <LuCalendar />

        <span>
          Added items remain in your
          cart for up to 30 days.
        </span>
      </div>
    </div>
  );
}
