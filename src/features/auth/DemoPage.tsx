import { useEffect, useRef, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Link, Navigate } from "react-router-dom";

function DemoSignIn() {
  const { signIn } = useAuthActions();

  const hasStarted = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;

    void signIn("anonymous").catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);

      console.error("Demo sign-in failed:", error);
      setError(message);
    });
  }, [signIn]);

  if (error) {
    return (
      <main>
        <h1>Demo unavailable</h1>

        <p>{error}</p>

        <button type="button" onClick={() => window.location.reload()}>
          Try Again
        </button>

        <Link to="/">Return Home</Link>
      </main>
    );
  }

  return (
    <main>
      <p>Preparing your TeamStore demo...</p>
    </main>
  );
}

export default function DemoPage() {
  return (
    <>
      <AuthLoading>
        <main>
          <p>Preparing your TeamStore demo...</p>
        </main>
      </AuthLoading>

      <Authenticated>
        <Navigate to="/" replace />
      </Authenticated>

      <Unauthenticated>
        <DemoSignIn />
      </Unauthenticated>
    </>
  );
}
