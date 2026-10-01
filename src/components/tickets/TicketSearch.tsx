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
    <div className="relative w-full sm:w-72 md:w-80">
      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-zinc-400">
        <Search className="w-3.5 h-3.5" />
      </div>
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder="Filter by subject, body, or ID..."
        className="w-full pl-8 pr-7 h-8 bg-white border border-zinc-200 rounded text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-2 flex items-center text-zinc-400 hover:text-zinc-600"
          aria-label="Clear search query"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
