import {
  createBrowserRouter
} from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import LoginPage from "../features/auth/LoginPage";
import HomePage from "../features/home/HomePage";
import ProductPage from "../features/products/ProductPage";
import StorePage from "../features/stores/StorePage";
import StoresPage from "../features/stores/StoresPage";
import AccountPage from "../features/account/AccountPage";
import ProtectedRoute from "../features/auth/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: "stores",
        element: <StoresPage />
      },
      {
        path: "store/:slug",
        element: <StorePage />
      },
      {
        path: "product/:sku",
        element: <ProductPage />
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "login",
        element: <LoginPage />
      },
    ]
  }
]);
