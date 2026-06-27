import {
	Authenticated,
	Unauthenticated,
	AuthLoading,
} from "convex/react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
	children: React.ReactNode;
}

export default function ProtectedRoute({
	children,
}: ProtectedRouteProps) {
	return (
		<>
			<AuthLoading>
				<div>Loading...</div>
			</AuthLoading>

			<Authenticated>
				{children}
			</Authenticated>

			<Unauthenticated>
				<Navigate
					to="/login"
					replace
				/>
			</Unauthenticated>
		</>
	);
}
