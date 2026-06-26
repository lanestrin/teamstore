import { useState } from "react";
import { LuChevronDown } from "react-icons/lu";

import styles from "./ProductDetails.module.scss";

interface ProductDetailsProps {
  description?: string;
  deadline?: string;
}

export default function ProductDetails({
  description,
}: ProductDetailsProps) {
  const [openSections, setOpenSections] =
    useState<string[]>([
      "details",
    ]);

  const toggleSection = (
    section: string
  ) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter(
          (item) => item !== section
        )
        : [...prev, section]
    );
  };

  const isOpen = (
    section: string
  ) => openSections.includes(section);

  return (
    <section className={styles.details}>
      <div className={styles.accordionGroup}>
        <div className={styles.accordion}>
          <button
            type="button"
            className={styles.accordionHeader}
            onClick={() =>
              toggleSection("details")
            }
          >
            <span>
              Product Details
            </span>

            <LuChevronDown
              className={
                isOpen("details")
                  ? styles.rotate
                  : ""
              }
            />
          </button>

          {isOpen("details") && (
            <div
              className={
                styles.accordionContent
              }
            >
              <p>
                {description ||
                  "Official team apparel produced for your organization."}
              </p>

              <ul>
                <li>
                  Official team-approved
                  apparel
                </li>

                <li>
                  Premium quality garment
                </li>

                <li>
                  Decorated with approved
                  team artwork
                </li>

                <li>
                  Available in youth and
                  adult sizes
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className={styles.accordion}>
          <button
            type="button"
            className={styles.accordionHeader}
            onClick={() =>
              toggleSection("sizing")
            }
          >
            <span>
              Sizing Information
            </span>

            <LuChevronDown
              className={
                isOpen("sizing")
                  ? styles.rotate
                  : ""
              }
            />
          </button>

          {isOpen("sizing") && (
            <div
              className={
                styles.accordionContent
              }
            >
              <p>
                Please review the size
                chart before placing your
                order. Team store items
                are produced specifically
                for your order and cannot
                be exchanged due to
                incorrect sizing
                selections.
              </p>

              <ul>
                <li>
                  Youth and Adult sizing
                  available
                </li>

                <li>
                  Refer to garment-specific
                  measurements
                </li>

                <li>
                  When in doubt, size up
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className={styles.accordion}>
          <button
            type="button"
            className={styles.accordionHeader}
            onClick={() =>
              toggleSection(
                "decoration"
              )
            }
          >
            <span>
              Decoration
            </span>

            <LuChevronDown
              className={
                isOpen(
                  "decoration"
                )
                  ? styles.rotate
                  : ""
              }
            />
          </button>

          {isOpen("decoration") && (
            <div
              className={
                styles.accordionContent
              }
            >
              <p>
                All artwork, colors, and
                placement have been
                approved by your
                organization.
              </p>

              <ul>
                <li>
                  Official team branding
                </li>

                <li>
                  Professional decoration
                </li>

                <li>
                  Colors matched to team
                  standards
                </li>

                <li>
                  Decoration methods may
                  vary by garment
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className={styles.accordion}>
          <button
            type="button"
            className={styles.accordionHeader}
            onClick={() =>
              toggleSection("returns")
            }
          >
            <span>
              Returns & Exchanges
            </span>

            <LuChevronDown
              className={
                isOpen("returns")
                  ? styles.rotate
                  : ""
              }
            />
          </button>

          {isOpen("returns") && (
            <div
              className={
                styles.accordionContent
              }
            >
              <p>
                Team store products are
                custom produced and
                decorated specifically for
                your organization.
              </p>

              <ul>
                <li>
                  All sales are final
                </li>

                <li>
                  No returns on decorated
                  garments
                </li>

                <li>
                  No exchanges for
                  incorrect size
                  selections
                </li>

                <li>
                  Contact support for
                  damaged products
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
