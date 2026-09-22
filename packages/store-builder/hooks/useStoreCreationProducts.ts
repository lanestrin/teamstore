import { useEffect, useMemo, useState } from "react";

import type { GetStoreCreationProductsInput, StoreCreationProducts } from "../types/backend";
import { useStoreBuilderAdapter } from "../context/StoreBuilderAdapterContext";

interface StoreCreationProductsState {
  requestKey: string | null;
  data: StoreCreationProducts | undefined;
  error: Error | null;
}

interface UseStoreCreationProductsResult {
  data: StoreCreationProducts | undefined;
  isLoading: boolean;
  error: Error | null;
}

function getError(error: unknown): Error {
  return error instanceof Error ? error : new Error("Could not load store creation products.");
}

export function useStoreCreationProducts(input: GetStoreCreationProductsInput | null): UseStoreCreationProductsResult {
  const adapter = useStoreBuilderAdapter();

  const activity = input?.activity;
  const colorFamily = input?.colorFamily;

  const selectedProductIdsKey = JSON.stringify(input?.selectedProductIds ?? []);

  const request = useMemo<GetStoreCreationProductsInput | null>(() => {
    if (!activity) {
      return null;
    }

    return {
      activity,
      colorFamily,
      selectedProductIds: JSON.parse(selectedProductIdsKey) as string[],
    };
  }, [activity, colorFamily, selectedProductIdsKey]);

  const requestKey = request ? JSON.stringify(request) : null;

  const [state, setState] = useState<StoreCreationProductsState>({
    requestKey: null,
    data: undefined,
    error: null,
  });

  useEffect(() => {
    if (!request || !requestKey) {
      return;
    }

    let isCancelled = false;

    void adapter
      .getStoreCreationProducts(request)
      .then((data) => {
        if (isCancelled) {
          return;
        }

        setState({
          requestKey,
          data,
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (isCancelled) {
          return;
        }

        setState({
          requestKey,
          data: undefined,
          error: getError(error),
        });
      });

    return () => {
      isCancelled = true;
    };
  }, [adapter, request, requestKey]);

  if (!request || !requestKey) {
    return {
      data: undefined,
      isLoading: false,
      error: null,
    };
  }

  if (state.requestKey !== requestKey) {
    return {
      data: undefined,
      isLoading: true,
      error: null,
    };
  }

  return {
    data: state.data,
    isLoading: false,
    error: state.error,
  };
}
