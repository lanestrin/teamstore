import { LuCheck } from "react-icons/lu";

import styles from "./ColorCard.module.scss";

interface ColorCardProps {
  name?: string;
  primaryColor: string;
  secondaryColor: string;
  selected?: boolean;
  onClick?: () => void;
}

export default function ColorCard({ name, primaryColor, secondaryColor, selected = false, onClick }: ColorCardProps) {
  const accessibleName = name ?? `Color combination ${primaryColor} and ${secondaryColor}`;

  return (
    <button
      type="button"
      className={`${styles.card} ${selected ? styles.selected : ""}`}
      aria-label={accessibleName}
      aria-pressed={selected}
      onClick={onClick}
    >
      <span className={styles.colors} aria-hidden="true">
        <span
          className={styles.primary}
          style={{
            backgroundColor: primaryColor,
          }}
        />

        <span
          className={styles.secondary}
          style={{
            backgroundColor: secondaryColor,
          }}
        />
      </span>

      {name && <span className={styles.name}>{name}</span>}

      {selected && (
        <span className={styles.check} aria-hidden="true">
          <LuCheck />
        </span>
      )}
    </button>
  );
}
