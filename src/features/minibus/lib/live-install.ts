import { openPremiumStore } from '@/lib/app-links';
import { useStoreChooserStore } from '@/features/ads/lib/store-chooser-store';

export function openMinibusLiveInstallPrompt(title: string, body: string): void {
  openPremiumStore(() => {
    useStoreChooserStore.getState().show({ title, body });
  });
}
