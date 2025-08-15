import { forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface UntitledTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
  error?: string;
  hint?: string;
  size?: "sm" | "md" | "lg";
  resize?: "none" | "vertical" | "horizontal" | "both";
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
  isInvalid?: boolean;
  showCharacterCount?: boolean;
  maxLength?: number;
  autoResize?: boolean;
}

const textareaSizes = {
  sm: "px-3 py-2 text-sm min-h-[80px]",
  md: "px-3 py-2.5 text-sm min-h-[100px]", 
  lg: "px-4 py-3 text-base min-h-[120px]",
};

const resizeOptions = {
  none: "resize-none",
  vertical: "resize-y",
  horizontal: "resize-x", 
  both: "resize",
};

const UntitledTextarea = forwardRef<HTMLTextAreaElement, UntitledTextareaProps>(
  (
    {
      label,
      description,
      error,
      hint,
      size = "md",
      resize = "vertical",
      leftAddon,
      rightAddon,
      isInvalid = false,
      showCharacterCount = false,
      maxLength,
      autoResize = false,
      className,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const hasError = isInvalid || !!error;
    const characterCount = typeof value === 'string' ? value.length : 0;
    
    const baseStyles = "w-full rounded-md border bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
    const sizeStyles = textareaSizes[size];
    const resizeStyles = autoResize ? "resize-none" : resizeOptions[resize];
    
    const borderStyles = hasError
      ? "border-red-300 focus:border-red-500 focus:ring-red-600"
      : "border-gray-300 focus:border-blue-500 focus:ring-blue-600";

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize) {
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
      }
      onChange?.(e);
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        {description && (
          <p className="text-sm text-gray-600 mb-2">{description}</p>
        )}

        <div className="relative">
          {leftAddon && (
            <div className="absolute left-3 top-3 text-gray-500">
              {leftAddon}
            </div>
          )}
          
          <textarea
            ref={ref}
            className={cn(
              baseStyles,
              sizeStyles,
              resizeStyles,
              borderStyles,
              leftAddon && "pl-10",
              rightAddon && "pr-10",
              className
            )}
            value={value}
            onChange={handleChange}
            maxLength={maxLength}
            data-testid="untitled-textarea"
            {...props}
          />
          
          {rightAddon && (
            <div className="absolute right-3 top-3 text-gray-500">
              {rightAddon}
            </div>
          )}
        </div>

        <div className="flex justify-between items-start mt-1.5">
          <div className="flex-1">
            {error && (
              <p className="text-sm text-red-600" data-testid="textarea-error">
                {error}
              </p>
            )}
            
            {hint && !error && (
              <p className="text-sm text-gray-500" data-testid="textarea-hint">
                {hint}
              </p>
            )}
          </div>
          
          {showCharacterCount && maxLength && (
            <p className={cn(
              "text-xs ml-4 flex-shrink-0",
              characterCount > maxLength * 0.9 
                ? "text-red-600" 
                : "text-gray-500"
            )} data-testid="character-count">
              {characterCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

UntitledTextarea.displayName = "UntitledTextarea";

export { UntitledTextarea };