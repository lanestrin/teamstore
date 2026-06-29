import { useRef, useState, useEffect, useMemo, useCallback, type ReactNode, type PointerEvent } from "react";
import styles from "./ResizablePanel.module.scss";

type CollapsedSide = "left" | "right" | null;

interface ResizablePanelProps {
	left: ReactNode;
	right: ReactNode;
	storageKey?: string;
	defaultLeftPercent?: number;
	minLeftPercent?: number;
	maxLeftPercent?: number;
	className?: string;
	leftClassName?: string;
	rightClassName?: string;
	dividerLabel?: string;
}

interface StoredPanelState {
	leftPercent: number;
	collapsedSide: CollapsedSide;
}

const DEFAULT_STORAGE_KEY = "teamstore-create-store-resizable-panel";
const DEFAULT_LEFT_PERCENT = 50;
const DEFAULT_MIN_LEFT_PERCENT = 30;
const DEFAULT_MAX_LEFT_PERCENT = 70;
const CLICK_DELAY_MS = 180;

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

function readStoredState(storageKey: string): StoredPanelState | null {
	try {
		const raw = localStorage.getItem(storageKey);

		if (!raw) return null;

		const parsed = JSON.parse(raw) as Partial<StoredPanelState>;

		if (typeof parsed.leftPercent !== "number") return null;

		return {
			leftPercent: parsed.leftPercent,
			collapsedSide: parsed.collapsedSide ?? null,
		};
	} catch {
		return null;
	}
}

