import { useEffect, useState } from "react";

import ColorsStep from "./steps/ColorStep/ColorsStep";
import ColorsStepSkeleton from "./steps/ColorStep/ColorsStepSkeleton";

export default function CreateStorePage() {
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsLoading(false);
		}, 1500);

		return () => clearTimeout(timer);
	}, []);

	if (isLoading) {
		return <ColorsStepSkeleton />;
	}

	return <ColorsStep />;
}