import { useState, type SyntheticEvent } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { featureToggle } from "../../config/feature-toggle";
import GoogleSignInButton from "./components/GoogleSignInButton/GoogleSignInButton";
import styles from "./AuthForm.module.scss";

type AuthMode = "signIn" | "signUp" | "forgotPassword" | "resetPassword";

const MIN_PASSWORD_LENGTH = 8;
const DEMO_EMAIL = "guest@teamstore.demo";
const DEMO_PASSWORD = "TeamStoreDemo2026!";

export default function AuthForm() {
  const { signIn } = useAuthActions();

  const [mode, setMode] = useState<AuthMode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [demoLoginSelected, setDemoLoginSelected] = useState(false);

  const isSignUp = mode === "signUp";
  const isForgotPassword = mode === "forgotPassword";
  const isResetPassword = mode === "resetPassword";
  const isSignIn = mode === "signIn";

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    e.preventDefault();
    setError("");

    if (isForgotPassword) {
      await handleResetRequest();
      return;
    }

    if (isResetPassword) {
      await handleResetVerification();
      return;
    }

    if (isSignUp && password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set("flow", mode);

    setLoading(true);

    try {
      await signIn("password", formData);
    } catch (err) {
      const message = err instanceof Error ? err.message.toLowerCase() : "";

      if (message.includes("invalid password")) {
        setError(isSignUp ? `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` : "Incorrect email or password.");
      } else {
        setError(isSignUp ? "Unable to create your account. Please try again." : "Unable to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResetRequest() {
    const formData = new FormData();

    formData.set("flow", "reset");
    formData.set("email", email);

    setLoading(true);

    try {
      await signIn("password", formData);

      setResetCode("");
      setNewPassword("");
      setMode("resetPassword");
    } catch (err) {
      console.error("Password reset request failed:", err);

      setError("Unable to send a password reset code. Please check your email and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetVerification() {
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    const formData = new FormData();

    formData.set("flow", "reset-verification");
    formData.set("email", email);
    formData.set("code", resetCode);
    formData.set("newPassword", newPassword);

    setLoading(true);

    try {
      await signIn("password", formData);
    } catch (err) {
      const message = err instanceof Error ? err.message.toLowerCase() : "";

      if (message.includes("invalid code")) {
        setError("The reset code is invalid or has expired.");
      } else {
        setError("Unable to reset your password. Please request a new code and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setLoading(true);

    try {
      await signIn("google");
    } catch (err) {
      console.error("Google sign-in failed:", err);
      setError("Unable to sign in with Google. Please try again.");
      setLoading(false);
    }
  }

  function toggleMode() {
    setMode((currentMode) => (currentMode === "signUp" ? "signIn" : "signUp"));

    clearForm();
  }

  function showForgotPassword() {
    setMode("forgotPassword");
    setPassword("");
    setResetCode("");
    setNewPassword("");
    setError("");
    setDemoLoginSelected(false);
  }

  function showSignIn() {
    setMode("signIn");
    setPassword("");
    setResetCode("");
    setNewPassword("");
    setError("");
    setDemoLoginSelected(false);
  }

  function fillDemoCredentials() {
    setMode("signIn");
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setDemoLoginSelected(true);
    setError("");
  }

  function clearForm() {
    setEmail("");
    setPassword("");
    setResetCode("");
    setNewPassword("");
    setError("");
    setDemoLoginSelected(false);
  }

  function getSubtitle() {
    if (isSignUp) {
      return "Create an account to manage your stores.";
    }

    if (isForgotPassword) {
      return "Enter your email and we'll send you a reset code.";
    }

    if (isResetPassword) {
      return "Enter the code from your email and choose a new password.";
    }

    return "Sign in to manage your stores.";
  }

  function getSubmitLabel() {
    if (loading) {
      return "Please wait...";
    }

    if (isSignUp) {
      return "Create Account";
    }

    if (isForgotPassword) {
      return "Send Reset Code";
    }

    if (isResetPassword) {
      return "Reset Password";
    }

    return "Sign In";
  }

  return (
    <div className={styles.card}>
      <h1>Welcome to TeamStore</h1>

      <p className={styles.subtitle}>{getSubtitle()}</p>

      <form onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="email">Email</label>

          <input
            id="email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setDemoLoginSelected(false);
            }}
            autoComplete="email"
            disabled={isResetPassword}
            required
          />
        </div>

        {(isSignIn || isSignUp) && (
          <div className={styles.field}>
            <label htmlFor="password">Password</label>

            <input
              id="password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setDemoLoginSelected(false);
              }}
              minLength={isSignUp ? MIN_PASSWORD_LENGTH : undefined}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              aria-describedby={isSignUp ? "password-requirements" : undefined}
              required
            />

            {isSignUp && (
              <p id="password-requirements" className={styles.helpText}>
                Use at least {MIN_PASSWORD_LENGTH} characters.
              </p>
            )}

            {isSignIn && (
              <button type="button" className={styles.forgotPasswordLink} onClick={showForgotPassword}>
                Forgot password?
              </button>
            )}
          </div>
        )}

        {isResetPassword && (
          <>
            <div className={styles.field}>
              <label htmlFor="resetCode">Reset Code</label>

              <input
                id="resetCode"
                type="text"
                name="code"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="newPassword">New Password</label>

              <input
                id="newPassword"
                type="password"
                name="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete="new-password"
                aria-describedby="new-password-requirements"
                required
              />

              <p id="new-password-requirements" className={styles.helpText}>
                Use at least {MIN_PASSWORD_LENGTH} characters.
              </p>
            </div>
          </>
        )}

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading}>
          {getSubmitLabel()}
        </button>
      </form>

      {isSignIn && (
        <div className={styles.authDivider}>
          <span>or</span>
        </div>
      )}

      {isSignIn && <GoogleSignInButton onClick={handleGoogleSignIn} disabled={loading} />}

      <div className={styles.authActions}>
        {(isForgotPassword || isResetPassword) && (
          <button type="button" className={styles.linkButton} onClick={showSignIn}>
            Back to sign in
          </button>
        )}

        {(isSignIn || isSignUp) && (
          <button type="button" className={styles.linkButton} onClick={toggleMode} disabled={demoLoginSelected}>
            {isSignUp ? "Already have an account?" : "Create an account"}
          </button>
        )}

        {featureToggle.demoLogin && isSignIn && (
          <button type="button" className={styles.demoLink} onClick={fillDemoCredentials}>
            Use Demo Account
          </button>
        )}
      </div>
    </div>
  );
}
