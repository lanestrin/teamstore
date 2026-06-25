import {
  createBrowserRouter
} from "react-router-dom";

import MainLayout from "./layouts/MainLayout";


import DashboardPage from "../pages/DashboardPage";
import LoginPage from "../pages/LoginPage";
import HomePage from "../pages/Home/HomePage";
import StoresPage from "../pages/Stores/StoresPage";
import StorePage from "../pages/Stores/StorePage";
import ProductPage from "../pages/Product/ProductPage";
import CartPage from "../pages/Cart/CartPage";

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
        element: <DashboardPage />
      },
      {
        path: "login",
        element: <LoginPage />
      },
      {
        path: "cart",
        element: <CartPage />
      },
    ]
  }
]);
