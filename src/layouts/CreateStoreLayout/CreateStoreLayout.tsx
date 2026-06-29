import { Outlet } from "react-router-dom";

import ProgressSidebar from "./ProgressSidebar/ProgressSidebar";
import LivePreview from "./ProgressSidebar/LivePreview";

import styles from "./CreateStoreLayout.module.scss";
import ResizablePanel from "./ResizablePanel/ResizablePanel";

export default function CreateStoreLayout() {
	return (
		<div className={styles.layout}>
			<aside className={styles.sidebar}>
				<ProgressSidebar currentStep={1} />
			</aside>

			<ResizablePanel
				className={styles.resizable}
				storageKey="teamstore-create-store-layout"
				defaultLeftPercent={50}
				minLeftPercent={35}
				maxLeftPercent={70}
				leftClassName={styles.content}
				rightClassName={styles.preview}
				left={
					<main className={styles.contentInner}>
						<Outlet />
					</main>
				}
				right={<LivePreview />}
			/>
		</div>
	);
}
