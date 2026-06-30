import { Outlet } from "react-router-dom";
import styles from "./CreateStoreLayout.module.scss";
import { useCreateStore, CreateStoreProvider } from "../context/CreateStoreContext";
import LivePreview from "../components/LivePreview/LivePreview";
import ProgressSidebar from "../components/ProgressSidebar/ProgressSidebar";
import ResizablePanel from "../components/ResizablePanel/ResizablePanel";


function CreateStoreContent() {
	const { currentStep } = useCreateStore();

	return (
		<div className={styles.layout}>
			<aside className={styles.sidebar}>
				<ProgressSidebar currentStep={currentStep} />
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

export default function CreateStoreLayout() {
	return (
		<CreateStoreProvider>
			<CreateStoreContent />
		</CreateStoreProvider>
	);
}
