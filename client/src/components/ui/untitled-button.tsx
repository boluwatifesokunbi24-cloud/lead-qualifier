import { forwardRef, ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface UntitledButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 
    | "primary" 
    | "secondary" 
    | "tertiary"
    | "primary-destructive"
    | "secondary-destructive" 
    | "tertiary-destructive"
    | "link-gray"
    | "link-color";
  size?: "sm" | "md" | "lg" | "xl";
  iconLeading?: ReactNode;
  iconTrailing?: ReactNode;
  isLoading?: boolean;
  showTextWhileLoading?: boolean;
  isDisabled?: boolean;
  href?: string;
  children?: ReactNode;
}

const buttonVariants = {
  primary: "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700 focus:ring-blue-600 shadow-sm",
  secondary: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-800 focus:ring-blue-600 shadow-sm",
  tertiary: "bg-transparent text-gray-700 border-transparent hover:bg-gray-50 focus:ring-blue-600",
  "primary-destructive": "bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700 focus:ring-red-600 shadow-sm",
  "secondary-destructive": "bg-white text-red-700 border-red-300 hover:bg-red-50 hover:text-red-800 focus:ring-red-600 shadow-sm",
  "tertiary-destructive": "bg-transparent text-red-700 border-transparent hover:bg-red-50 focus:ring-red-600",
  "link-gray": "bg-transparent text-gray-500 border-transparent hover:text-gray-700 focus:ring-blue-600 p-0",
  "link-color": "bg-transparent text-blue-600 border-transparent hover:text-blue-700 focus:ring-blue-600 p-0",
};

const buttonSizes = {
  sm: "px-3 py-2 text-sm rounded-md",
  md: "px-4 py-2.5 text-sm rounded-md", 
  lg: "px-4 py-2.5 text-base rounded-md",
  xl: "px-6 py-3 text-base rounded-md",
};

const iconSizes = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-5 h-5", 
  xl: "w-6 h-6",
};

const UntitledButton = forwardRef<HTMLButtonElement, UntitledButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      iconLeading,
      iconTrailing,
      isLoading = false,
      showTextWhileLoading = true,
      isDisabled = false,
      href,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
    
    const variantStyles = buttonVariants[variant];
    const sizeStyles = buttonSizes[size];
    const iconSize = iconSizes[size];

    const renderIcon = (icon: ReactNode, position: "leading" | "trailing") => {
      if (!icon) return null;
      
      if (typeof icon === 'function') {
        const IconComponent = icon as (props: { className: string }) => ReactElement;
        return <IconComponent className={iconSize} />;
      }
      
      return <span className={iconSize}>{icon}</span>;
    };

    const LoadingSpinner = () => (
      <svg className={cn("animate-spin", iconSize)} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    );

    const content = (
      <>
        {isLoading ? <LoadingSpinner /> : renderIcon(iconLeading, "leading")}
        {children && (showTextWhileLoading || !isLoading) && (
          <span>{children}</span>
        )}
        {!isLoading && renderIcon(iconTrailing, "trailing")}
      </>
    );

    const classes = cn(
      baseStyles,
      variantStyles,
      sizeStyles,
      {
        "cursor-not-allowed": isDisabled || isLoading,
        "pointer-events-none": isLoading,
      },
      className
    );

    if (href && !isDisabled && !isLoading) {
      return (
        <a href={href} className={classes} data-testid="untitled-button">
          {content}
        </a>
      );
    }

    return (
      <button
        ref={ref}
        className={classes}
        disabled={isDisabled || isLoading}
        data-testid="untitled-button"
        {...props}
      >
        {content}
      </button>
    );
  }
);

UntitledButton.displayName = "UntitledButton";

export { UntitledButton };