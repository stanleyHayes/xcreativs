"use client";

import { Check, ChevronDown } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

export type CustomSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type CustomSelectVariant = "field" | "portal" | "currency" | "nav";

type CustomSelectProps = {
  options: CustomSelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  variant?: CustomSelectVariant;
  disabled?: boolean;
  required?: boolean;
  "aria-label"?: string;
};

const variantClasses: Record<CustomSelectVariant, string> = {
  field: "field-x",
  portal: "portal-field-x",
  currency: "custom-currency-trigger-x",
  nav: "custom-nav-select-trigger-x",
};

export default function CustomSelect({
  options,
  value,
  defaultValue,
  onChange,
  name,
  placeholder,
  className = "",
  triggerClassName = "",
  variant = "field",
  disabled = false,
  required = false,
  "aria-label": ariaLabel,
}: CustomSelectProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const isControlled = value !== undefined;
  const firstEnabledValue = options.find((option) => !option.disabled)?.value ?? "";
  const [internalValue, setInternalValue] = useState(defaultValue ?? firstEnabledValue);
  const [open, setOpen] = useState(false);
  const selectedValue = isControlled ? value : internalValue;

  const selectedOption = useMemo(
    () => options.find((option) => option.value === selectedValue),
    [options, selectedValue],
  );

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function commit(nextValue: string) {
    const nextOption = options.find((option) => option.value === nextValue);
    if (!nextOption || nextOption.disabled || disabled) return;
    if (!isControlled) setInternalValue(nextValue);
    onChange?.(nextValue);
    setOpen(false);
  }

  function moveSelection(delta: number) {
    if (!options.length) return;
    const enabled = options.filter((option) => !option.disabled);
    if (!enabled.length) return;
    const currentIndex = enabled.findIndex((option) => option.value === selectedValue);
    const nextIndex = currentIndex === -1
      ? 0
      : (currentIndex + delta + enabled.length) % enabled.length;
    commit(enabled[nextIndex].value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) setOpen(true);
      moveSelection(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) setOpen(true);
      moveSelection(-1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen((current) => !current);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={`custom-select-x ${className}`}>
      {name && <input type="hidden" name={name} value={selectedValue ?? ""} required={required} />}
      <button
        type="button"
        className={`custom-select-trigger-x ${variantClasses[variant]} ${triggerClassName}`}
        aria-label={ariaLabel}
        aria-controls={`${id}-listbox`}
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
      >
        <span className={selectedOption ? "custom-select-value-x" : "custom-select-placeholder-x"}>
          {selectedOption?.label || placeholder || "Select"}
        </span>
        <ChevronDown className="custom-select-chevron-x" aria-hidden />
      </button>

      {open && (
        <div id={`${id}-listbox`} role="listbox" className="custom-select-menu-x">
          {options.map((option) => {
            const active = option.value === selectedValue;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                disabled={option.disabled}
                className="custom-select-option-x"
                onClick={() => commit(option.value)}
              >
                <span>{option.label}</span>
                {active && <Check className="h-3.5 w-3.5" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
