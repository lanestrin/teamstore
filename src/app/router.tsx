import { createBrowserRouter } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import RootLayout from "./layouts/RootLayout";

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
import ComingSoon from "../components/coming-soon/ComingSoon";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
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
            path: "how-it-works",
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
            path: "login",
            element: <LoginPage />,
          },
          {
            path: "new",
            element: (
              <ComingSoon
                title="New Arrivals Are Coming Soon"
                description="A dedicated view for recently added TeamStore products is currently in development."
                actionLabel="Browse Catalog"
                actionHref="/products"
              />
            ),
          },
          {
            path: "about",
            element: (
              <ComingSoon
                title="About TeamStore Is Coming Soon"
                description="More information about TeamStore and the project is currently being added."
                actionLabel="Return Home"
                actionHref="/"
              />
            ),
          },
          {
            path: "contact",
            element: (
              <ComingSoon
                title="Contact Is Coming Soon"
                description="Contact options for TeamStore are currently in development."
                actionLabel="Return Home"
                actionHref="/"
              />
            ),
          },
          {
            path: "careers",
            element: (
              <ComingSoon
                title="Careers Are Coming Soon"
                description="Career information is not available in the current TeamStore preview."
                actionLabel="Return Home"
                actionHref="/"
              />
            ),
          },
          {
            path: "sizechart",
            element: (
              <ComingSoon
                title="Size Guides Are Coming Soon"
                description="Product sizing guides and fit information are currently being added to TeamStore."
                actionLabel="Browse Products"
                actionHref="/products"
              />
            ),
          },
          {
            path: "faqs",
            element: (
              <ComingSoon
                title="FAQs Are Coming Soon"
                description="Frequently asked questions and support information are currently being added."
                actionLabel="Return Home"
                actionHref="/"
              />
            ),
          },
          {
            path: "terms",
            element: (
              <ComingSoon
                title="Terms of Use Are Coming Soon"
                description="TeamStore's terms of use are currently being prepared."
                actionLabel="Return Home"
                actionHref="/"
              />
            ),
          },
          {
            path: "privacy",
            element: (
              <ComingSoon
                title="Privacy Policy Is Coming Soon"
                description="TeamStore's privacy information is currently being prepared."
                actionLabel="Return Home"
                actionHref="/"
              />
            ),
          },
          {
            path: "accessibility",
            element: (
              <ComingSoon
                title="Accessibility Information Is Coming Soon"
                description="Accessibility information for TeamStore is currently being prepared."
                actionLabel="Return Home"
                actionHref="/"
              />
            ),
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
    ],
  },
]);
