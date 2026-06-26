import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";

import { router } from "./app/router";

import "./styles/globals.scss";
import "./index.css";

const convex = new ConvexReactClient(
	import.meta.env.VITE_CONVEX_URL
);

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<ConvexAuthProvider client={convex}>
			<RouterProvider router={router} />
		</ConvexAuthProvider>
	</StrictMode>
);
