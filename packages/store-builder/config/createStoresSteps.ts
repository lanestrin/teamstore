import type { StoreType } from "../context/CreateStoreContext.types";

export type CreateStoreStepId = "organization" | "colors" | "artwork" | "products" | "regulations" | "review";

export interface CreateStoreStepDefinition {
  id: CreateStoreStepId;
  title: string;
  description: string;
}

const FANWEAR_STEPS: CreateStoreStepDefinition[] = [
  {
    id: "organization",
    title: "Organization",
    description: "Tell us about your team",
  },
  {
    id: "colors",
    title: "Choose Colors",
    description: "Pick your team colors",
  },
  {
    id: "artwork",
    title: "Artwork",
    description: "Choose and customize your artwork",
  },
  {
    id: "products",
    title: "Products",
    description: "Choose what to sell",
  },
  {
    id: "review",
    title: "Review",
    description: "Review and publish",
  },
];

const UNIFORM_STEPS: CreateStoreStepDefinition[] = [
  {
    id: "organization",
    title: "Organization",
    description: "Tell us about your team",
  },
  {
    id: "regulations",
    title: "Uniform Regulations",
    description: "Upload and review uniform requirements",
  },
];

export function getCreateStoreSteps(storeType: StoreType | ""): CreateStoreStepDefinition[] {
  if (storeType === "uniform") {
    return UNIFORM_STEPS;
  }

  return FANWEAR_STEPS;
}
