import { Authenticated, Unauthenticated } from "convex/react";
import { LuShoppingCart, LuUser, LuX } from "react-icons/lu";
import { Link, NavLink } from "react-router-dom";

import { images } from "../../assets/images";
import styles from "./MobileDrawer.module.scss";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartCount: number;
}

export default function MobileDrawer({ isOpen, onClose, cartCount }: MobileDrawerProps) {
  const getLinkClassName = ({ isActive }: { isActive: boolean }) => (isActive ? styles.activeDrawerLink : undefined);

  return (
    <>
      <button
        aria-label="Close navigation overlay"
        className={[styles.mobileDrawerOverlay, isOpen ? styles.mobileDrawerOverlayVisible : ""].join(" ")}
        onClick={onClose}
        type="button"
      />

      <aside
        id="mobile-navigation-drawer"
        className={[styles.mobileDrawer, isOpen ? styles.mobileDrawerOpen : ""].join(" ")}
        aria-hidden={!isOpen}
      >
        <div className={styles.mobileDrawerHeader}>
          <Link to="/" onClick={onClose}>
            <img src={images.teamstore.teamstoreLogoDark} alt="TeamStore" />
          </Link>

          <button aria-label="Close menu" onClick={onClose} type="button" className={styles.closeButton}>
            <LuX />
          </button>
        </div>

        <div className={styles.mobileDrawerAccountActions}>
          <Unauthenticated>
            <Link to="/login" className={`${styles.drawerButton} ${styles.drawerButtonGhost}`} onClick={onClose}>
              <LuUser />
              <span>Login</span>
            </Link>
          </Unauthenticated>

          <Authenticated>
            <Link to="/account" className={`${styles.drawerButton} ${styles.drawerButtonPrimary}`} onClick={onClose}>
              <LuUser />
              <span>My Account</span>
            </Link>
          </Authenticated>

          <Link to="/cart" className={`${styles.drawerButton} ${styles.drawerButtonRed}`} onClick={onClose}>
            <LuShoppingCart aria-hidden="true" />
            <span>My Cart</span>
            <span className={styles.cartCount}>{cartCount}</span>
          </Link>
        </div>

        <nav className={styles.mobileDrawerNavigation}>
          <NavLink to="/" end className={getLinkClassName} onClick={onClose}>
            Home
          </NavLink>

          <NavLink to="/products" className={getLinkClassName} onClick={onClose}>
            Shop Blanks
          </NavLink>

          <NavLink to="/stores" className={getLinkClassName} onClick={onClose}>
            Stores
          </NavLink>

          <NavLink to="/how-it-works" className={getLinkClassName} onClick={onClose}>
            How It Works
          </NavLink>
        </nav>
      </aside>
    </>
  );
}
