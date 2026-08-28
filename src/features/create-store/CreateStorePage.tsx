import { useEffect, useState } from "react";

import { useCreateStore } from "./context/CreateStoreContext";

import ColorsStep from "./steps/1_ColorStep/ColorsStep";
import ColorsStepSkeleton from "./steps/1_ColorStep/ColorsStepSkeleton";
import OrganizationStep from "./steps/2_OraganizationStep/OrganizationStep";
import SelectArtworkStep from "./steps/3_ArtworkStep/ArtworkStep";
import SelectProductStep from "./steps/4_ProductsStep/ProductsStep";
import WizardLayout from "./components/WizardLayout/WizardLayout";

export default function CreateStorePage() {
  const [isLoading, setIsLoading] = useState(true);
  const { currentStep, setCurrentStep } = useCreateStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <ColorsStepSkeleton />;
  }

  switch (currentStep) {
    case 1:
      return <OrganizationStep />;

    case 2:
      return <ColorsStep />;

    case 3:
      return <SelectArtworkStep />;

    case 4:
      return <SelectProductStep />;

    case 5:
      return (
        <WizardLayout
          step={5}
          title="Review Your Store"
          description="The full review experience is coming soon."
          onBack={() => setCurrentStep(4)}
          nextLabel="Coming Soon"
          nextDisabled
          width="wide"
        >
          <p>Your store setup is complete. Review and publishing controls will be added here next.</p>
        </WizardLayout>
      );

    default:
      return <OrganizationStep />;
  }
}
