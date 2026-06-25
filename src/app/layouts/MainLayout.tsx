import { Outlet } from "react-router-dom";

import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";

export default function MainLayout() {
  return (
    <div className="app-shell">
      <Header />

      <main className="app-main">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}