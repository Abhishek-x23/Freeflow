import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectPendingTickets } from '../../features/tickets/ticketSelectors';
import { showPendingTickets } from '../../features/tickets/ticketSlice';
import { ArrowUp, Radio } from 'lucide-react';

export const NewTicketsBanner: React.FC = () => {
  const dispatch = useAppDispatch();
  const pendingTickets = useAppSelector(selectPendingTickets);

  if (pendingTickets.length === 0) {
    return null;
  }

  const count = pendingTickets.length;
  const label = count === 1 ? '1 new ticket' : `${count} new tickets`;

  return (
    <div className="my-2.5 px-3.5 py-2 rounded bg-blue-600 text-white flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        <Radio className="w-3.5 h-3.5 text-blue-200 animate-pulse" />
        <span className="font-medium">{label} received in background</span>
      </div>

      <button
        onClick={() => dispatch(showPendingTickets())}
        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-blue-700 hover:bg-blue-50 font-semibold text-xs rounded transition-colors"
      >
        <ArrowUp className="w-3 h-3" />
        <span>Show now</span>
      </button>
    </div>
  );
};
