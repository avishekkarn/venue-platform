"use client";

import type { JSX } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/**
 * Guest RequestFormField — the shared input for the 8 non-food service request forms.
 *
 * Supports six field types per DESIGN.md §4.6.17.7:
 *   - "text"                — single-line input
 *   - "textarea"            — multi-line input
 *   - "single-select chips" — radio-style chips, one choice
 *   - "multi-select chips"  — checkbox-style chips, many choices
 *   - "time"                — native <input type="time">
 *   - "photo"               — <input type="file" accept="image/*"> (client-side; filename only)
 *
 * Every field renders a label, the input, an optional helper, and an optional error.
 * The component is presentational: the parent form owns state and submission.
 *
 * Accessibility:
 *   - Every input has an associated label (aria-labelledby when using chips).
 *   - Error text is linked via aria-describedby.
 *   - aria-invalid is set on error.
 *
 * Reference: DESIGN.md §4.6.17.7 (the field component), §4.13 (guest voice),
 * §4.14 (accessibility), D-5.1 (one generic request structure).
 */

export type RequestFormFieldType =
  | "text"
  | "textarea"
  | "single-select"
  | "multi-select"
  | "time"
  | "photo";

export interface RequestFormOption {
  readonly value: string;
  readonly label: string;
}

export interface RequestFormFieldProps {
  readonly name: string;
  readonly label: string;
  readonly type: RequestFormFieldType;
  readonly helperText?: string;
  readonly errorText?: string;
  readonly required?: boolean;
  readonly placeholder?: string;
  readonly options?: readonly RequestFormOption[]; // required for single-select and multi-select
  readonly defaultValue?: string | readonly string[]; // type depends on `type`
  readonly onChange?: (value: string | string[]) => void;
}

