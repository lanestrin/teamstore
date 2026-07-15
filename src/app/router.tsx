import { createBrowserRouter } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import AccountPage from "../features/account/AccountPage";
import LoginPage from "../features/auth/LoginPage";
import ProtectedRoute from "../features/auth/ProtectedRoute";
import CreateStorePage from "../features/create-store/CreateStorePage";
import CreateStoreLayout from "../features/create-store/layouts/CreateStoreLayout";
import HomePage from "../features/home/HomePage";
import ProductPage from "../features/products/ProductPage";
import StorePage from "../features/stores/StorePage";
import StoresPage from "../features/stores/StoresPage";

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
        element: (
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        ),
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
