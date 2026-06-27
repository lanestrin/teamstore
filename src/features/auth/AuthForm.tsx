import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import styles from "./AuthForm.module.scss";

export default function AuthForm() {
	const { signIn } = useAuthActions();

	const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	async function handleSubmit(
		e: React.FormEvent<HTMLFormElement>
	) {
		e.preventDefault();

		setError("");
		setLoading(true);

		try {
			const formData = new FormData(e.currentTarget);

			formData.set("flow", mode);

			await signIn("password", formData);
		}
		catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Unable to sign in."
			);
		}
		finally {
			setLoading(false);
		}
	}

	return (
		<div className={styles.card}>
			<h1>Welcome to TeamStore</h1>

			<p className={styles.subtitle}>
				Sign in to manage your stores.
			</p>

			<form onSubmit={handleSubmit}>
				<div className={styles.field}>
					<label>Email</label>

					<input
						type="email"
						name="email"
						required
					/>
				</div>

				<div className={styles.field}>
					<label>Password</label>

					<input
						type="password"
						name="password"
						required
					/>
				</div>

				{error && (
					<div className={styles.error}>
						{error}
					</div>
				)}

				<button
					type="submit"
					disabled={loading}
				>
					{loading
						? "Please wait..."
						: mode === "signIn"
							? "Sign In"
							: "Create Account"}
				</button>
			</form>

			<button
				type="button"
				className={styles.linkButton}
				onClick={() =>
					setMode(
						mode === "signIn"
							? "signUp"
							: "signIn"
					)
				}
			>
				{mode === "signIn"
					? "Create an account"
					: "Already have an account?"}
			</button>
		</div>
	);
}