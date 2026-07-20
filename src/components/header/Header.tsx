import { Authenticated, Unauthenticated } from "convex/react";
import { useEffect, useState } from "react";
import { LuSearch, LuShoppingCart, LuUser } from "react-icons/lu";
import { Link, NavLink } from "react-router-dom";

import { images } from "../../assets/images";
import { useCart } from "../../features/cart/CartContext";
import MobileDrawer from "../mobile-drawer/MobileDrawer";
import MobileMenuButton from "../mobile-menu/MobileMenuButton";
import UserMenu from "../user-menu/UserMenu";
import styles from "./Header.module.scss";

export default function Header() {
  const { itemCount } = useCart();

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
            to="/products"
            className={({ isActive }) =>
              isActive ? styles.activeLink : undefined
            }
          >
            Shop Blanks
          </NavLink>

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

            {itemCount > 0 && (
              <span className={styles.cartCount}>{itemCount}</span>
            )}
          </Link>
        </div>

        <div className={styles.mobileActions}>
          <Link to="/cart" className={styles.cart}>
            <LuShoppingCart />

            {itemCount > 0 && (
              <span className={styles.cartCount}>{itemCount}</span>
            )}
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
        cartCount={itemCount}
      />
    </header>
  );
}