export default function ResizablePanel({
	left,
	right,
	storageKey = DEFAULT_STORAGE_KEY,
	defaultLeftPercent = DEFAULT_LEFT_PERCENT,
	minLeftPercent = DEFAULT_MIN_LEFT_PERCENT,
	maxLeftPercent = DEFAULT_MAX_LEFT_PERCENT,
	className,
	leftClassName,
	rightClassName,
	dividerLabel = "Resize preview panel",
}: ResizablePanelProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const clickTimerRef = useRef<number | null>(null);
	const lastExpandedPercentRef = useRef(defaultLeftPercent);
	const didDragRef = useRef(false);

	const [leftPercent, setLeftPercent] = useState(defaultLeftPercent);
	const [collapsedSide, setCollapsedSide] = useState<CollapsedSide>(null);
	const [isDragging, setIsDragging] = useState(false);

	const safeMin = clamp(minLeftPercent, 5, 90);
	const safeMax = clamp(maxLeftPercent, safeMin, 95);

	useEffect(() => {
		const storedState = readStoredState(storageKey);

		if (!storedState) {
			setLeftPercent(clamp(defaultLeftPercent, safeMin, safeMax));
			return;
		}

		const safePercent = clamp(storedState.leftPercent, safeMin, safeMax);

		setLeftPercent(safePercent);
		setCollapsedSide(storedState.collapsedSide);

		if (!storedState.collapsedSide) {
			lastExpandedPercentRef.current = safePercent;
		}
	}, [defaultLeftPercent, safeMax, safeMin, storageKey]);

	useEffect(() => {
		try {
			localStorage.setItem(
				storageKey,
				JSON.stringify({
					leftPercent,
					collapsedSide,
				})
			);
		} catch {
			// localStorage can fail in private browsing or locked-down browsers.
		}
	}, [collapsedSide, leftPercent, storageKey]);

	useEffect(() => {
		return () => {
			if (clickTimerRef.current) {
				window.clearTimeout(clickTimerRef.current);
			}
		};
	}, []);

	const panelStyle = useMemo(
		() =>
			({
				"--left-size": `${leftPercent}%`,
			}) as React.CSSProperties,
		[leftPercent]
	);

	const DIVIDER_WIDTH = 12;
	const MIN_LEFT_WIDTH = 500;
	const MIN_RIGHT_WIDTH = 420;

	const updateFromClientX = useCallback(
		(clientX: number) => {
			const container = containerRef.current;

			if (!container) return;

			const rect = container.getBoundingClientRect();

			const availableWidth = rect.width - DIVIDER_WIDTH;

			const minLeft = MIN_LEFT_WIDTH;
			const maxLeft = availableWidth - MIN_RIGHT_WIDTH;

			// If the window is too small, fall back to percentage limits.
			if (maxLeft <= minLeft) {
				const nextPercent = ((clientX - rect.left) / rect.width) * 100;
				const clampedPercent = clamp(nextPercent, safeMin, safeMax);

				lastExpandedPercentRef.current = clampedPercent;
				setLeftPercent(clampedPercent);
				setCollapsedSide(null);

				return;
			}

			const nextLeftWidth = clamp(
				clientX - rect.left,
				minLeft,
				maxLeft
			);

			const nextPercent = (nextLeftWidth / availableWidth) * 100;

			lastExpandedPercentRef.current = nextPercent;
			setLeftPercent(nextPercent);
			setCollapsedSide(null);
		},
		[safeMin, safeMax]
	);

	const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
		if (event.button !== 0) return;

		didDragRef.current = false;

		event.currentTarget.setPointerCapture(event.pointerId);
		setIsDragging(true);
		updateFromClientX(event.clientX);
	};

	const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
		if (!isDragging) return;

		didDragRef.current = true;

		updateFromClientX(event.clientX);
	};

	const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
		if (!isDragging) return;

		event.currentTarget.releasePointerCapture(event.pointerId);
		setIsDragging(false);
	};

	const handleDividerClick = () => {
		// Ignore the click event that browsers fire after dragging.
		if (didDragRef.current) {
			didDragRef.current = false;
			return;
		}

		if (isDragging) return;

		if (clickTimerRef.current) {
			window.clearTimeout(clickTimerRef.current);
		}

		clickTimerRef.current = window.setTimeout(() => {
			setCollapsedSide(currentSide => {
				if (currentSide === "right") {
					setLeftPercent(lastExpandedPercentRef.current);
					return null;
				}

				lastExpandedPercentRef.current = leftPercent;
				return "right";
			});
		}, CLICK_DELAY_MS);
	};

	const handleDividerDoubleClick = () => {
		if (clickTimerRef.current) {
			window.clearTimeout(clickTimerRef.current);
		}

		lastExpandedPercentRef.current = clamp(defaultLeftPercent, safeMin, safeMax);
		setLeftPercent(lastExpandedPercentRef.current);
		setCollapsedSide(null);
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			handleDividerClick();
			return;
		}

		if (event.key === "ArrowLeft") {
			event.preventDefault();
			const nextPercent = clamp(leftPercent - 5, safeMin, safeMax);

			lastExpandedPercentRef.current = nextPercent;
			setLeftPercent(nextPercent);
			setCollapsedSide(null);
			return;
		}

		if (event.key === "ArrowRight") {
			event.preventDefault();
			const nextPercent = clamp(leftPercent + 5, safeMin, safeMax);

			lastExpandedPercentRef.current = nextPercent;
			setLeftPercent(nextPercent);
			setCollapsedSide(null);
		}
	};

	return (
		<div
			ref={containerRef}
			className={[
				styles.panel,
				isDragging ? styles.dragging : "",
				collapsedSide === "right" ? styles.previewCollapsed : "",
				className ?? "",
			].join(" ")}
			style={panelStyle}
		>
			<section className={[styles.leftPanel, leftClassName ?? ""].join(" ")}>
				{left}
			</section>

			<button
				type="button"
				className={styles.divider}
				aria-label={dividerLabel}
				aria-expanded={collapsedSide !== "right"}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onPointerCancel={handlePointerUp}
				onClick={handleDividerClick}
				onDoubleClick={handleDividerDoubleClick}
				onKeyDown={handleKeyDown}
			>
				<span className={styles.dividerHandle} />
			</button>

			<aside className={[styles.rightPanel, rightClassName ?? ""].join(" ")}>
				{right}
			</aside>
		</div>
	);
}
