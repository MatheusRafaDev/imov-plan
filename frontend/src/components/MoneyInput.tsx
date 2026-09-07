"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> & {
  value: number | "";
  onChange: (value: number | "") => void;
  variant?: "money" | "decimal" | "percent";
  decimals?: number;
  min?: number;
  max?: number;
  errorMessage?: string;
};

const fmt = (n: number | "", decimals: number) => {
  const val = n === "" ? 0 : (isFinite(n as number) ? n as number : 0);
  return val.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const MoneyInput = React.forwardRef<HTMLInputElement, Props>(
  ({ value, onChange, variant = "money", decimals, className, onFocus, onBlur, placeholder, min, max, errorMessage, ...rest }, ref) => {
    const dec = decimals ?? (variant === "money" ? 2 : variant === "percent" ? 2 : 2);
    
    // State of the formatted text inside the input
    const [text, setText] = React.useState(() => fmt(value, dec));
    const [focused, setFocused] = React.useState(false);
    const [touched, setTouched] = React.useState(false);

    // Sync input text with prop value when external changes happen or on blur
    React.useEffect(() => {
      if (!focused) {
        setText(fmt(value, dec));
      }
    }, [value, focused, dec]);

    // Validation checks
    const hasMinError = min !== undefined && touched && value !== "" && value < min;
    const hasMaxError = max !== undefined && touched && value !== "" && value > max;
    const hasError = hasMinError || hasMaxError;

    const getErrorMessage = () => {
      if (errorMessage) return errorMessage;
      if (hasMinError) {
        if (variant === "money") return `Mínimo: R$ ${fmt(min!, dec)}`;
        if (variant === "percent") return `Mínimo: ${fmt(min!, dec)}%`;
        return `Mínimo: ${fmt(min!, dec)}`;
      }
      if (hasMaxError) {
        if (variant === "money") return `Máximo: R$ ${fmt(max!, dec)}`;
        if (variant === "percent") return `Máximo: ${fmt(max!, dec)}%`;
        return `Máximo: ${fmt(max!, dec)}`;
      }
      return null;
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      const target = e.target;
      requestAnimationFrame(() => {
        target.select();
      });
      onFocus?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      
      // Extract only digits to build our PT-BR right-to-left mask
      let digits = raw.replace(/\D/g, "");
      
      // Clear leading zeros to keep numbers standard
      if (digits.length > 1) {
        digits = digits.replace(/^0+/, "");
      }
      
      if (!digits) {
        setText(fmt(0, dec));
        onChange(0);
        return;
      }

      let parsed = 0;
      if (dec > 0) {
        // Pad with leading zeros so decimal calculation works correctly
        while (digits.length < dec + 1) {
          digits = "0" + digits;
        }
        parsed = parseInt(digits, 10) / Math.pow(10, dec);
      } else {
        parsed = parseInt(digits, 10);
      }

      // Live formatted text for standard PT-BR feedback
      const formatted = fmt(parsed, dec);
      setText(formatted);
      onChange(Math.max(0, parsed));
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      setTouched(true);
      
      let n = value === "" ? 0 : value;
      if (min !== undefined && n < min) n = min;
      if (max !== undefined && n > max) n = max;
      const clamped = Math.max(0, n);
      onChange(clamped);
      setText(fmt(clamped, dec));
      
      onBlur?.(e);
    };

    return (
      <div className="relative w-full">
        {variant === "money" && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-base md:text-sm font-medium">
            R$
          </span>
        )}
        {variant === "percent" && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-base md:text-sm font-medium">
            %
          </span>
        )}
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          placeholder={placeholder}
          className={cn(
            "num text-right font-medium",
            variant === "money" && "pl-9",
            variant === "percent" && "pr-8",
            hasError && "input-error border-destructive focus-visible:ring-destructive",
            className,
          )}
          value={text}
          onFocus={handleFocus}
          onChange={handleChange}
          onBlur={handleBlur}
          {...rest}
        />
        {hasError && (
          <p className="text-xs text-destructive mt-1 animate-fade-in-up" style={{ animationDuration: "0.2s" }}>
            {getErrorMessage()}
          </p>
        )}
      </div>
    );
  },
);
MoneyInput.displayName = "MoneyInput";
