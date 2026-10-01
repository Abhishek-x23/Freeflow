/**
 * Chaos and latency simulation configuration.
 * Simulates real-world busy server characteristics per the assessment brief:
 * - 300 to 1500 ms random response delay
 * - ~10% chance of random HTTP 500 error
 * - ~25% chance of claim HTTP 409 conflict
 *
 * CRITICAL FOR RELIABILITY:
 * All simulation can be disabled via:
 * 1. NODE_ENV === 'test'
 * 2. Header 'x-disable-simulation: true'
 * 3. Query parameter 'disable_simulation=true'
 * 4. Runtime toggle 'setSimulationEnabled(false)'
 */

let simulationGloballyEnabled = process.env.NODE_ENV !== 'test';

export function isSimulationGloballyEnabled(): boolean {
  return simulationGloballyEnabled;
}

export function setSimulationGloballyEnabled(enabled: boolean): void {
  simulationGloballyEnabled = enabled;
}

export interface SimulationOptions {
  disableSimulation?: boolean;
}

export function shouldBypassSimulation(headers?: Headers | Record<string, string | string[] | undefined>, url?: string): boolean {
  if (!simulationGloballyEnabled || process.env.NODE_ENV === 'test') {
    return true;
  }

  // Check query parameter
  if (url && url.includes('disable_simulation=true')) {
    return true;
  }

  // Check header
  if (headers) {
    if (typeof (headers as Headers).get === 'function') {
      const hVal = (headers as Headers).get('x-disable-simulation');
      if (hVal === 'true' || hVal === '1') return true;
    } else {
      const record = headers as Record<string, string | string[] | undefined>;
      const hVal = record['x-disable-simulation'];
      if (hVal === 'true' || (Array.isArray(hVal) && hVal.includes('true'))) return true;
    }
  }

  return false;
}

export async function simulateDelay(bypass: boolean): Promise<void> {
  if (bypass) return;
  // Random delay between 300ms and 1500ms
  const delayMs = Math.floor(Math.random() * (1500 - 300 + 1)) + 300;
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

export function shouldSimulateRandomError(bypass: boolean): boolean {
  if (bypass) return false;
  // Approximately 10% (1 in 10) random server error
  return Math.random() < 0.1;
}

export function shouldSimulateClaimConflict(bypass: boolean): boolean {
  if (bypass) return false;
  // Approximately 25% (1 in 4) claim conflict
  return Math.random() < 0.25;
}
