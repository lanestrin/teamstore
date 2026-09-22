import type { KeyboardEvent } from "react";
import type { IconType } from "react-icons";
import { LuArrowRight } from "react-icons/lu";

import styles from "./ActionCard.module.scss";

interface ActionCardProps {
  icon: IconType;
  title: string;
  description: string;
  actionText: string;
  onClick?: () => void;
  featured?: boolean;
}

export default function ActionCard({ icon: Icon, title, description, actionText, onClick, featured = false }: ActionCardProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick?.();
    }
  }

  return (
    <div
      className={`${styles.card} ${featured ? styles.featured : ""}`}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.icon}>
        <Icon />
      </div>

      <div className={styles.content}>
        <h3>{title}</h3>

        <p>{description}</p>

        <div className={styles.action}>
          <span>{actionText}</span>

          <LuArrowRight />
        </div>
      </div>
    </div>
  );
}
