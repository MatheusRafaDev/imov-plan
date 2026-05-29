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

  // Convert yyyy-mm-dd to dd/mm/yyyy for display
  useEffect(() => {
    if (!value) {
      setDisplayValue("");
      return;
    }
    const parts = value.split("-");
    if (parts.length === 3) {
      setDisplayValue(`${parts[2]}/${parts[1]}/${parts[0]}`);
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

    // If fully typed, convert to yyyy-mm-dd and call onChange
    if (rawValue.length === 8) {
      const day = rawValue.slice(0, 2);
      const month = rawValue.slice(2, 4);
      const year = rawValue.slice(4);
      const iso = `${year}-${month}-${day}`;
      // Basic validation
      const d = new Date(iso);
      if (!isNaN(d.getTime())) {
        onChange(iso);
      }
    } else {
      // If incomplete, don't update the parent state yet, or pass empty to clear it
      if (value) {
        onChange("");
      }
    }
  };

  return (
    <Input
      id={id}
      type="text"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      maxLength={10}
    />
  );
}
