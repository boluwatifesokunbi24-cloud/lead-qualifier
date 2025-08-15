import { CheckIcon } from "@heroicons/react/24/solid";

interface ProgressIndicatorProps {
  currentStep: 1 | 2 | 3 | 4;
}

export function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  const steps = [
    { number: 1, label: "Business Setup" },
    { number: 2, label: "Upload Data" },
    { number: 3, label: "AI Processing" },
    { number: 4, label: "Results" }
  ];

  return (
    <div className="flex items-center justify-center space-x-8" data-testid="progress-indicator">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className="flex items-center" data-testid={`step-indicator-${step.number}`}>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                step.number < currentStep
                  ? "bg-forest-600 text-white"
                  : step.number === currentStep
                  ? "bg-navy-600 text-white"
                  : "bg-gray-200 text-gray-400"
              }`}
            >
              {step.number < currentStep ? (
                <CheckIcon className="w-6 h-6" />
              ) : (
                step.number
              )}
            </div>
            <span
              className={`ml-3 text-sm font-medium transition-colors duration-300 ${
                step.number < currentStep
                  ? "text-forest-600"
                  : step.number === currentStep
                  ? "text-navy-600"
                  : "text-gray-400"
              }`}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className="flex-1 h-1 bg-gray-200 mx-4">
              <div
                className={`h-full transition-all duration-500 ease-in-out ${
                  step.number < currentStep ? "bg-forest-600" : "bg-gray-200"
                }`}
                style={{ width: step.number < currentStep ? "100%" : "0%" }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
