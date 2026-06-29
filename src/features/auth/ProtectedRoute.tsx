import {
	Authenticated,
	Unauthenticated,
	AuthLoading,
} from "convex/react";
import { Navigate } from "react-router-dom";
import AccountSkeleton from "../account/AccountSkeleton";

interface ProtectedRouteProps {
	children: React.ReactNode;
}

export default function ProtectedRoute({
	children,
}: ProtectedRouteProps) {
	return (
		<>
			<AuthLoading>
				<AccountSkeleton />
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
