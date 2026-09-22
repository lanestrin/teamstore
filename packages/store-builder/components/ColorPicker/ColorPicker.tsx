import { useEffect, useId, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { LuChevronDown } from "react-icons/lu";

import styles from "./ColorPicker.module.scss";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

const PICKER_HEIGHT = 420;
const PICKER_WIDTH = 320;
const VIEWPORT_GUTTER = 16;

function normalizeHex(value: string): string | null {
  const hex = value.trim().replace(/^#/, "");

  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    return `#${hex
      .split("")
      .map((character) => character + character)
      .join("")
      .toUpperCase()}`;
  }

  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return `#${hex.toUpperCase()}`;
  }

  return null;
}

export default function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const id = useId();

  const triggerId = `${id}-trigger`;
  const labelId = `${id}-label`;
  const popoverId = `${id}-popover`;
  const hexInputId = `${id}-hex`;
  const hexErrorId = `${id}-hex-error`;

  const [isOpen, setIsOpen] = useState(false);
  const [tempColor, setTempColor] = useState(value);
  const [hexInput, setHexInput] = useState(value);
  const [hexError, setHexError] = useState<string>();
  const [openAbove, setOpenAbove] = useState(false);
  const [alignRight, setAlignRight] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function resetDraft() {
    setTempColor(value);
    setHexInput(value.toUpperCase());
    setHexError(undefined);
  }

  function closePicker(restoreFocus = false) {
    resetDraft();
    setIsOpen(false);

    if (restoreFocus) {
      requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (wrapperRef.current && event.target instanceof Node && !wrapperRef.current.contains(event.target)) {
        setTempColor(value);
        setHexInput(value.toUpperCase());
        setHexError(undefined);
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();

        setTempColor(value);
        setHexInput(value.toUpperCase());
        setHexError(undefined);
        setIsOpen(false);

        requestAnimationFrame(() => {
          triggerRef.current?.focus();
        });
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, value]);

  function handleTriggerClick() {
    if (isOpen) {
      closePicker();
      return;
    }

    const wrapper = wrapperRef.current;

    if (wrapper) {
      const rect = wrapper.getBoundingClientRect();

      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;

      setOpenAbove(spaceBelow < PICKER_HEIGHT && spaceAbove > spaceBelow);

      setAlignRight(rect.left + PICKER_WIDTH > window.innerWidth - VIEWPORT_GUTTER);
    }

    resetDraft();
    setIsOpen(true);
  }

  function handlePickerChange(color: string) {
    const normalized = color.toUpperCase();

    setTempColor(normalized);
    setHexInput(normalized);
    setHexError(undefined);
  }

  function handleHexChange(nextValue: string) {
    setHexInput(nextValue);

    const normalized = normalizeHex(nextValue);

    if (normalized) {
      setTempColor(normalized);
      setHexError(undefined);
    }
  }

  function validateHex(): string | null {
    const normalized = normalizeHex(hexInput);

    if (!normalized) {
      setHexError("Enter a valid 3 or 6 digit hex color, such as #1D4ED8.");

      return null;
    }

    setHexError(undefined);

    return normalized;
  }

  function handleApply() {
    const normalized = validateHex();

    if (!normalized) {
      return;
    }

    onChange(normalized);
    setIsOpen(false);

    requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  }

  function handleCancel() {
    closePicker(true);
  }

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <span id={labelId} className={styles.label}>
        {label}
      </span>

      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        className={styles.trigger}
        aria-labelledby={labelId}
        aria-controls={popoverId}
        aria-expanded={isOpen}
        onClick={handleTriggerClick}
      >
        <span
          className={styles.swatch}
          style={{
            backgroundColor: value,
          }}
          aria-hidden="true"
        />

        <span className={styles.hex}>{value.toUpperCase()}</span>

        <LuChevronDown className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          id={popoverId}
          className={[styles.popover, openAbove ? styles.top : styles.bottom, alignRight ? styles.alignRight : ""]
            .filter(Boolean)
            .join(" ")}
          role="group"
          aria-labelledby={labelId}
        >
          <HexColorPicker color={tempColor} onChange={handlePickerChange} />

          <div className={styles.inputGroup}>
            <label htmlFor={hexInputId}>Hex color</label>

            <input
              id={hexInputId}
              type="text"
              value={hexInput}
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={Boolean(hexError)}
              aria-describedby={hexError ? hexErrorId : undefined}
              onChange={(event) => handleHexChange(event.target.value)}
              onBlur={validateHex}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleApply();
                }
              }}
            />

            {hexError && (
              <p id={hexErrorId} className={styles.error} role="alert">
                {hexError}
              </p>
            )}
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={handleCancel}>
              Cancel
            </button>

            <button type="button" className={styles.apply} onClick={handleApply}>
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
