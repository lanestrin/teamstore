import { createBrowserRouter } from "react-router-dom";
import AccountPage from "../features/account/AccountPage";
import LoginPage from "../features/auth/LoginPage";
import ProtectedRoute from "../features/auth/ProtectedRoute";
import CreateStorePage from "../features/create-store/CreateStorePage";
import HomePage from "../features/home/HomePage";
import ProductPage from "../features/products/ProductPage";
import StorePage from "../features/stores/StorePage";
import StoresPage from "../features/stores/StoresPage";
import CreateStoreLayout from "../features/create-store/layouts/CreateStoreLayout";
import MainLayout from "./layouts/MainLayout";

export const router = createBrowserRouter([
	{
		path: "/",
		element: <MainLayout />,
		children: [
			{
				index: true,
				element: <HomePage />,
			},
			{
				path: "stores",
				element: <StoresPage />,
			},
			{
				path: "store/:slug",
				element: <StorePage />,
			},
			{
				path: "product/:sku",
				element: <ProductPage />,
			},
			{
				path: "account",
				element: <AccountPage />,
			},
			{
				path: "login",
				element: <LoginPage />,
			},
		],
	},

	{
		element: (
			<ProtectedRoute>
				<CreateStoreLayout />
			</ProtectedRoute>
		),
		children: [
			{
				path: "create-store",
				element: <CreateStorePage />,
			},

		],
	},
]);
