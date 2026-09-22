import type { CSSProperties } from "react";

import styles from "./Skeleton.module.scss";

interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
}

export default function Skeleton({ className = "", style }: SkeletonProps) {
  return <div className={`${styles.skeleton} ${className}`} style={style} />;
}
