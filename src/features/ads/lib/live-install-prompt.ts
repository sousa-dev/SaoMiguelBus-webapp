import { openPremiumStore } from '@/lib/app-links';
import { useStoreChooserStore } from '@/features/ads/lib/store-chooser-store';

/** Shared by every "this is a free live-tracking feature" teaser (Mini Bus, AzoresBus, …). */
export function openLiveInstallPrompt(title: string, body: string): void {
  openPremiumStore(() => {
    useStoreChooserStore.getState().show({ title, body });
  });
}
