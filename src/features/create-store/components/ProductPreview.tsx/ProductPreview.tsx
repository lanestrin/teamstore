import Skeleton from "../../../../components/skeleton/Skeleton";
import styles from "./ProductPreview.module.scss";

interface ProductPreviewProps {
	title: string;
	brandColor: string;
	showStatus?: boolean;
}

export default function ProductPreview({
	title,
	brandColor,
	showStatus = false,
}: ProductPreviewProps) {
	return (
		<section className={styles.productSection}>
			<div className={styles.sectionHeader}>
				<h4>{title}</h4>

				<span
					className={styles.viewAll}
					style={{ color: brandColor }}
				>
					View All
				</span>
			</div>

			<div className={styles.products}>
				{Array.from({ length: 4 }).map((_, index) => (
					<article
						key={index}
						className={styles.productCard}
					>
						<Skeleton
							className={styles.productImage}
						/>

						<Skeleton
							className={
								styles.productTitleSkeleton
							}
						/>

						<Skeleton
							className={
								styles.productPriceSkeleton
							}
						/>

						{showStatus && (
							<Skeleton
								className={
									styles.productStatusSkeleton
								}
							/>
						)}
					</article>
				))}
			</div>
		</section>
	);
}
