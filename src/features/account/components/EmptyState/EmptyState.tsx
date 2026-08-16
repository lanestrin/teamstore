import type { IconType } from "react-icons";

import styles from "./EmptyState.module.scss";

interface EmptyStateProps {
  icon: IconType;
  title: string;
  description: string;
  actionText?: string;
  onActionClick?: () => void;
}

export default function EmptyState({ icon: Icon, title, description, actionText, onActionClick }: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.icon}>
        <Icon />
      </div>

      <div className={styles.content}>
        <h3>{title}</h3>

        <p>{description}</p>
      </div>

      {actionText && onActionClick && (
        <button type="button" className={styles.action} onClick={onActionClick}>
          {actionText}
        </button>
      )}
    </div>
  );
}
