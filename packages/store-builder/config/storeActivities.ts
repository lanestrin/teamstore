export const STORE_ACTIVITIES = [
  { value: "basketball", label: "Basketball" },
  { value: "baseball", label: "Baseball" },
  { value: "football", label: "Football" },
  { value: "soccer", label: "Soccer" },
  { value: "softball", label: "Softball" },
  { value: "volleyball", label: "Volleyball" },
  { value: "wrestling", label: "Wrestling" },
  { value: "spirit-wear", label: "Spirit Wear" },
  { value: "other", label: "Other" },
] as const;

export type StoreActivity = (typeof STORE_ACTIVITIES)[number]["value"];

export function isStoreActivity(value: string): value is StoreActivity {
  return STORE_ACTIVITIES.some((activity) => activity.value === value);
}