export function RequestFormField({
  name,
  label,
  type,
  helperText,
  errorText,
  required = false,
  placeholder,
  options = [],
  defaultValue,
  onChange,
}: RequestFormFieldProps): JSX.Element {
  const describedBy = errorText
    ? `${name}-error`
    : helperText
      ? `${name}-helper`
      : undefined;

  // Single-select chips (Radio buttons rendered as interactive chips)
  if (type === "single-select") {
    return (
      <fieldset
        className="flex flex-col gap-2"
        aria-describedby={describedBy}
        aria-invalid={errorText ? true : undefined}
      >
        <legend className="select-none text-[13px] font-semibold leading-[18px] text-guest-text-secondary mb-1">
          {label}
          {required ? (
            <span className="text-status-cancelled ml-1" aria-hidden="true">
              *
            </span>
          ) : null}
        </legend>

        <div className="flex flex-wrap gap-2" role="radiogroup">
          {options.map((option) => {
            const isChecked = defaultValue === option.value;
            const optionId = `${name}-${option.value.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;

            return (
              <label
                key={option.value}
                htmlFor={optionId}
                className="relative inline-flex items-center cursor-pointer"
              >
                <input
                  type="radio"
                  id={optionId}
                  name={name}
                  value={option.value}
                  defaultChecked={isChecked}
                  required={required}
                  onChange={(e) => {
                    if (e.target.checked && onChange) {
                      onChange(option.value);
                    }
                  }}
                  className="peer sr-only"
                />
                <span className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium border transition-colors border-guest-border-subtle bg-guest-surface-raised text-guest-text-secondary hover:bg-guest-surface-sunken peer-checked:border-guest-brand peer-checked:bg-guest-brand peer-checked:text-guest-brand-contrast peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
                  {option.label}
                </span>
              </label>
            );
          })}
        </div>

        {errorText ? (
          <p
            id={`${name}-error`}
            role="alert"
            className="text-[13px] leading-[18px] text-status-cancelled mt-1"
          >
            {errorText}
          </p>
        ) : helperText ? (
          <p
            id={`${name}-helper`}
            className="text-[13px] leading-[18px] text-guest-text-muted mt-1"
          >
            {helperText}
          </p>
        ) : null}
      </fieldset>
    );
  }

  // Multi-select chips (Checkboxes rendered as interactive chips)
  if (type === "multi-select") {
    const defaultValuesArray = Array.isArray(defaultValue)
      ? defaultValue
      : defaultValue
        ? [defaultValue]
        : [];

    return (
      <fieldset
        className="flex flex-col gap-2"
        aria-describedby={describedBy}
        aria-invalid={errorText ? true : undefined}
      >
        <legend className="select-none text-[13px] font-semibold leading-[18px] text-guest-text-secondary mb-1">
          {label}
          {required ? (
            <span className="text-status-cancelled ml-1" aria-hidden="true">
              *
            </span>
          ) : null}
        </legend>

        <div className="flex flex-wrap gap-2" role="group">
          {options.map((option) => {
            const isChecked = defaultValuesArray.includes(option.value);
            const optionId = `${name}-${option.value.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;

            return (
              <label
                key={option.value}
                htmlFor={optionId}
                className="relative inline-flex items-center cursor-pointer"
              >
                <input
                  type="checkbox"
                  id={optionId}
                  name={`${name}[]`}
                  value={option.value}
                  defaultChecked={isChecked}
                  className="peer sr-only"
                />
                <span className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium border transition-colors border-guest-border-subtle bg-guest-surface-raised text-guest-text-secondary hover:bg-guest-surface-sunken peer-checked:border-guest-brand peer-checked:bg-guest-brand peer-checked:text-guest-brand-contrast peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
                  {option.label}
                </span>
              </label>
            );
          })}
        </div>

        {errorText ? (
          <p
            id={`${name}-error`}
            role="alert"
            className="text-[13px] leading-[18px] text-status-cancelled mt-1"
          >
            {errorText}
          </p>
        ) : helperText ? (
          <p
            id={`${name}-helper`}
            className="text-[13px] leading-[18px] text-guest-text-muted mt-1"
          >
            {helperText}
          </p>
        ) : null}
      </fieldset>
    );
  }

  // Textarea input
  if (type === "textarea") {
    return (
      <Textarea
        id={name}
        name={name}
        label={
          <span>
            {label}
            {required ? (
              <span className="text-status-cancelled ml-1" aria-hidden="true">
                *
              </span>
            ) : null}
          </span>
        }
        placeholder={placeholder}
        required={required}
        rows={3}
        defaultValue={defaultValue as string | undefined}
        error={errorText}
        helper={helperText}
      />
    );
  }

  // Time input
  if (type === "time") {
    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={name}
          className="select-none text-[13px] font-semibold leading-[18px] text-guest-text-secondary"
        >
          {label}
          {required ? (
            <span className="text-status-cancelled ml-1" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
        <input
          type="time"
          id={name}
          name={name}
          required={required}
          defaultValue={defaultValue as string | undefined}
          aria-invalid={errorText ? true : undefined}
          aria-describedby={describedBy}
          className="block w-full rounded-md border border-guest-border-subtle bg-guest-surface-raised px-3 py-2 text-[16px] leading-[24px] text-guest-text-primary placeholder:text-guest-text-muted outline-none focus:border-ring focus:ring-0 focus-visible:outline-none aria-[invalid=true]:border-status-cancelled"
        />
        {errorText ? (
          <p
            id={`${name}-error`}
            role="alert"
            className="text-[13px] leading-[18px] text-status-cancelled"
          >
            {errorText}
          </p>
        ) : helperText ? (
          <p
            id={`${name}-helper`}
            className="text-[13px] leading-[18px] text-guest-text-muted"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }

  // Photo input (captures file input, parent reads filename only)
  if (type === "photo") {
    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={name}
          className="select-none text-[13px] font-semibold leading-[18px] text-guest-text-secondary"
        >
          {label}
          {required ? (
            <span className="text-status-cancelled ml-1" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
        <input
          type="file"
          id={name}
          name={name}
          accept="image/*"
          required={required}
          aria-invalid={errorText ? true : undefined}
          aria-describedby={describedBy}
          className="block w-full text-sm text-guest-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-guest-surface-sunken file:text-guest-text-primary hover:file:bg-guest-border-subtle cursor-pointer focus-visible:outline-none aria-[invalid=true]:border-status-cancelled"
        />
        {errorText ? (
          <p
            id={`${name}-error`}
            role="alert"
            className="text-[13px] leading-[18px] text-status-cancelled"
          >
            {errorText}
          </p>
        ) : helperText ? (
          <p
            id={`${name}-helper`}
            className="text-[13px] leading-[18px] text-guest-text-muted"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }

  // Standard text input
  return (
    <Input
      id={name}
      name={name}
      type="text"
      label={
        <span>
          {label}
          {required ? (
            <span className="text-status-cancelled ml-1" aria-hidden="true">
              *
            </span>
          ) : null}
        </span>
      }
      placeholder={placeholder}
      required={required}
      defaultValue={defaultValue as string | undefined}
      error={errorText}
      helper={helperText}
    />
  );
}

