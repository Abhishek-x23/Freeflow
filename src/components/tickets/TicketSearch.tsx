import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setSearchQuery } from '../../features/tickets/ticketSlice';
import { selectFilters } from '../../features/tickets/ticketSelectors';
import { Search, X } from 'lucide-react';

interface TicketSearchProps {
  onSearchDebounced?: (query: string) => void;
}

export const TicketSearch: React.FC<TicketSearchProps> = ({ onSearchDebounced }) => {
  const dispatch = useAppDispatch();
  const currentQuery = useAppSelector(selectFilters).search || '';
  const [localValue, setLocalValue] = useState(currentQuery);

  // Sync from Redux if external reset happens
  useEffect(() => {
    setLocalValue(currentQuery);
  }, [currentQuery]);

  // Debounced dispatch to Redux and parent callback
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localValue !== currentQuery) {
        dispatch(setSearchQuery(localValue));
        if (onSearchDebounced) {
          onSearchDebounced(localValue);
        }
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [localValue, currentQuery, dispatch, onSearchDebounced]);

  const handleClear = () => {
    setLocalValue('');
    dispatch(setSearchQuery(''));
    if (onSearchDebounced) {
      onSearchDebounced('');
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder="Search tickets by subject, body, or ID..."
        className="w-full pl-9 pr-9 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          aria-label="Clear search query"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
