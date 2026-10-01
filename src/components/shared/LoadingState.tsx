import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading tickets...',
}) => {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center">
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{message}</p>
      <p className="text-xs text-slate-400 mt-1">Retrieving live records from in-memory database</p>
    </div>
  );
};
