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
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 py-2 text-xs">
      {/* Status Filter */}
      <div className="flex items-center gap-1.5 min-w-[130px] flex-1 sm:flex-initial">
        <label htmlFor="filter-status" className="text-slate-500 font-medium shrink-0">
          Status:
        </label>
        <select
          id="filter-status"
          value={filters.status || 'all'}
          onChange={(e) => handleSelectChange('status', e.target.value)}
          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Priority Filter */}
      <div className="flex items-center gap-1.5 min-w-[130px] flex-1 sm:flex-initial">
        <label htmlFor="filter-priority" className="text-slate-500 font-medium shrink-0">
          Priority:
        </label>
        <select
          id="filter-priority"
          value={filters.priority || 'all'}
          onChange={(e) => handleSelectChange('priority', e.target.value)}
          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        >
          <option value="all">All Priorities</option>
          <option value="P0">P0 (Critical - 1h)</option>
          <option value="P1">P1 (High - 4h)</option>
          <option value="P2">P2 (Medium - 24h)</option>
          <option value="P3">P3 (Low - 72h)</option>
        </select>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-1.5 min-w-[150px] flex-1 sm:flex-initial">
        <label htmlFor="filter-category" className="text-slate-500 font-medium shrink-0">
          Category:
        </label>
        <select
          id="filter-category"
          value={filters.category || 'all'}
          onChange={(e) => handleSelectChange('category', e.target.value)}
          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        >
          <option value="all">All Categories</option>
          <option value="account_access">Account & Access</option>
          <option value="billing">Billing & Invoices</option>
          <option value="bug">Bugs & Technical</option>
          <option value="feature_request">Feature Request</option>
          <option value="other">Other Inquiry</option>
        </select>
      </div>

      {/* AI Decision Filter */}
      <div className="flex items-center gap-1.5 min-w-[140px] flex-1 sm:flex-initial">
        <label htmlFor="filter-ai" className="text-slate-500 font-medium shrink-0">
          AI Triage:
        </label>
        <select
          id="filter-ai"
          value={filters.ai_decision || 'all'}
          onChange={(e) => handleSelectChange('ai_decision', e.target.value)}
          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        >
          <option value="all">All Decisions</option>
          <option value="auto_accept">Auto Accepted</option>
          <option value="manual_review">Manual Review Needed</option>
        </select>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
          title="Reset all filters and search"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
};
