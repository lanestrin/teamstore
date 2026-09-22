import { createContext, useContext } from "react";

import type { StoreBuilderAdapter } from "../types/backend";

export const StoreBuilderAdapterContext = createContext<StoreBuilderAdapter | null>(null);

export function useStoreBuilderAdapter(): StoreBuilderAdapter {
  const adapter = useContext(StoreBuilderAdapterContext);

  if (!adapter) {
    throw new Error("Store Builder requires a StoreBuilder adapter.");
  }

  return adapter;
}
