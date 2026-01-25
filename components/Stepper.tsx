'use client';

interface StepperProps {
  currentStep: number;
  totalSteps: number;
}

export default function Stepper({ currentStep, totalSteps }: StepperProps) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
          const isActive = step === currentStep;
          const isCompleted = step < currentStep;
          
          return (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                    isActive
                      ? 'bg-primary-600 text-white scale-110'
                      : isCompleted
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted ? '✓' : step}
                </div>
                <div className={`mt-2 text-xs text-center ${
                  isActive ? 'text-primary-600 font-semibold' : 'text-gray-500'
                }`}>
                  Step {step}
                </div>
              </div>
              {step < totalSteps && (
                <div
                  className={`h-1 flex-1 mx-2 ${
                    isCompleted ? 'bg-primary-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
