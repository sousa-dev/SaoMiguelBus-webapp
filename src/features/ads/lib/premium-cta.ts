import { useStoreChooserStore } from '@/features/ads/lib/store-chooser-store';
import { detectPlatform } from '@/lib/platform';
import { openPremiumStore as openStore } from '@/lib/app-links';

export function openPremiumStore(): void {
  openStore(() => {
    useStoreChooserStore.getState().show();
  });
}

export function getPremiumStorePlatform() {
  return detectPlatform();
}
