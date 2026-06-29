import { useEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { LuChevronDown } from "react-icons/lu";

import styles from "./ColorPicker.module.scss";

interface ColorPickerProps {
	label: string;
	value: string;
	onChange: (color: string) => void;
}

export default function ColorPicker({
	label,
	value,
	onChange,
}: ColorPickerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [tempColor, setTempColor] = useState(value);

	const pickerRef =
		useRef<HTMLDivElement>(null);

	useEffect(() => {
		setTempColor(value);
	}, [value]);

	useEffect(() => {
		function handleClickOutside(
			event: MouseEvent
		) {
			if (
				pickerRef.current &&
				!pickerRef.current.contains(
					event.target as Node
				)
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
			className={styles.wrapper}
			ref={pickerRef}
		>
			<label className={styles.label}>
				{label}
			</label>

			<button
				type="button"
				className={styles.trigger}
				onClick={() =>
					setIsOpen(!isOpen)
				}
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
				<div className={styles.popover}>
					<HexColorPicker
						color={tempColor}
						onChange={setTempColor}
					/>

					<div className={styles.inputGroup}>
						<label>Hex</label>

						<input
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
