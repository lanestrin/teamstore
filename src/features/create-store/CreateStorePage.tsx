import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

import { useCreateStore } from "./context/CreateStoreContext";
import type { CreateStoreOutletContext } from "./layouts/CreateStoreLayout";

import ColorsStep from "./steps/1_ColorStep/ColorsStep";
import ColorsStepSkeleton from "./steps/1_ColorStep/ColorsStepSkeleton";
import OrganizationStep from "./steps/2_OraganizationStep/OrganizationStep";
import SelectArtworkStep from "./steps/3_ArtworkStep/ArtworkStep";
import SelectProductStep from "./steps/4_ProductsStep/ProductsStep";
import ReviewStep from "./steps/5_ReviewStep/ReviewStep";

export default function CreateStorePage() {
  const [isLoading, setIsLoading] = useState(true);

  const { currentStep } = useCreateStore();

  const { isFinalizing, createStore } = useOutletContext<CreateStoreOutletContext>();

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
      return <ReviewStep isFinalizing={isFinalizing} onCreateStore={createStore} />;

    default:
      return <OrganizationStep />;
  }
}
