import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, Upload01, Zap, BarChart03, Settings01 } from "@untitledui/icons";

export interface StepperStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export interface ProgressStepperProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: StepperStep[];
  currentStep: number;
  completedSteps?: number[];
}

const ProgressStepper = forwardRef<HTMLDivElement, ProgressStepperProps>(
  ({ steps, currentStep, completedSteps = [], className, ...props }, ref) => {
    const isStepCompleted = (stepId: number) => completedSteps.includes(stepId);
    const isStepCurrent = (stepId: number) => stepId === currentStep;
    const isStepUpcoming = (stepId: number) => stepId > currentStep && !isStepCompleted(stepId);

    return (
      <div
        ref={ref}
        className={cn("w-full py-6", className)}
        data-testid="progress-stepper"
        {...props}
      >
        <nav aria-label="Progress">
          <ol className="flex items-center justify-between space-x-2 sm:space-x-4">
            {steps.map((step, index) => {
              const isCompleted = isStepCompleted(step.id);
              const isCurrent = isStepCurrent(step.id);
              const isUpcoming = isStepUpcoming(step.id);

              return (
                <li key={step.id} className="flex-1 min-w-0">
                  <div className="group flex flex-col items-center">
                    {/* Step Circle */}
                    <div className="relative">
                      <div
                        className={cn(
                          "flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 transition-all duration-200",
                          {
                            // Completed step
                            "bg-green-600 border-green-600 text-white": isCompleted,
                            // Current step
                            "bg-navy-600 border-navy-600 text-white ring-4 ring-navy-200": isCurrent,
                            // Upcoming step
                            "bg-white border-gray-300 text-gray-400": isUpcoming,
                          }
                        )}
                        data-testid={`step-circle-${step.id}`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                        ) : (
                          <span className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                            {step.icon}
                          </span>
                        )}
                      </div>

                      {/* Connection Line */}
                      {index < steps.length - 1 && (
                        <div
                          className={cn(
                            "absolute top-5 sm:top-6 left-full w-full h-0.5 transition-all duration-200 hidden sm:block",
                            "transform translate-x-2",
                            {
                              "bg-green-600": isCompleted || currentStep > step.id,
                              "bg-gray-300": currentStep <= step.id,
                            }
                          )}
                        />
                      )}
                    </div>

                    {/* Step Info */}
                    <div className="mt-3 text-center max-w-24 sm:max-w-32">
                      <div
                        className={cn(
                          "text-xs sm:text-sm font-medium transition-colors duration-200",
                          {
                            "text-green-600": isCompleted,
                            "text-navy-600": isCurrent,
                            "text-gray-500": isUpcoming,
                          }
                        )}
                        data-testid={`step-title-${step.id}`}
                      >
                        {step.title}
                      </div>
                      <div
                        className={cn(
                          "text-xs text-gray-500 mt-1 hidden sm:block",
                          {
                            "text-green-500": isCompleted,
                            "text-navy-500": isCurrent,
                          }
                        )}
                        data-testid={`step-description-${step.id}`}
                      >
                        {step.description}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    );
  }
);

ProgressStepper.displayName = "ProgressStepper";

export { ProgressStepper };