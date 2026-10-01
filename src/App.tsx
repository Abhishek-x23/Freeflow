'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './store/hooks';
import {
  setFilters,
  setSearchQuery,
  clearError,
} from './features/tickets/ticketSlice';
import {
  fetchTickets,
  pollLiveUpdatesThunk,
} from './features/tickets/ticketThunks';
import {
  selectFilters,
  selectTicketById,
} from './features/tickets/ticketSelectors';
import { AppHeader } from './components/layout/AppHeader';
import { TicketFilters } from './components/tickets/TicketFilters';
import { TicketSearch } from './components/tickets/TicketSearch';
import { DownloadCsvButton } from './components/tickets/DownloadCsvButton';
import { TicketList } from './components/tickets/TicketList';
import { TicketDetails } from './components/tickets/TicketDetails';
import { ReviewQueue } from './components/review/ReviewQueue';
import { NewTicketsBanner } from './components/tickets/NewTicketsBanner';
import { BulkActions } from './components/tickets/BulkActions';
import { apiClient } from './lib/api-client';
import { Ticket } from './types/ticket';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export function App() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFilters);

  // Router state
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/tickets';
    }
    return '/tickets';
  });

  const [activeTicketId, setActiveTicketId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const match = window.location.pathname.match(/^\/tickets\/([^/]+)$/);
      return match ? match[1] : null;
    }
    return null;
  });

  const [detailTicket, setDetailTicket] = useState<Ticket | null>(null);
  const [detailNotFound, setDetailNotFound] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Look up ticket from Redux if available
  const reduxTicket = useAppSelector(selectTicketById(activeTicketId || ''));

  // 1. Initial Load & URL Parameter Sync
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const searchParams = new URLSearchParams(window.location.search);
    const initialStatus = searchParams.get('status') || undefined;
    const initialPriority = searchParams.get('priority') || undefined;
    const initialCategory = searchParams.get('category') || undefined;
    const initialDecision = searchParams.get('ai_decision') || undefined;
    const initialSearch = searchParams.get('q') || searchParams.get('search') || undefined;

    if (
      initialStatus ||
      initialPriority ||
      initialCategory ||
      initialDecision ||
      initialSearch
    ) {
      dispatch(
        setFilters({
          status: initialStatus || 'all',
          priority: initialPriority || 'all',
          category: initialCategory || 'all',
          ai_decision: initialDecision || 'all',
          search: initialSearch || '',
        })
      );
    }

    // Fetch initial ticket list
    dispatch(fetchTickets({ isAppend: false }));
  }, [dispatch]);

  // 2. Sync active Redux filters to URL query string
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (currentPath !== '/tickets' && currentPath !== '/') return;

    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters.priority && filters.priority !== 'all') params.set('priority', filters.priority);
    if (filters.category && filters.category !== 'all') params.set('category', filters.category);
    if (filters.ai_decision && filters.ai_decision !== 'all') params.set('ai_decision', filters.ai_decision);
    if (filters.search && filters.search.trim()) params.set('q', filters.search.trim());

    const queryString = params.toString();
    const newUrl = queryString ? `/tickets?${queryString}` : '/tickets';

    if (window.location.pathname + window.location.search !== newUrl) {
      window.history.replaceState(null, '', newUrl);
    }
  }, [filters, currentPath]);

  // 3. Live Polling Effect (runs every 5 seconds per brief)
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(pollLiveUpdatesThunk({}));
    }, 5000);

    return () => clearInterval(interval);
  }, [dispatch]);

  // 4. Fetch Ticket Details if opening /tickets/:id
  useEffect(() => {
    if (!activeTicketId) {
      setDetailTicket(null);
      setDetailNotFound(false);
      return;
    }

    // If already in redux store
    if (reduxTicket) {
      setDetailTicket(reduxTicket);
      setDetailNotFound(false);
      return;
    }

    // Otherwise fetch directly from API
    setDetailLoading(true);
    setDetailNotFound(false);

    apiClient
      .getTicketById(activeTicketId)
      .then((data) => {
        setDetailTicket(data);
        setDetailNotFound(false);
      })
      .catch((err) => {
        if (err.status === 404) {
          setDetailNotFound(true);
        }
      })
      .finally(() => {
        setDetailLoading(false);
      });
  }, [activeTicketId, reduxTicket]);

  // Navigation Helpers
  const navigateTo = useCallback(
    (path: string) => {
      setCurrentPath(path);
      const match = path.match(/^\/tickets\/([^/]+)$/);
      if (match) {
        setActiveTicketId(match[1]);
      } else {
        setActiveTicketId(null);
      }
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', path);
      }
    },
    []
  );

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname || '/tickets';
      setCurrentPath(path);
      const match = path.match(/^\/tickets\/([^/]+)$/);
      setActiveTicketId(match ? match[1] : null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchTickets({ isAppend: false })).unwrap();
    } catch {
      // Ignored, handled in state
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenDetails = (id: string) => {
    navigateTo(`/tickets/${encodeURIComponent(id)}`);
  };

  const handleBackToList = () => {
    navigateTo('/tickets');
  };

  const handleResetFilters = () => {
    dispatch(setFilters({ status: 'all', priority: 'all', category: 'all', ai_decision: 'all', search: '' }));
    dispatch(fetchTickets({ isAppend: false }));
  };

  // Re-fetch tickets whenever filters change
  const handleFilterOrSearchApplied = () => {
    dispatch(fetchTickets({ isAppend: false }));
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-zinc-900 flex flex-col antialiased">
      {/* App Header */}
      <AppHeader
        currentPath={currentPath}
        onNavigate={navigateTo}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Ticket Details View */}
        {activeTicketId ? (
          detailNotFound ? (
            <div className="py-16 text-center max-w-sm mx-auto">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-semibold text-zinc-900">
                Ticket Not Found (404)
              </h2>
              <p className="text-xs text-zinc-500 mt-1 mb-4">
                No ticket exists with ID "{activeTicketId}".
              </p>
              <button
                onClick={handleBackToList}
                className="h-8 inline-flex items-center gap-1.5 px-3 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to tickets</span>
              </button>
            </div>
          ) : detailTicket ? (
            <TicketDetails ticket={detailTicket} onBack={handleBackToList} />
          ) : (
            <div className="py-20 text-center text-xs text-zinc-400">
              Loading ticket {activeTicketId}...
            </div>
          )
        ) : currentPath === '/review' ? (
          /* AI Review Queue View */
          <ReviewQueue onOpenTicket={handleOpenDetails} />
        ) : (
          /* Main Dashboard: Tickets List */
          <div className="flex flex-col gap-3.5">
            {/* Real-time incoming new tickets banner */}
            <NewTicketsBanner />

            {/* Integrated Toolbar: Search + Filters + Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pb-2 border-b border-zinc-200">
              <div className="flex flex-wrap items-center gap-2">
                <TicketSearch onSearchDebounced={handleFilterOrSearchApplied} />
                <TicketFilters onFilterChange={handleFilterOrSearchApplied} />
              </div>
              <div className="flex items-center gap-2 shrink-0 self-start lg:self-auto">
                <DownloadCsvButton />
              </div>
            </div>

            {/* Ticket Table / Cards */}
            <TicketList
              onOpenDetails={handleOpenDetails}
              onResetFilters={handleResetFilters}
            />

            {/* Floating Bulk Actions Bar */}
            <BulkActions />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
