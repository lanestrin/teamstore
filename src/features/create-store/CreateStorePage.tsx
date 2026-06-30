import { useEffect, useState } from "react";

import ColorsStep from "./steps/ColorStep/ColorsStep";
import ColorsStepSkeleton from "./steps/ColorStep/ColorsStepSkeleton";

export default function CreateStorePage() {
	const [isLoading, setIsLoading] = useState(true);

	const [primaryColor, setPrimaryColor] =
		useState("#111827");

	const [secondaryColor, setSecondaryColor] =
		useState("#DC2626");

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsLoading(false);
		}, 1500);

		return () => clearTimeout(timer);
	}, []);

	if (isLoading) {
		return <ColorsStepSkeleton />;
	}

	return (
		<ColorsStep
			primaryColor={primaryColor}
			secondaryColor={secondaryColor}
			onPrimaryColorChange={setPrimaryColor}
			onSecondaryColorChange={setSecondaryColor}
		/>
	);
}
