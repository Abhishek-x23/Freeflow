import { useState, useEffect } from 'react';

/**
 * Shared interval timer hook: ticks once per second.
 * Prevents spawning separate interval timers for every ticket row.
 */
export function useCurrentTime(): Date {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return now;
}
