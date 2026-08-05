import { createBrowserRouter } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import AccountPage from "../features/account/AccountPage";
import LoginPage from "../features/auth/LoginPage";
import ProtectedRoute from "../features/auth/ProtectedRoute";
import CartPage from "../features/cart/CartPage";
import CatalogPage from "../features/catalog/CatalogPage";
import CreateStorePage from "../features/create-store/CreateStorePage";
import CreateStoreLayout from "../features/create-store/layouts/CreateStoreLayout";
import HomePage from "../features/home/HomePage";
import ProductDetailsPage from "../features/products/ProductDetailsPage";
import StorePage from "../features/stores/StorePage";
import StoresPage from "../features/stores/StoresPage";
import { HowItWorksPage } from "../features/how-it-works/HowItWorksPage";
import DemoPage from "../features/auth/DemoPage";

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
        path: "store/:organizationSlug/:storeSlug",
        element: <StorePage />,
      },
      {
        path: "products",
        element: <CatalogPage />,
      },
      {
        path: "product/:slug",
        element: <ProductDetailsPage />,
      },
      {
        path: "/how-it-works",
        element: <HowItWorksPage />,
      },
      {
        path: "cart",
        element: <CartPage />,
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
        path: "demo",
        element: <DemoPage />,
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
