import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, X, Check } from "@untitledui/icons";

export interface MultiSelectOption {
  value: string;
  label: string;
  color?: string;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({ options, value, onChange, placeholder = "Select options...", className }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const handleRemoveOption = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== optionValue));
  };

  const selectedOptions = options.filter(option => value.includes(option.value));

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <div
        className={cn(
          "flex items-center justify-between min-h-[40px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm cursor-pointer transition-colors",
          "hover:border-gray-400 focus-within:border-navy-500 focus-within:ring-2 focus-within:ring-navy-500/20",
          isOpen && "border-navy-500 ring-2 ring-navy-500/20"
        )}
        onClick={() => setIsOpen(!isOpen)}
        data-testid="multi-select-trigger"
      >
        <div className="flex-1 min-w-0">
          {selectedOptions.length === 0 ? (
            <span className="text-gray-500">{placeholder}</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {selectedOptions.map((option) => (
                <span
                  key={option.value}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-navy-100 text-navy-800 max-w-[120px]"
                >
                  <span className="truncate">{option.label}</span>
                  <button
                    onClick={(e) => handleRemoveOption(option.value, e)}
                    className="ml-1 text-navy-600 hover:text-navy-800 flex-shrink-0"
                    data-testid={`remove-option-${option.value}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", isOpen && "rotate-180")} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="py-1">
            {options.map((option) => {
              const isSelected = value.includes(option.value);
              return (
                <div
                  key={option.value}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors",
                    "hover:bg-gray-50",
                    isSelected && "bg-navy-50"
                  )}
                  onClick={() => handleToggleOption(option.value)}
                  data-testid={`option-${option.value}`}
                >
                  <div className="flex items-center space-x-2">
                    <span className={cn("font-medium", option.color || "text-gray-900")}>
                      {option.label}
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-navy-600" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}