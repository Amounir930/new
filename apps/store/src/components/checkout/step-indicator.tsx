'use client';

/**
 * ── STEP INDICATOR ──
 * Visual progress bar showing current checkout step.
 */
export function StepIndicator({
  steps,
  currentStep,
}: {
  steps: Array<{ key: string; label: string }>;
  currentStep: number;
}) {
  return (
    <nav aria-label="Checkout progress">
      <ol className="flex items-center gap-2">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <li key={step.key} className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors ${
                  isCompleted
                    ? 'bg-black text-white'
                    : isCurrent
                      ? 'bg-black text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? '✓' : index + 1}
              </div>
              <span
                className={`text-sm font-medium ${
                  isCurrent ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div
                  className={`w-8 h-px ${
                    isCompleted ? 'bg-black' : 'bg-gray-200'
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
