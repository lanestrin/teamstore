import { useCallback, useMemo } from "react";
import { useConvex } from "convex/react";
import { useNavigate, useSearchParams } from "react-router-dom";

import CreateStoreLayout from "../../../packages/store-builder/layouts/CreateStoreLayout";
import type { FinalizeStoreResult } from "../../../packages/store-builder/types/backend";
import { images } from "../../assets/images";
import { createTeamStoreStoreBuilderAdapter } from "./teamStoreStoreBuilderAdapter";

export default function TeamStoreCreateStoreLayout() {
  const convex = useConvex();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const adapter = useMemo(() => createTeamStoreStoreBuilderAdapter(convex), [convex]);

  const draftId = searchParams.get("draftId");

  const handleDraftIdChange = useCallback(
    (nextDraftId: string) => {
      navigate(
        {
          pathname: "/create-store",
          search: `?draftId=${encodeURIComponent(nextDraftId)}`,
        },
        {
          replace: true,
        },
      );
    },
    [navigate],
  );

  const handleExit = useCallback(() => {
    navigate("/account");
  }, [navigate]);

  const handleComplete = useCallback(
    (result: FinalizeStoreResult) => {
      navigate(`/store/${encodeURIComponent(result.organizationSlug)}/${encodeURIComponent(result.storeSlug)}`);
    },
    [navigate],
  );

  return (
    <CreateStoreLayout
      branding={{
        name: "TeamStore",
        logoSrc: images.teamstore.teamstoreLogo,
        homeHref: "/",
      }}
      adapter={adapter}
      draftId={draftId}
      onDraftIdChange={handleDraftIdChange}
      onExit={handleExit}
      onComplete={handleComplete}
    />
  );
}
