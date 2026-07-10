import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

interface DateInputProps {
  value: string; // ISO format (yyyy-mm-dd)
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  id?: string;
}

export function DateInput({ value, onChange, className, placeholder = "DD/MM/AAAA", id }: DateInputProps) {
  const [displayValue, setDisplayValue] = useState("");
  const [error, setError] = useState(false);

  // Convert yyyy-mm-dd to dd/mm/yyyy for display
  useEffect(() => {
    if (!value) {
      setDisplayValue("");
      setError(false);
      return;
    }
    const parts = value.split("-");
    if (parts.length === 3) {
      setDisplayValue(`${parts[2]}/${parts[1]}/${parts[0]}`);
      setError(false);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value.replace(/\D/g, ""); // Keep only digits
    if (rawValue.length > 8) {
      rawValue = rawValue.slice(0, 8);
    }

    // Format as DD/MM/YYYY
    let formatted = rawValue;
    if (rawValue.length > 2 && rawValue.length <= 4) {
      formatted = `${rawValue.slice(0, 2)}/${rawValue.slice(2)}`;
    } else if (rawValue.length > 4) {
      formatted = `${rawValue.slice(0, 2)}/${rawValue.slice(2, 4)}/${rawValue.slice(4)}`;
    }

    setDisplayValue(formatted);
    setError(false);

    // If fully typed, convert to yyyy-mm-dd and call onChange
    if (rawValue.length === 8) {
      const day = rawValue.slice(0, 2);
      const month = rawValue.slice(2, 4);
      const year = rawValue.slice(4);
      const iso = `${year}-${month}-${day}`;
      // Basic validation
      const d = new Date(iso);
      if (!isNaN(d.getTime()) && iso.startsWith(year) && Number(month) >= 1 && Number(month) <= 12 && Number(day) >= 1 && Number(day) <= 31) {
        onChange(iso);
      } else {
        setError(true);
      }
    }
  };

  return (
    <div className="relative w-full">
      <Input
        id={id}
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`${className || ""} ${error ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20" : ""}`}
        maxLength={10}
      />
      {error && (
        <div className="absolute -bottom-5 left-0 right-0 text-[9px] text-amber-600 dark:text-amber-400 whitespace-nowrap">
          Data inválida
        </div>
      )}
    </div>
  );
}
