import styles from "./MobileMenuButton.module.scss";

interface MobileMenuButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export default function MobileMenuButton({
  isOpen,
  onClick,
}: MobileMenuButtonProps) {
  return (
    <button
      aria-controls="mobile-navigation-drawer"
      aria-expanded={isOpen}
      aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
      className={`${styles.mobileMenuButton} ${isOpen ? styles.mobileMenuButtonOpen : ""
        }`}
      onClick={onClick}
      type="button"
    >
      <span />
      <span />
      <span />
    </button>
  );
}
