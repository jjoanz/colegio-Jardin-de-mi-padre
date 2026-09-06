"use client";

import { useState } from "react";

export function PasswordInput({
  name,
  id,
  required,
  minLength,
  defaultValue,
  className = "",
  placeholder,
  autoComplete,
}: {
  name: string;
  id?: string;
  required?: boolean;
  minLength?: number;
  defaultValue?: string;
  className?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        name={name}
        id={id}
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`${className} pr-10`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        tabIndex={-1}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
      >
        {visible ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path
              d="M3 3l18 18M10.58 10.58a2 2 0 0 0 2.83 2.83M9.88 4.24A9.77 9.77 0 0 1 12 4c5 0 9 4 10 8-.36 1.28-1 2.5-1.85 3.55M6.42 6.42C4.3 7.86 2.7 9.86 2 12c1 4 5 8 10 8 1.3 0 2.53-.24 3.65-.68"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path
              d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
