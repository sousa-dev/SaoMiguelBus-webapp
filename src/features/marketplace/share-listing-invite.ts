import { track } from '@/lib/analytics';

export const MARKETPLACE_REGISTER_URL = 'https://servicos.saomiguelhub.com';

export async function shareMarketplaceListingInvite(message: string, title?: string): Promise<void> {
  track('marketplace', 'share', { action: 'invite_register' });
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text: message, url: MARKETPLACE_REGISTER_URL });
      return;
    } catch {
      // fall through to clipboard
    }
  }
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(`${message}\n${MARKETPLACE_REGISTER_URL}`);
  }
}
