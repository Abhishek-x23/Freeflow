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

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-6">
            <div
              className="flex items-center gap-2.5 cursor-pointer select-none"
              onClick={() => onNavigate('/tickets')}
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 dark:shadow-none">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  Apex Support
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    SLA v2
                  </span>
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block -mt-0.5">
                  Triage & Operations
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => onNavigate('/tickets')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPath === '/tickets' || currentPath === '/'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <Inbox className="w-4 h-4" />
                <span>Tickets</span>
              </button>

              <button
                onClick={() => onNavigate('/review')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPath === '/review'
                    ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>AI Review Queue</span>
                {toReviewCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200 font-bold tabular-nums">
                    {toReviewCount}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Counters & Agent Switcher */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Live Counters */}
            <div className="hidden sm:flex items-center gap-2 text-xs">
              {/* My tickets (N) */}
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200"
                title={`Active tickets assigned to ${currentAgent.name}`}
              >
                <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>My tickets:</span>
                <span className="font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                  {myTicketsCount}
                </span>
              </div>

              {/* To review (N) */}
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                onClick={() => onNavigate('/review')}
                title="Tickets awaiting manual AI triage review"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>To review:</span>
                <span className="font-bold tabular-nums text-amber-600 dark:text-amber-400">
                  {toReviewCount}
                </span>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
              title="Manual refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            {/* Simulation Chaos Toggle */}
            <button
              onClick={toggleSimulation}
              className={`hidden lg:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-mono transition-all ${
                simulationEnabled
                  ? 'border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
              }`}
              title="Click to toggle simulated delay (300-1500ms) and random errors"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Sim: {simulationEnabled ? 'Chaos ON' : 'Fast OFF'}</span>
            </button>

            {/* Agent Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setAgentDropdownOpen(!agentDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
                aria-haspopup="true"
                aria-expanded={agentDropdownOpen}
              >
                <div
                  className={`w-6 h-6 rounded-full ${currentAgent.avatarColor} text-white flex items-center justify-center text-[11px] font-bold`}
                >
                  {currentAgent.initials}
                </div>
                <div className="hidden sm:block text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    {currentAgent.name}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {agentDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setAgentDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Switch Active Agent
                    </div>
                    {KNOWN_AGENTS.map((agent) => (
                      <button
                        key={agent.id}
                        onClick={() => handleSelectAgent(agent.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                          agent.id === selectedAgentId
                            ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-full ${agent.avatarColor} text-white flex items-center justify-center text-[10px] font-bold`}
                          >
                            {agent.initials}
                          </div>
                          <span>{agent.name}</span>
                        </div>
                        {agent.id === selectedAgentId && (
                          <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded">
                            Active
                          </span>
                        )}
                      </button>
                    ))}

                    <div className="pt-1.5 mt-1 border-t border-slate-100 dark:border-slate-800 px-3 py-1 text-[11px] text-slate-400">
                      Simulated agent auth session
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <button
            onClick={() => onNavigate('/tickets')}
            className={`flex items-center gap-1.5 py-1 px-3 rounded ${
              currentPath === '/tickets' || currentPath === '/'
                ? 'font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950'
                : 'text-slate-600'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Tickets ({myTicketsCount})</span>
          </button>

          <button
            onClick={() => onNavigate('/review')}
            className={`flex items-center gap-1.5 py-1 px-3 rounded ${
              currentPath === '/review'
                ? 'font-bold text-amber-600 bg-amber-50 dark:bg-amber-950'
                : 'text-slate-600'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>AI Review ({toReviewCount})</span>
          </button>
        </div>
      </div>
    </header>
  );
};
