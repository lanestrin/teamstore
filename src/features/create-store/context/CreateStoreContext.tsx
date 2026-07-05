/* eslint-disable react-refresh/only-export-components */

import {
	createContext,
	useContext,
	useState,
	type ReactNode,
	type Dispatch,
	type SetStateAction,
} from "react";

export interface CreateStoreDraft {
	organizationName: string;
	storeName: string;
	storeSlug: string;
	storeDescription: string;
	logoFile: File | null;
}

interface CreateStoreContextValue {
	currentStep: number;
	setCurrentStep: Dispatch<SetStateAction<number>>;

	primaryColor: string;
	secondaryColor: string;
	setPrimaryColor: Dispatch<SetStateAction<string>>;
	setSecondaryColor: Dispatch<SetStateAction<string>>;

	storeDraft: CreateStoreDraft;
	updateStoreDraft: (updates: Partial<CreateStoreDraft>) => void;
}

const defaultStoreDraft: CreateStoreDraft = {
	organizationName: "",
	storeName: "",
	storeSlug: "",
	storeDescription: "",
	logoFile: null,
};

const CreateStoreContext =
	createContext<CreateStoreContextValue | null>(null);

interface CreateStoreProviderProps {
	children: ReactNode;
}

export function CreateStoreProvider({
	children,
}: CreateStoreProviderProps) {
	const [currentStep, setCurrentStep] =
		useState(1);

	const [primaryColor, setPrimaryColor] =
		useState("#111827");

	const [secondaryColor, setSecondaryColor] =
		useState("#DC2626");

	const [storeDraft, setStoreDraft] =
		useState<CreateStoreDraft>(defaultStoreDraft);

	function updateStoreDraft(
		updates: Partial<CreateStoreDraft>
	) {
		setStoreDraft((currentDraft) => ({
			...currentDraft,
			...updates,
		}));
	}

	return (
		<CreateStoreContext.Provider
			value={{
				currentStep,
				setCurrentStep,

				primaryColor,
				secondaryColor,
				setPrimaryColor,
				setSecondaryColor,

				storeDraft,
				updateStoreDraft,
			}}
		>
			{children}
		</CreateStoreContext.Provider>
	);
}

export function useCreateStore() {
	const context = useContext(CreateStoreContext);

	if (!context) {
		throw new Error(
			"useCreateStore must be used within CreateStoreProvider."
		);
	}

	return context;
}