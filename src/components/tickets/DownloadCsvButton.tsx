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

      // If there are more matching tickets than currently loaded in the client list,
      // query the API with the exact active filters to export all matching records.
      if (totalMatching > visibleTickets.length) {
        const fullResponse = await apiClient.getTickets(
          filters,
          1,
          Math.min(totalMatching, 10000),
          true // Bypass artificial delays for fast instant export
        );

        ticketsToExport = fullResponse.tickets;
      }

      // Convert to CSV
      const csvString = convertTicketsToCsv(ticketsToExport);

      // Generate timestamped filename
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
      const filename = `tickets-export-${dateStr}-${timeStr}.csv`;

      // Trigger browser download
      downloadCsvFile(csvString, filename);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      // Fallback: export whatever is currently visible in memory
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
      className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all shadow-2xs shrink-0 ${
        downloadSuccess
          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
          : isDisabled
          ? 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed'
          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 active:scale-[0.98]'
      }`}
      aria-label="Download filtered tickets as CSV"
    >
      {isExporting ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
          <span>Exporting...</span>
        </>
      ) : downloadSuccess ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Downloaded ({totalMatching})</span>
        </>
      ) : (
        <>
          <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>Download CSV</span>
          {totalMatching > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-medium">
              {totalMatching}
            </span>
          )}
        </>
      )}
    </button>
  );
};
