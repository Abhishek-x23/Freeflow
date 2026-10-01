import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load tickets',
  message = 'An unexpected server or network error occurred. Please try again.',
  onRetry,
}) => {
  return (
    <div className="py-12 px-4 text-center max-w-sm mx-auto flex flex-col items-center">
      <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-3">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      <p className="text-xs text-zinc-500 mt-1 mb-4 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="h-8 inline-flex items-center gap-1.5 px-3 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Retry request</span>
        </button>
      )}
    </div>
  );
};
