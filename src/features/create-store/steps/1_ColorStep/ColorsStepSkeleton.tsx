import Skeleton from "../../../../components/skeleton/Skeleton";
import styles from "./ColorsStepSkeleton.module.scss";

export default function ColorsStepSkeleton() {
  return (
    <section className={styles.page}>
      <Skeleton className={styles.step} />

      <div>
        <Skeleton className={styles.title} />

        <Skeleton className={styles.description} />

        <Skeleton className={styles.descriptionShort} />
      </div>

      <div>
        <Skeleton className={styles.heading} />

        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className={styles.colorCard} />
          ))}
        </div>
      </div>

      <div className={styles.customColors}>
        <Skeleton className={styles.colorPicker} />

        <Skeleton className={styles.colorPicker} />
      </div>

      <div className={styles.info}>
        <Skeleton className={styles.infoTitle} />

        <Skeleton className={styles.infoLine} />

        <Skeleton className={styles.infoLine} />

        <Skeleton className={styles.infoLineShort} />
      </div>

      <div className={styles.actions}>
        <Skeleton className={styles.button} />

        <Skeleton className={styles.button} />
      </div>
    </section>
  );
}
