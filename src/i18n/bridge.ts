/**
 * Bridge: keep the module-level active language in /src/i18n/strings.ts
 * synchronized with the Zustand store in /src/store/useApp.ts.
 *
 * Why? Some non-component code paths (and auto-wired t('key') calls without
 * an explicit lang arg) need to read the current language without subscribing
 * via React hooks. We mirror the store value into a plain module variable.
 *
 * Imported once from app/_layout.tsx so the subscription is active before any
 * screen mounts.
 */
import { useApp } from '../store/useApp';
import { setActiveLang } from './strings';

// Set initial value
setActiveLang(useApp.getState().lang);

// Subscribe to subsequent changes
useApp.subscribe((state, prev) => {
  if (state.lang !== prev.lang) {
    setActiveLang(state.lang);
  }
});
