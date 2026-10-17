import React from "react";

interface DateTimeInputProps {
    id?: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
}

// Native datetime-local input styled with DESIGN.md tokens: ghost border
// that transitions to primary_container on focus, label-md typography.
// No extra bundle cost, native a11y (label + keyboard).
export const DateTimeInput: React.FC<DateTimeInputProps> = ({
    id,
    label,
    value,
    onChange,
    error,
}) => {
    return (
        <div className="flex flex-col gap-1">
            <label
                htmlFor={id}
                className="text-xs font-medium text-on-surface-variant label-md"
            >
                {label}
            </label>
            <input
                id={id}
                type="datetime-local"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`bg-surface-container-lowest rounded-xl px-4 py-3 text-sm text-on-surface
          outline outline-1 outline-transparent transition-colors
          focus:outline-primary-container focus:outline-2
          ${error ? "outline-[#e53935]" : "outline-outline-variant/15"}`}
            />
            {error && (
                <p className="text-xs text-[#e53935] font-medium">{error}</p>
            )}
        </div>
    );
};
