import {
	createContext,
	useContext,
	useState,
	type ReactNode,
} from "react";

interface CreateStoreContextValue {
	primaryColor: string;
	secondaryColor: string;
	setPrimaryColor: React.Dispatch<React.SetStateAction<string>>;
	setSecondaryColor: React.Dispatch<React.SetStateAction<string>>;
}

const CreateStoreContext =
	createContext<CreateStoreContextValue | null>(null);

interface CreateStoreProviderProps {
	children: ReactNode;
}

export function CreateStoreProvider({
	children,
}: CreateStoreProviderProps) {
	const [primaryColor, setPrimaryColor] =
		useState("#111827");

	const [secondaryColor, setSecondaryColor] =
		useState("#DC2626");

	return (
		<CreateStoreContext.Provider
			value={{
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
