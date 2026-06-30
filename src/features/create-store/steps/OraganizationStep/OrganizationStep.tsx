import WizardLayout from "../../components/WizardLayout/WizardLayout";
import { useCreateStore } from "../../context/CreateStoreContext";

import formStyles from "../../../../styles/Forms.module.scss";
import styles from "./OrganizationStep.module.scss";

export default function OrganizationStep() {
	const { currentStep, setCurrentStep } = useCreateStore();

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
					/>

					<p className={styles.helper}>
						This is the name displayed on your storefront.
					</p>
				</div>

				<div className={formStyles.field}>
					<label>Store Address</label>

					<div className={styles.slug}>
						<span>teamstore.com/store/</span>
						<strong>your-store-name</strong>
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

					<div className={styles.upload}>
						<div className={styles.uploadIcon}>
							↑
						</div>

						<h3>Upload your logo</h3>

						<p>PNG, JPG or SVG (max 5 MB)</p>

						<input
							id="logo"
							type="file"
							accept=".png,.jpg,.jpeg,.svg"
						/>
					</div>
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
					/>

					<p className={styles.helper}>
						This description appears on your store homepage.
					</p>
				</div>
			</div>
		</WizardLayout>
	);
}
