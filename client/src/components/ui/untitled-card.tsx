import { forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface UntitledCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outlined" | "elevated" | "ghost";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  children?: ReactNode;
}

export interface UntitledCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export interface UntitledCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export interface UntitledCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

const cardVariants = {
  default: "bg-white border border-gray-200 shadow-sm",
  outlined: "bg-white border border-gray-200",
  elevated: "bg-white border border-gray-200 shadow-lg",
  ghost: "bg-transparent",
};

const cardPadding = {
  none: "p-0",
  sm: "p-4",
  md: "p-6", 
  lg: "p-8",
  xl: "p-10",
};

const UntitledCard = forwardRef<HTMLDivElement, UntitledCardProps>(
  ({ variant = "default", padding = "md", className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg",
          cardVariants[variant],
          padding !== "none" && cardPadding[padding],
          className
        )}
        data-testid="untitled-card"
        {...props}
      >
        {children}
      </div>
    );
  }
);

const UntitledCardHeader = forwardRef<HTMLDivElement, UntitledCardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 pb-4", className)}
        data-testid="untitled-card-header"
        {...props}
      >
        {children}
      </div>
    );
  }
);

const UntitledCardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn("text-lg font-semibold leading-tight text-gray-900", className)}
        data-testid="untitled-card-title"
        {...props}
      >
        {children}
      </h3>
    );
  }
);

const UntitledCardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn("text-sm text-gray-600 leading-relaxed", className)}
        data-testid="untitled-card-description"
        {...props}
      >
        {children}
      </p>
    );
  }
);

const UntitledCardContent = forwardRef<HTMLDivElement, UntitledCardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("text-sm", className)}
        data-testid="untitled-card-content"
        {...props}
      >
        {children}
      </div>
    );
  }
);

const UntitledCardFooter = forwardRef<HTMLDivElement, UntitledCardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-between pt-4", className)}
        data-testid="untitled-card-footer"
        {...props}
      >
        {children}
      </div>
    );
  }
);

UntitledCard.displayName = "UntitledCard";
UntitledCardHeader.displayName = "UntitledCardHeader";
UntitledCardTitle.displayName = "UntitledCardTitle";
UntitledCardDescription.displayName = "UntitledCardDescription";
UntitledCardContent.displayName = "UntitledCardContent";
UntitledCardFooter.displayName = "UntitledCardFooter";

export { 
  UntitledCard, 
  UntitledCardHeader, 
  UntitledCardTitle,
  UntitledCardDescription,
  UntitledCardContent, 
  UntitledCardFooter 
};