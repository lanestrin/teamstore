import { Outlet, useLocation } from "react-router-dom";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";

export default function MainLayout() {
  const location = useLocation();

  const hideFooter = location.pathname.startsWith("/create-store");

  return (
    <div className="app-shell">
      <Header />

      <main className="app-main">
        <Outlet />
      </main>

      {!hideFooter && <Footer />}
    </div>
  );
}
