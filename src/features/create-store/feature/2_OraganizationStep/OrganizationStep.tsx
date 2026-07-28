import {
	LuCheck,
	LuTrash2,
	LuUpload,
} from "react-icons/lu";

import WizardLayout from "../../components/WizardLayout/WizardLayout";
import { useCreateStore } from "../../context/CreateStoreContext";

import formStyles from "../../../../styles/Forms.module.scss";
import styles from "./OrganizationStep.module.scss";

function slugify(value: string): string {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export default function OrganizationStep() {
	const {
		currentStep,
		setCurrentStep,
		storeDraft,
		updateStoreDraft,
	} = useCreateStore();

	function handleStoreNameChange(value: string) {
		updateStoreDraft({
			storeName: value,
			storeSlug: slugify(value),
		});
	}

	const logoExtension = storeDraft.logoFile
		? storeDraft.logoFile.name
			.split(".")
			.pop()
			?.toUpperCase()
		: null;

	const logoSize = storeDraft.logoFile
		? `${Math.round(storeDraft.logoFile.size / 1024)} KB`
		: null;

	return (
		<WizardLayout
			step={currentStep}
			title="Tell us about your organization"
			description="This information will help us create your store and customize your experience."
			onBack={() => setCurrentStep(1)}
			onNext={() => setCurrentStep(3)}
		>
			<div className={styles.form}>
				<div className={formStyles.field}>
					<label htmlFor="organizationName">
						Organization Name
						<span className={styles.required}>*</span>
					</label>

					<input
						id="organizationName"
						type="text"
						placeholder="e.g. Springfield Soccer Club"
						value={storeDraft.organizationName}
						onChange={(e) =>
							updateStoreDraft({
								organizationName: e.target.value,
							})
						}
					/>

					<p className={styles.helper}>
						This is the name of your organization or club.
					</p>
				</div>

				<div className={formStyles.field}>
					<label htmlFor="storeName">
						Store Name
						<span className={styles.required}>*</span>
					</label>

					<input
						id="storeName"
						type="text"
						placeholder="e.g. 2026 Spring Store"
						value={storeDraft.storeName}
						onChange={(e) =>
							handleStoreNameChange(e.target.value)
						}
					/>

					<p className={styles.helper}>
						This is the name displayed on your storefront.
					</p>
				</div>

				<div className={formStyles.field}>
					<label>Store Address</label>

					<div className={styles.slug}>
						<span>teamstore.com/store/</span>

						<strong>
							{storeDraft.storeSlug || "your-store-name"}
						</strong>
					</div>

					<p className={styles.helper}>
						Your store address is generated automatically from the
						store name.
					</p>
				</div>

				<div className={formStyles.field}>
					<label htmlFor="logo">
						Organization Logo
					</label>

					<label
						htmlFor="logo"
						className={styles.upload}
					>
						<div className={styles.uploadIcon}>
							{storeDraft.logoFile ? (
								<LuCheck />
							) : (
								<LuUpload />
							)}
						</div>

						<h3>
							{storeDraft.logoFile
								? storeDraft.logoFile.name
								: "Upload your logo"}
						</h3>

						<p>
							{storeDraft.logoFile
								? `${logoExtension} • ${logoSize}`
								: "PNG, JPG or SVG (max 5 MB)"}
						</p>

						<input
							id="logo"
							type="file"
							accept=".png,.jpg,.jpeg,.svg"
							className={styles.fileInput}
							onChange={(e) =>
								updateStoreDraft({
									logoFile:
										e.target.files?.[0] ?? null,
								})
							}
						/>

						{storeDraft.logoFile && (
							<div className={styles.actions}>
								<span
									className={styles.replaceLogo}
								>
									<LuUpload />
									Replace Logo
								</span>

								<button
									type="button"
									className={styles.removeLogo}
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();

										updateStoreDraft({
											logoFile: null,
										});
									}}
								>
									<LuTrash2 />
									Remove Logo
								</button>
							</div>
						)}
					</label>
				</div>

				<div className={formStyles.field}>
					<label htmlFor="description">
						Store Description

						<span className={styles.optional}>
							(Optional)
						</span>
					</label>

					<textarea
						id="description"
						rows={5}
						placeholder="Tell customers about your organization, season, or what makes your store unique."
						value={storeDraft.storeDescription}
						onChange={(e) =>
							updateStoreDraft({
								storeDescription:
									e.target.value,
							})
						}
					/>

					<p className={styles.helper}>
						This description appears on your store homepage.
					</p>
				</div>
			</div>
		</WizardLayout>
	);
}
