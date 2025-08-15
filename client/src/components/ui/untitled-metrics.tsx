import { forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendUp01, TrendDown01 } from "@untitledui/icons";

export interface UntitledMetricProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "increase" | "decrease" | "neutral";
  period?: string;
  icon?: ReactNode;
  variant?: "simple" | "with-icon" | "with-chart";
  size?: "sm" | "md" | "lg";
  action?: ReactNode;
  chart?: ReactNode;
}

const metricSizes = {
  sm: {
    container: "p-4",
    title: "text-xs font-medium text-gray-600",
    value: "text-2xl font-semibold text-gray-900 mt-1",
    change: "text-xs",
    period: "text-xs text-gray-500",
  },
  md: {
    container: "p-6", 
    title: "text-sm font-medium text-gray-600",
    value: "text-3xl font-semibold text-gray-900 mt-2",
    change: "text-sm",
    period: "text-sm text-gray-500",
  },
  lg: {
    container: "p-8",
    title: "text-base font-medium text-gray-600", 
    value: "text-4xl font-semibold text-gray-900 mt-3",
    change: "text-base",
    period: "text-base text-gray-500",
  },
};

const changeStyles = {
  increase: "text-green-600",
  decrease: "text-red-600", 
  neutral: "text-gray-600",
};

const UntitledMetric = forwardRef<HTMLDivElement, UntitledMetricProps>(
  (
    {
      title,
      value,
      change,
      changeType = "neutral",
      period,
      icon,
      variant = "simple",
      size = "md",
      action,
      chart,
      className,
      ...props
    },
    ref
  ) => {
    const sizeStyles = metricSizes[size];
    const changeColor = changeStyles[changeType];

    const renderChangeIcon = () => {
      if (changeType === "increase") {
        return <TrendUp01 className="w-4 h-4 text-green-600" />;
      }
      if (changeType === "decrease") {
        return <TrendDown01 className="w-4 h-4 text-red-600" />;
      }
      return null;
    };

    return (
      <div
        ref={ref}
        className={cn(
          "bg-white rounded-lg border border-gray-200 shadow-sm",
          sizeStyles.container,
          className
        )}
        data-testid="untitled-metric"
        {...props}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {variant !== "simple" && icon && (
                <div className="flex-shrink-0">
                  {typeof icon === 'function' ? (
                    <span className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-lg">
                      {icon}
                    </span>
                  ) : (
                    icon
                  )}
                </div>
              )}
              <p className={cn(sizeStyles.title, "truncate")}>{title}</p>
            </div>
          </div>
          
          {action && (
            <div className="flex-shrink-0 ml-4">
              {action}
            </div>
          )}
        </div>

        {/* Main Value */}
        <div className="mt-3">
          <p className={sizeStyles.value}>{value}</p>
          
          {/* Change Indicator */}
          {change && (
            <div className="flex items-center gap-1 mt-2">
              {renderChangeIcon()}
              <span className={cn(sizeStyles.change, changeColor)}>
                {change}
              </span>
              {period && (
                <span className={sizeStyles.period}>
                  {period}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Chart */}
        {variant === "with-chart" && chart && (
          <div className="mt-4">
            {chart}
          </div>
        )}
      </div>
    );
  }
);

// Metrics Group Component for dashboard layouts
export interface UntitledMetricsGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  metrics: UntitledMetricProps[];
  columns?: 1 | 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
}

const UntitledMetricsGroup = forwardRef<HTMLDivElement, UntitledMetricsGroupProps>(
  ({ metrics, columns = 3, gap = "md", className, ...props }, ref) => {
    const gridCols = {
      1: "grid-cols-1",
      2: "grid-cols-1 sm:grid-cols-2",
      3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    };

    const gridGap = {
      sm: "gap-4",
      md: "gap-6",
      lg: "gap-8",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "grid",
          gridCols[columns],
          gridGap[gap],
          className
        )}
        data-testid="untitled-metrics-group"
        {...props}
      >
        {metrics.map((metric, index) => (
          <UntitledMetric
            key={`metric-${index}`}
            {...metric}
          />
        ))}
      </div>
    );
  }
);

UntitledMetric.displayName = "UntitledMetric";
UntitledMetricsGroup.displayName = "UntitledMetricsGroup";

export { UntitledMetric, UntitledMetricsGroup };