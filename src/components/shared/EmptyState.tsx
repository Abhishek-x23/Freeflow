import React from 'react';
import { Inbox, RotateCcw } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  onResetFilters?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No tickets match your filters',
  description = 'Try adjusting your search criteria, clearing active filters, or check back later.',
  onResetFilters,
}) => {
  return (
    <div className="py-16 px-4 text-center max-w-sm mx-auto flex flex-col items-center">
      <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center mb-3">
        <Inbox className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      <p className="text-xs text-zinc-500 mt-1 mb-4 leading-relaxed">
        {description}
      </p>
      {onResetFilters && (
        <button
          onClick={onResetFilters}
          className="h-8 inline-flex items-center gap-1.5 px-3 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset filters</span>
        </button>
      )}
    </div>
  );
};
