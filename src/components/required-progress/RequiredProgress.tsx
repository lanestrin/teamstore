import styles from "./RequiredProgress.module.scss";

interface RequiredProgressProps {
  completed: number;
  total: number;
  items: {
    id: number;
    name: string;
    completed: boolean;
  }[];
}

export default function RequiredProgress({ completed, total, items }: RequiredProgressProps) {
  const progressPercent = Math.round((completed / total) * 100);

  return (
    <div className={styles.progressCard}>
      <div className={styles.progressHeader}>
        <h3>Required Items Progress</h3>

        <span>
          {completed} of {total} Items Added
        </span>
      </div>

      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{
            width: `${progressPercent}%`,
          }}
        />
      </div>

      <div className={styles.progressPercent}>{progressPercent}% Complete</div>

      <div className={styles.requiredChecklist}>
        {items.map((item) => (
          <div key={item.id} className={item.completed ? styles.checklistComplete : styles.checklistPending}>
            <span>{item.completed ? "✓" : "○"}</span>

            {item.name}
          </div>
        ))}
      </div>
    </div>
  );
}
