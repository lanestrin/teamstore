import {createContext, useContext, useState, type ReactNode, type Dispatch, type SetStateAction } from "react";

interface CreateStoreContextValue {
	currentStep: number;
	setCurrentStep: Dispatch<
		SetStateAction<number>
	>;

	primaryColor: string;
	secondaryColor: string;
	setPrimaryColor: Dispatch<
		SetStateAction<string>
	>;
	setSecondaryColor: React.Dispatch<
		SetStateAction<string>
	>;
}

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

	return (
		<CreateStoreContext.Provider
			value={{
				currentStep,
				setCurrentStep,

				primaryColor,
				secondaryColor,
				setPrimaryColor,
				setSecondaryColor,
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
