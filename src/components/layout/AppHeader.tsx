import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setSelectedAgent } from '../../features/tickets/ticketSlice';
import {
  selectMyTicketsCount,
  selectToReviewCount,
  selectSelectedAgentId,
} from '../../features/tickets/ticketSelectors';
import { KNOWN_AGENTS } from '../../types/agent';
import {
  Inbox,
  Sparkles,
  Layers,
  Activity,
  UserCheck,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';

interface AppHeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentPath,
  onNavigate,
  onRefresh,
  isRefreshing = false,
}) => {
  const dispatch = useAppDispatch();
  const selectedAgentId = useAppSelector(selectSelectedAgentId);
  const myTicketsCount = useAppSelector(selectMyTicketsCount);
  const toReviewCount = useAppSelector(selectToReviewCount);

  const [agentDropdownOpen, setAgentDropdownOpen] = useState(false);
  const [simulationEnabled, setSimulationEnabled] = useState(true);

  const currentAgent =
    KNOWN_AGENTS.find((a) => a.id === selectedAgentId) || KNOWN_AGENTS[0];

  // Check simulation status from server
  useEffect(() => {
    fetch('/api/simulation')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.enabled === 'boolean') {
          setSimulationEnabled(data.enabled);
        }
      })
      .catch(() => {});
  }, []);

  const toggleSimulation = async () => {
    try {
      const res = await fetch('/api/simulation/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !simulationEnabled }),
      });
      const data = await res.json();
      setSimulationEnabled(data.enabled);
    } catch {
      setSimulationEnabled(!simulationEnabled);
    }
  };

  const handleSelectAgent = (agentId: string) => {
    dispatch(setSelectedAgent(agentId));
    setAgentDropdownOpen(false);
  };

  const isTicketsActive = currentPath === '/tickets' || currentPath === '/' || currentPath.startsWith('/tickets/');
  const isReviewActive = currentPath === '/review';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-3">
          {/* Brand & Main Navigation */}
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div
              className="flex items-center gap-2.5 cursor-pointer select-none"
              onClick={() => onNavigate('/tickets')}
            >
              <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-zinc-900">
                  Apex Support
                </span>
                <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 px-1.5 py-0.2 rounded border border-zinc-200">
                  SLA
                </span>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 text-xs">
              <button
                onClick={() => onNavigate('/tickets')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
                  isTicketsActive
                    ? 'bg-zinc-100 text-zinc-900 font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
              >
                <Inbox className="w-3.5 h-3.5 text-zinc-500" />
                <span>Tickets</span>
              </button>

              <button
                onClick={() => onNavigate('/review')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
                  isReviewActive
                    ? 'bg-zinc-100 text-zinc-900 font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Review Queue</span>
                {toReviewCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 text-[10px] rounded bg-amber-100 text-amber-800 font-mono font-semibold tabular-nums">
                    {toReviewCount}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Right Toolbar: Counters, Simulation, Agent Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Counters */}
            <div className="hidden sm:flex items-center gap-2 text-xs">
              {/* My tickets (N) */}
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-zinc-200 bg-zinc-50/60 text-zinc-700"
                title={`Active tickets assigned to ${currentAgent.name}`}
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-zinc-500">My tickets:</span>
                <span className="font-semibold tabular-nums text-zinc-900 font-mono">
                  {myTicketsCount}
                </span>
              </div>

              {/* To review (N) */}
              <button
                onClick={() => onNavigate('/review')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-zinc-200 bg-zinc-50/60 text-zinc-700 hover:bg-zinc-100 transition-colors"
                title="Tickets awaiting manual AI triage review"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-zinc-500">To review:</span>
                <span className="font-semibold tabular-nums text-zinc-900 font-mono">
                  {toReviewCount}
                </span>
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors"
              title="Manual refresh"
              aria-label="Refresh tickets"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`}
              />
            </button>

            {/* Simulation Chaos Toggle */}
            <button
              onClick={toggleSimulation}
              className={`hidden lg:inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded border font-mono transition-colors ${
                simulationEnabled
                  ? 'border-amber-200 bg-amber-50/70 text-amber-800'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-600'
              }`}
              title="Click to toggle simulated delay (300-1500ms) and random errors"
            >
              <Activity className="w-3 h-3 text-current" />
              <span>Sim: {simulationEnabled ? 'Chaos' : 'Fast'}</span>
            </button>

            {/* Agent Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setAgentDropdownOpen(!agentDropdownOpen)}
                className="flex items-center gap-2 px-2 py-1 rounded border border-zinc-200 hover:bg-zinc-50 text-left transition-colors"
                aria-haspopup="true"
                aria-expanded={agentDropdownOpen}
              >
                <div
                  className={`w-5 h-5 rounded-full ${currentAgent.avatarColor} text-white flex items-center justify-center text-[10px] font-bold shrink-0`}
                >
                  {currentAgent.initials}
                </div>
                <span className="hidden sm:inline text-xs font-medium text-zinc-800">
                  {currentAgent.name}
                </span>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              {agentDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setAgentDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-lg shadow-lg border border-zinc-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-75">
                    <div className="px-3 py-1.5 border-b border-zinc-100 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Active Agent
                    </div>
                    {KNOWN_AGENTS.map((agent) => (
                      <button
                        key={agent.id}
                        onClick={() => handleSelectAgent(agent.id)}
                        className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors ${
                          agent.id === selectedAgentId
                            ? 'bg-blue-50 text-blue-700 font-semibold'
                            : 'text-zinc-700 hover:bg-zinc-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-5 h-5 rounded-full ${agent.avatarColor} text-white flex items-center justify-center text-[9px] font-bold`}
                          >
                            {agent.initials}
                          </div>
                          <span>{agent.name}</span>
                        </div>
                        {agent.id === selectedAgentId && (
                          <span className="text-[10px] text-blue-600 font-medium">
                            Active
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-zinc-100 text-xs">
          <button
            onClick={() => onNavigate('/tickets')}
            className={`flex items-center gap-1.5 py-1 px-3 rounded ${
              isTicketsActive
                ? 'font-semibold text-blue-600 bg-blue-50'
                : 'text-zinc-600'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Tickets ({myTicketsCount})</span>
          </button>

          <button
            onClick={() => onNavigate('/review')}
            className={`flex items-center gap-1.5 py-1 px-3 rounded ${
              isReviewActive
                ? 'font-semibold text-amber-700 bg-amber-50'
                : 'text-zinc-600'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Review ({toReviewCount})</span>
          </button>
        </div>
      </div>
    </header>
  );
};
