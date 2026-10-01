import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectPendingTickets } from '../../features/tickets/ticketSelectors';
import { showPendingTickets } from '../../features/tickets/ticketSlice';
import { Sparkles, ArrowUp } from 'lucide-react';

export const NewTicketsBanner: React.FC = () => {
  const dispatch = useAppDispatch();
  const pendingTickets = useAppSelector(selectPendingTickets);

  if (pendingTickets.length === 0) {
    return null;
  }

  const count = pendingTickets.length;
  const label = count === 1 ? '1 new ticket' : `${count} new tickets`;

  return (
    <div className="my-3 px-4 py-2.5 rounded-xl bg-indigo-600 text-white shadow-md flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Sparkles className="w-4 h-4 text-indigo-200 animate-pulse" />
        <span>
          {label} received in real-time
        </span>
      </div>

      <button
        onClick={() => dispatch(showPendingTickets())}
        className="flex items-center gap-1.5 px-3 py-1 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold text-xs rounded-lg shadow-sm transition-transform active:scale-95"
      >
        <ArrowUp className="w-3.5 h-3.5" />
        <span>Show now</span>
      </button>
    </div>
  );
};
