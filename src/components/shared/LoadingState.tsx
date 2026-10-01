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
      <Loader2 className="w-6 h-6 text-blue-600 animate-spin mb-2.5" />
      <p className="text-xs font-medium text-zinc-700">{message}</p>
      <p className="text-[11px] text-zinc-400 mt-0.5">Fetching from in-memory database</p>
    </div>
  );
};
