import { Authenticated, Unauthenticated } from "convex/react";
import { Navigate } from "react-router-dom";
import AuthForm from "./AuthForm";

export default function LoginPage() {
	return (
		<>
			<Authenticated>
				<Navigate to="/account" replace />
			</Authenticated>

			<Unauthenticated>
				<AuthForm />
			</Unauthenticated>
		</>
	);
}
