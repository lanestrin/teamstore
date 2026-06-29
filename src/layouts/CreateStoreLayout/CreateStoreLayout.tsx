import { Outlet } from "react-router-dom";

import ProgressSidebar from "../../features/create-store/components/ProgressSidebar/ProgressSidebar";
import ResizablePanel from "../../features/create-store/components/ResizablePanel/ResizablePanel";
import styles from "./CreateStoreLayout.module.scss";
import LivePreview from "../../features/create-store/components/LivePreview/LivePreview";

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
