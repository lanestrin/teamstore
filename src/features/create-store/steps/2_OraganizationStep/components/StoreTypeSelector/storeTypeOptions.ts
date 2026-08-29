import type { StoreType } from "../../../../context/CreateStoreContext.types";

export interface StoreTypeOption {
  value: StoreType;
  title: string;
  helpText?: string;
}

export const STORE_TYPES: StoreTypeOption[] = [
  {
    value: "fanwear",
    title: "Fanwear Store",
  },
  {
    value: "uniform",
    title: "Uniform Package",
    helpText: "A store for required team uniforms, player sizing, names, numbers, and other team-specific ordering needs.",
  },
  {
    value: "hybrid",
    title: "Uniforms + Fanwear",
  },
];

export function isValidStoreType(value: string): value is StoreType {
  return STORE_TYPES.some((storeType) => storeType.value === value);
}
