import React from 'react';
import styles from './CheckoutSkeleton.module.scss';

export default function CheckoutSkeleton() {
	return (
		<div className={styles.layout}>
			<div className={styles.contentColumn}>
				<div className={styles.card}>
					<div className={styles.header}></div>
					<div className={styles.line}></div>
					<div className={styles.line}></div>
				</div>

				<div className={styles.card}>
					<div className={styles.header}></div>
					<div className={styles.line}></div>
					<div className={styles.line}></div>
					<div className={styles.lineShort}></div>
				</div>

				<div className={styles.card}>
					<div className={styles.header}></div>
					<div className={styles.line}></div>
					<div className={styles.line}></div>
					<div className={styles.line}></div>
				</div>
			</div>

			<div className={styles.summaryCard}>
				<div className={styles.header}></div>

				<div className={styles.product}></div>
				<div className={styles.product}></div>
				<div className={styles.product}></div>

				<div className={styles.divider}></div>

				<div className={styles.totalLine}></div>
				<div className={styles.totalLine}></div>
				<div className={styles.totalLineLarge}></div>

				<div className={styles.button}></div>
			</div>
		</div>
	);
}