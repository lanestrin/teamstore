import { useEffect, useState } from "react";
import { LuUser, LuShoppingCart, LuSearch } from "react-icons/lu";
import { Link, NavLink } from "react-router-dom";
import { Unauthenticated, Authenticated } from "convex/react";

import styles from "./Header.module.scss";
import UserMenu from "../user-menu/UserMenu";
import { images } from "../../assets/images";
import MobileMenuButton from "../mobile-menu/MobileMenuButton";
import MobileDrawer from "../mobile-drawer/MobileDrawer";

export default function Header() {
  const cartCount = 3;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link
          to="/"
          className={styles.logo}
          onClick={() => setMobileMenuOpen(false)}
        >
          <img
            src={images.teamstore.teamstoreLogo}
            alt="TeamStore"
            className={styles.logoImage}
          />
        </Link>

        <div className={styles.search}>
          <LuSearch className={styles.searchIcon} />

          <input
            type="text"
            placeholder="Search products..."
            className={styles.searchInput}
          />
        </div>

        <nav className={styles.nav}>
          <NavLink
            to="/stores"
            className={({ isActive }) =>
              isActive ? styles.activeLink : undefined
            }
          >
            Stores
          </NavLink>

          <NavLink
            to="/how-it-works"
            className={({ isActive }) =>
              isActive ? styles.activeLink : undefined
            }
          >
            How It Works
          </NavLink>
        </nav>

        <div className={styles.desktopActions}>
          <Unauthenticated>
            <Link to="/login" className={styles.account}>
              <LuUser />
              <span>Login</span>
            </Link>
          </Unauthenticated>

          <Authenticated>
            <UserMenu />
          </Authenticated>

          <Link to="/cart" className={styles.cart}>
            <LuShoppingCart />

            <span className={styles.cartCount}>{cartCount}</span>
          </Link>
        </div>

        <div className={styles.mobileActions}>
          <Link to="/cart" className={styles.cart}>
            <LuShoppingCart />

            <span className={styles.cartCount}>{cartCount}</span>
          </Link>

          <MobileMenuButton
            isOpen={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          />
        </div>
      </div>

      <MobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        cartCount={cartCount}
      />
    </header>
  );
}
