/**
 * useBundleAutoUnlock — QBS. Sets unlocked=true on cold-launch if the
 * user paid for the £1.50 bundle in one of the sibling apps.
 */
import { useEffect } from 'react';
import { bundleApi } from './bundleApi';
import { useApp } from './store/useApp';

export function useBundleAutoUnlock() {
  const unlocked = useApp((s) => s.unlocked);
  const setEntitlement = useApp((s) => s.setEntitlement);
  useEffect(() => {
    if (unlocked) return;
    let cancelled = false;
    (async () => {
      try {
        const status = await bundleApi.status();
        if (cancelled) return;
        if (status.should_unlock_here) {
          setEntitlement({ unlocked: true });
          bundleApi.redeem().catch(() => {});
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [unlocked, setEntitlement]);
}
