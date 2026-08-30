import ColorCard from "../../components/ColorCard/ColorCard";
import ColorPicker from "../../components/ColorPicker/ColorPicker";
import WizardLayout from "../../layouts/WizardLayout";
import { useCreateStore } from "../../context/CreateStoreContext";

import styles from "./ColorsStep.module.scss";
import ColorThemePreview from "./components/ColorThemePreview/ColorThemePreview";

const COLOR_PRESETS = [
  {
    id: "navy-red",
    name: "Navy + Red",
    primary: "#111827",
    secondary: "#DC2626",
  },
  {
    id: "royal-white",
    name: "Royal + White",
    primary: "#1D4ED8",
    secondary: "#FFFFFF",
  },
  {
    id: "green-gold",
    name: "Green + Gold",
    primary: "#15803D",
    secondary: "#FACC15",
  },
  {
    id: "purple-gold",
    name: "Purple + Gold",
    primary: "#7C3AED",
    secondary: "#FACC15",
  },
  {
    id: "orange-navy",
    name: "Orange + Navy",
    primary: "#EA580C",
    secondary: "#111827",
  },
  {
    id: "maroon-gold",
    name: "Maroon + Gold",
    primary: "#7F1D1D",
    secondary: "#FACC15",
  },
] as const;

export default function ColorsStep() {
  const { currentStep, setCurrentStep, primaryColor, secondaryColor, setPrimaryColor, setSecondaryColor, resetProductStep } =
    useCreateStore();

  const selectedPresetId = COLOR_PRESETS.find((preset) => preset.primary === primaryColor && preset.secondary === secondaryColor)?.id;

  function handlePresetSelect(primary: string, secondary: string) {
    if (primary === primaryColor && secondary === secondaryColor) {
      return;
    }

    resetProductStep();
    setPrimaryColor(primary);
    setSecondaryColor(secondary);
  }

  function handlePrimaryColorChange(nextPrimaryColor: string) {
    if (nextPrimaryColor === primaryColor) {
      return;
    }

    resetProductStep();
    setPrimaryColor(nextPrimaryColor);
  }

  function handleSecondaryColorChange(nextSecondaryColor: string) {
    if (nextSecondaryColor === secondaryColor) {
      return;
    }

    resetProductStep();
    setSecondaryColor(nextSecondaryColor);
  }

  return (
    <WizardLayout
      step={currentStep}
      title="Choose Your Team Colors"
      description="Start with a popular team color combination or customize your own."
      onBack={() => setCurrentStep(1)}
      onNext={() => setCurrentStep(3)}
      width="wide"
    >
      <div className={styles.colorSetup}>
        <section className={styles.controls} aria-labelledby="popular-colors-heading">
          <div className={styles.presets}>
            <h2 id="popular-colors-heading" className={styles.sectionTitle}>
              Popular Team Color Combinations
            </h2>

            <div className={styles.grid}>
              {COLOR_PRESETS.map((preset) => (
                <ColorCard
                  key={preset.id}
                  name={preset.name}
                  primaryColor={preset.primary}
                  secondaryColor={preset.secondary}
                  selected={selectedPresetId === preset.id}
                  onClick={() => handlePresetSelect(preset.primary, preset.secondary)}
                />
              ))}
            </div>
          </div>

          <div className={styles.customColors}>
            <ColorPicker label="Primary Color" value={primaryColor} onChange={handlePrimaryColorChange} />

            <ColorPicker label="Secondary Color" value={secondaryColor} onChange={handleSecondaryColorChange} />
          </div>

          <p className={styles.helper}>Choose a preset or use the color controls to match your organization’s exact colors.</p>
        </section>
        <ColorThemePreview primaryColor={primaryColor} secondaryColor={secondaryColor} />
      </div>
    </WizardLayout>
  );
}
