import React from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { ProcessingStep } from '../types';

interface StepIndicatorProps {
  steps: ProcessingStep[];
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ steps }) => {
  return (
    <div className="space-y-4">
      {steps.map((step, idx) => (
        <div key={step.id} className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {step.status === 'completed' ? (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            ) : step.status === 'processing' ? (
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            ) : (
              <Circle className="w-6 h-6 text-slate-300" />
            )}
          </div>
          <span className={`text-sm font-medium ${
            step.status === 'processing' ? 'text-blue-600' :
            step.status === 'completed' ? 'text-slate-700' : 'text-slate-400'
          }`}>
            {step.label}
          </span>
          {idx < steps.length - 1 && (
            <div className={`absolute left-6 ml-[3px] h-4 w-0.5 bg-slate-200 -z-10`} style={{marginTop: '24px'}} />
          )}
        </div>
      ))}
    </div>
  );
};

export default StepIndicator;
