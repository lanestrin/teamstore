import styles from "./ComingSoonBadge.module.scss";

interface ComingSoonBadgeProps {
  className?: string;
}

export default function ComingSoonBadge({ className = "" }: ComingSoonBadgeProps) {
  return <span className={`${styles.badge} ${className}`}>Coming Soon</span>;
}
