import { useEffect, useState } from "react";

import { useCreateStore } from "./context/CreateStoreContext";

import ColorsStep from "./steps/2_ColorStep/ColorsStep";
import ColorsStepSkeleton from "./steps/2_ColorStep/ColorsStepSkeleton";
import OrganizationStep from "./steps/1_OraganizationStep/OrganizationStep";
import SelectArtworkStep from "./steps/3_ArtworkStep/ArtworkStep";
import SelectProductStep from "./steps/4_ProductsStep/ProductsStep";
import ReviewStep from "./steps/5_ReviewStep/ReviewStep";

interface CreateStorePageProps {
  isFinalizing: boolean;
  onCreateStore: () => Promise<void>;
  onDraftIdChange: (draftId: string) => void;
}

export default function CreateStorePage({ isFinalizing, onCreateStore, onDraftIdChange }: CreateStorePageProps) {
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
      return <OrganizationStep onDraftIdChange={onDraftIdChange} />;

    case 2:
      return <ColorsStep />;

    case 3:
      return <SelectArtworkStep />;

    case 4:
      return <SelectProductStep />;

    case 5:
      return <ReviewStep isFinalizing={isFinalizing} onCreateStore={onCreateStore} />;

    default:
      return <OrganizationStep onDraftIdChange={onDraftIdChange} />;
  }
}
