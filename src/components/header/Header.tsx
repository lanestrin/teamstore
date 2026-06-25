import { LuUser, LuShoppingCart, LuSearch } from "react-icons/lu";
import { Link, NavLink } from "react-router-dom";
import logo from "../../assets/images/teamstore.webp";
import styles from "./Header.module.scss";

export default function Header() {
  const cartCount = 3;

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          <img
            src={logo}
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
              isActive ? styles.activeLink : ""
            }
          >
            Stores
          </NavLink>

          <NavLink
            to="/how-it-works"
            className={({ isActive }) =>
              isActive ? styles.activeLink : ""
            }
          >
            How It Works
          </NavLink>
        </nav>

        <div className={styles.actions}>
          <Link to="/login" className={styles.account}>
            <LuUser />
            <span>Login</span>
          </Link>

          <Link to="/cart" className={styles.cart}>
            <LuShoppingCart />
            <span className={styles.cartCount}>
              {cartCount}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
