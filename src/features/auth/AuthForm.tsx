import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import styles from "./AuthForm.module.scss";

type AuthMode = "signIn" | "signUp";

const MIN_PASSWORD_LENGTH = 8;

export default function AuthForm() {
	const { signIn } = useAuthActions();

	const [mode, setMode] = useState<AuthMode>("signIn");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	async function handleSubmit(
		e: React.FormEvent<HTMLFormElement>
	) {
		e.preventDefault();

		setError("");

		const formData = new FormData(e.currentTarget);
		const password = String(
			formData.get("password") ?? ""
		);

		if (
			mode === "signUp" &&
			password.length < MIN_PASSWORD_LENGTH
		) {
			setError(
				`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
			);
			return;
		}

		formData.set("flow", mode);
		setLoading(true);

		try {
			await signIn("password", formData);
		}
		catch (err) {
			const message =
				err instanceof Error
					? err.message.toLowerCase()
					: "";

			if (message.includes("invalid password")) {
				setError(
					mode === "signUp"
						? `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
						: "Incorrect email or password."
				);
			}
			else {
				setError(
					mode === "signUp"
						? "Unable to create your account. Please try again."
						: "Unable to sign in. Please try again."
				);
			}
		}
		finally {
			setLoading(false);
		}
	}

	function toggleMode() {
		setMode((currentMode) =>
			currentMode === "signIn"
				? "signUp"
				: "signIn"
		);

		setError("");
	}

	const isSignUp = mode === "signUp";

	return (
		<div className={styles.card}>
			<h1>Welcome to TeamStore</h1>

			<p className={styles.subtitle}>
				{isSignUp
					? "Create an account to manage your stores."
					: "Sign in to manage your stores."}
			</p>

			<form onSubmit={handleSubmit}>
				<div className={styles.field}>
					<label htmlFor="email">
						Email
					</label>

					<input
						id="email"
						type="email"
						name="email"
						autoComplete="email"
						required
					/>
				</div>

				<div className={styles.field}>
					<label htmlFor="password">
						Password
					</label>

					<input
						id="password"
						type="password"
						name="password"
						minLength={
							isSignUp
								? MIN_PASSWORD_LENGTH
								: undefined
						}
						autoComplete={
							isSignUp
								? "new-password"
								: "current-password"
						}
						aria-describedby={
							isSignUp
								? "password-requirements"
								: undefined
						}
						required
					/>

					{isSignUp && (
						<p
							id="password-requirements"
							className={styles.helpText}
						>
							Use at least{" "}
							{MIN_PASSWORD_LENGTH} characters.
						</p>
					)}
				</div>

				{error && (
					<div
						className={styles.error}
						role="alert"
					>
						{error}
					</div>
				)}

				<button
					type="submit"
					disabled={loading}
				>
					{loading
						? "Please wait..."
						: isSignUp
							? "Create Account"
							: "Sign In"}
				</button>
			</form>

			<button
				type="button"
				className={styles.linkButton}
				onClick={toggleMode}
			>
				{isSignUp
					? "Already have an account?"
					: "Create an account"}
			</button>
		</div>
	);
}
