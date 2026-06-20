import { useEffect } from 'react';

import { flushAnalytics, track } from '@/lib/analytics';
import { useConsentStore } from '@/lib/consent-store';
import { useBootstrap } from '@/hooks/useBootstrap';

/** Wires analytics flush on connectivity / visibility and app-shell load tracking. */
export function AnalyticsLifecycle() {
  const hasAnalytics = useConsentStore((s) => s.hasAnalyticsConsent());
  const storedPolicyVersion = useConsentStore((s) => s.policyVersion);
  const requireReconsent = useConsentStore((s) => s.requireReconsent);
  const { data: bootstrap } = useBootstrap();

  useEffect(() => {
    const serverVersion = bootstrap?.consentPolicyVersion;
    if (!serverVersion || !storedPolicyVersion) {
      return;
    }
    if (storedPolicyVersion !== serverVersion) {
      requireReconsent();
    }
  }, [bootstrap?.consentPolicyVersion, storedPolicyVersion, requireReconsent]);

  useEffect(() => {
    if (hasAnalytics) {
      track('transit', 'load', { surface: 'web_shell' });
    }
  }, [hasAnalytics]);

  useEffect(() => {
    const onOnline = () => flushAnalytics();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        flushAnalytics();
      }
    };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return null;
}
