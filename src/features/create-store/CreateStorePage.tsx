import { useEffect, useState } from "react";

import { useCreateStore } from "./context/CreateStoreContext";

import ColorsStep from "./steps/ColorStep/ColorsStep";
import ColorsStepSkeleton from "./steps/ColorStep/ColorsStepSkeleton";
import OrganizationStep from "./steps/OraganizationStep/OrganizationStep";
import ProductStep from "./steps/ProductStep/ProductStep";

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
      return <ProductStep />;

    default:
      return <ColorsStep />;
  }
}
