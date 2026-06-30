import { useState } from "react";

import ColorCard from "../../components/ColorCard/ColorCard";
import ColorPicker from "../../components/ColorPicker/ColorPicker";
import WizardLayout from "../../components/WizardLayout/WizardLayout";
import { useCreateStore } from "../../context/CreateStoreContext";

import styles from "./ColorsStep.module.scss";

const colorOptions = [
	{
		id: 1,
		primary: "#111827",
		secondary: "#DC2626",
	},
	{
		id: 2,
		primary: "#1D4ED8",
		secondary: "#FFFFFF",
	},
	{
		id: 3,
		primary: "#15803D",
		secondary: "#FACC15",
	},
	{
		id: 4,
		primary: "#7C3AED",
		secondary: "#FACC15",
	},
	{
		id: 5,
		primary: "#EA580C",
		secondary: "#111827",
	},
	{
		id: 6,
		primary: "#B91C1C",
		secondary: "#FFFFFF",
	},
];

export default function ColorsStep() {
	const [selectedColorId, setSelectedColorId] =
		useState(1);

	const {
		currentStep,
		setCurrentStep,
		primaryColor,
		secondaryColor,
		setPrimaryColor,
		setSecondaryColor,
	} = useCreateStore();

	function handlePresetSelect(
		id: number,
		primary: string,
		secondary: string,
	) {
		setSelectedColorId(id);
		setPrimaryColor(primary);
		setSecondaryColor(secondary);
	}

	return (
		<WizardLayout
			step={currentStep}
			title="Choose Your Team Colors"
			description="Choose one of our popular color combinations or customize your own. Your selected colors will be applied when your storefront preview is created."
			hideBack
			onNext={() => setCurrentStep(2)}
		>
			<div>
				<h2 className={styles.sectionTitle}>
					Popular Color Combinations
				</h2>

				<div className={styles.grid}>
					{colorOptions.map((option) => (
						<ColorCard
							key={option.id}
							primaryColor={option.primary}
							secondaryColor={option.secondary}
							selected={
								selectedColorId ===
								option.id
							}
							onClick={() =>
								handlePresetSelect(
									option.id,
									option.primary,
									option.secondary,
								)
							}
						/>
					))}
				</div>
			</div>

			<div className={styles.customColors}>
				<ColorPicker
					label="Primary Color"
					value={primaryColor}
					onChange={setPrimaryColor}
				/>

				<ColorPicker
					label="Secondary Color"
					value={secondaryColor}
					onChange={setSecondaryColor}
				/>
			</div>

			<div className={styles.info}>
				<h3>Customize your colors</h3>

				<p>
					Need an exact match for your
					organization? Use the color
					pickers above to choose any
					color or enter a custom hex
					value.
				</p>
			</div>
		</WizardLayout>
	);
}
