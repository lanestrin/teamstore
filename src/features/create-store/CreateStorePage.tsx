import { useEffect, useState } from "react";

import { useCreateStore } from "./context/CreateStoreContext";

import ColorsStep from "./feature/1_ColorStep/ColorsStep";
import ColorsStepSkeleton from "./feature/1_ColorStep/ColorsStepSkeleton";
import OrganizationStep from "./feature/2_OraganizationStep/OrganizationStep";
import SelectArtworkStep from "./feature/3_ArtworkStep/ArtworkStep";
import SelectProductStep from "./feature/4_ProductsStep/ProductsStep";

export default function CreateStorePage() {
  const [isLoading, setIsLoading] = useState(true);

  const { currentStep } = useCreateStore();

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
      return <ColorsStep />;

    case 2:
      return <OrganizationStep />;

    case 3:
      return <SelectArtworkStep />;

    case 4:
      return <SelectProductStep />;

    default:
      return <ColorsStep />;
  }
}
