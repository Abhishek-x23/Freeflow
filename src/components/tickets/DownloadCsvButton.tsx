import React, { useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import {
  selectVisibleTickets,
  selectFilters,
  selectPagination,
} from '../../features/tickets/ticketSelectors';
import { apiClient } from '../../lib/api-client';
import { convertTicketsToCsv, downloadCsvFile } from '../../lib/csv-export';
import { Download, Loader2, Check } from 'lucide-react';

export const DownloadCsvButton: React.FC = () => {
  const visibleTickets = useAppSelector(selectVisibleTickets);
  const filters = useAppSelector(selectFilters);
  const pagination = useAppSelector(selectPagination);

  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const totalMatching = pagination.total;
  const isDisabled = totalMatching === 0 || isExporting;

  const handleDownload = async () => {
    if (isDisabled) return;
    setIsExporting(true);
    setDownloadSuccess(false);

    try {
      let ticketsToExport = visibleTickets;

      if (totalMatching > visibleTickets.length) {
        const fullResponse = await apiClient.getTickets(
          filters,
          1,
          Math.min(totalMatching, 10000),
          true
        );

        ticketsToExport = fullResponse.tickets;
      }

      const csvString = convertTicketsToCsv(ticketsToExport);
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
      const filename = `tickets-export-${dateStr}-${timeStr}.csv`;

      downloadCsvFile(csvString, filename);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      if (visibleTickets.length > 0) {
        const csvString = convertTicketsToCsv(visibleTickets);
        downloadCsvFile(csvString, `tickets-export-fallback.csv`);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isDisabled}
      title={
        totalMatching === 0
          ? 'No tickets to export'
          : `Export ${totalMatching} filtered ticket${totalMatching !== 1 ? 's' : ''} to CSV`
      }
      className={`h-8 inline-flex items-center justify-center gap-1.5 px-3 rounded text-xs font-medium border transition-colors shrink-0 ${
        downloadSuccess
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
          : isDisabled
          ? 'bg-zinc-50 border-zinc-200 text-zinc-400 cursor-not-allowed'
          : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 active:bg-zinc-100'
      }`}
      aria-label="Download filtered tickets as CSV"
    >
      {isExporting ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
          <span>Exporting...</span>
        </>
      ) : downloadSuccess ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span>Exported ({totalMatching})</span>
        </>
      ) : (
        <>
          <Download className="w-3.5 h-3.5 text-zinc-400" />
          <span>Export CSV</span>
          {totalMatching > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 font-mono">
              {totalMatching}
            </span>
          )}
        </>
      )}
    </button>
  );
};
