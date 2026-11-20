import { useEffect, useState } from 'react';
import { authedJson } from '../lib/authedJson';

/** Whether this account (or this child phone) has a learner who sees the Quran tab. The server decides (4.1). */
export function useQuranAccess(enabled = true): boolean {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    authedJson<{ learners: unknown[] }>('/api/student/quran/access')
      .then((d) => { if (live) setAllowed((d.learners || []).length > 0); })
      .catch(() => { if (live) setAllowed(false); });
    return () => { live = false; };
  }, [enabled]);
  return allowed;
}
