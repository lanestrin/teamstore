import { useEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { LuChevronDown } from "react-icons/lu";

import styles from "./ColorPicker.module.scss";

interface ColorPickerProps {
	label: string;
	value: string;
	onChange: (color: string) => void;
}

const PICKER_HEIGHT = 420;

export default function ColorPicker({
	label,
	value,
	onChange,
}: ColorPickerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [tempColor, setTempColor] = useState(value);
	const [openAbove, setOpenAbove] = useState(false);

	const wrapperRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				wrapperRef.current &&
				!wrapperRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
				setTempColor(value);
			}
		}

		document.addEventListener(
			"mousedown",
			handleClickOutside
		);

		return () => {
			document.removeEventListener(
				"mousedown",
				handleClickOutside
			);
		};
	}, [value]);

	function handleTriggerClick() {
		if (isOpen) {
			setIsOpen(false);
			return;
		}

		if (wrapperRef.current) {
			const rect =
				wrapperRef.current.getBoundingClientRect();

			const spaceAbove = rect.top;
			const spaceBelow =
				window.innerHeight - rect.bottom;

			setOpenAbove(
				spaceBelow < PICKER_HEIGHT &&
					spaceAbove > spaceBelow
			);
		}

		setTempColor(value);
		setIsOpen(true);
	}

	function handleApply() {
		onChange(tempColor);
		setIsOpen(false);
	}

	function handleCancel() {
		setTempColor(value);
		setIsOpen(false);
	}

	return (
		<div
			ref={wrapperRef}
			className={styles.wrapper}
		>
			<label className={styles.label}>
				{label}
			</label>

			<button
				type="button"
				className={styles.trigger}
				onClick={handleTriggerClick}
			>
				<span
					className={styles.swatch}
					style={{
						backgroundColor: value,
					}}
				/>

				<span className={styles.hex}>
					{value.toUpperCase()}
				</span>

				<LuChevronDown />
			</button>

			{isOpen && (
				<div
					className={`${styles.popover} ${
						openAbove
							? styles.top
							: styles.bottom
					}`}
				>
					<HexColorPicker
						color={tempColor}
						onChange={setTempColor}
					/>

					<div
						className={`field ${styles.inputGroup}`}
					>
						<label htmlFor="hex">
							Hex
						</label>

						<input
							id="hex"
							type="text"
							value={tempColor}
							onChange={(e) =>
								setTempColor(
									e.target.value
								)
							}
						/>
					</div>

					<div
						className={styles.actions}
					>
						<button
							type="button"
							className={
								styles.cancel
							}
							onClick={
								handleCancel
							}
						>
							Cancel
						</button>

						<button
							type="button"
							className={
								styles.apply
							}
							onClick={
								handleApply
							}
						>
							Apply
						</button>
					</div>
				</div>
			)}
		</div>
	);
}