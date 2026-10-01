import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setFilters, resetFilters } from '../../features/tickets/ticketSlice';
import { selectFilters } from '../../features/tickets/ticketSelectors';
import { TicketFilters as FiltersType } from '../../types/ticket';
import { RotateCcw } from 'lucide-react';

interface TicketFiltersProps {
  onFilterChange?: (newFilters: FiltersType) => void;
}

export const TicketFilters: React.FC<TicketFiltersProps> = ({ onFilterChange }) => {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFilters);

  const handleSelectChange = (key: keyof FiltersType, value: string) => {
    const updated = { ...filters, [key]: value };
    dispatch(setFilters({ [key]: value }));
    if (onFilterChange) {
      onFilterChange(updated);
    }
  };

  const handleReset = () => {
    dispatch(resetFilters());
    if (onFilterChange) {
      onFilterChange({
        status: 'all',
        priority: 'all',
        category: 'all',
        ai_decision: 'all',
        search: '',
      });
    }
  };

  const hasActiveFilters =
    (filters.status && filters.status !== 'all') ||
    (filters.priority && filters.priority !== 'all') ||
    (filters.category && filters.category !== 'all') ||
    (filters.ai_decision && filters.ai_decision !== 'all') ||
    Boolean(filters.search && filters.search.trim());

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {/* Status Filter */}
      <select
        id="filter-status"
        aria-label="Filter by status"
        value={filters.status || 'all'}
        onChange={(e) => handleSelectChange('status', e.target.value)}
        className="h-8 bg-white border border-zinc-200 rounded px-2.5 text-xs text-zinc-700 hover:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        <option value="all">Status: All</option>
        <option value="open">Status: Open</option>
        <option value="in_progress">Status: In Progress</option>
        <option value="resolved">Status: Resolved</option>
      </select>

      {/* Priority Filter */}
      <select
        id="filter-priority"
        aria-label="Filter by priority"
        value={filters.priority || 'all'}
        onChange={(e) => handleSelectChange('priority', e.target.value)}
        className="h-8 bg-white border border-zinc-200 rounded px-2.5 text-xs text-zinc-700 hover:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        <option value="all">Priority: All</option>
        <option value="P0">P0 (Critical - 1h)</option>
        <option value="P1">P1 (High - 4h)</option>
        <option value="P2">P2 (Medium - 24h)</option>
        <option value="P3">P3 (Low - 72h)</option>
      </select>

      {/* Category Filter */}
      <select
        id="filter-category"
        aria-label="Filter by category"
        value={filters.category || 'all'}
        onChange={(e) => handleSelectChange('category', e.target.value)}
        className="h-8 bg-white border border-zinc-200 rounded px-2.5 text-xs text-zinc-700 hover:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        <option value="all">Category: All</option>
        <option value="account_access">Account & Access</option>
        <option value="billing">Billing & Invoices</option>
        <option value="bug">Bugs & Technical</option>
        <option value="feature_request">Feature Request</option>
        <option value="other">Other Inquiry</option>
      </select>

      {/* AI Decision Filter */}
      <select
        id="filter-ai"
        aria-label="Filter by AI triage decision"
        value={filters.ai_decision || 'all'}
        onChange={(e) => handleSelectChange('ai_decision', e.target.value)}
        className="h-8 bg-white border border-zinc-200 rounded px-2.5 text-xs text-zinc-700 hover:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        <option value="all">Triage: All</option>
        <option value="auto_accept">Auto Accepted</option>
        <option value="manual_review">Manual Review Needed</option>
      </select>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <button
          onClick={handleReset}
          className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded border border-zinc-200 bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 text-xs font-medium transition-colors"
          title="Reset all filters and search"
        >
          <RotateCcw className="w-3 h-3 text-zinc-400" />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
};
