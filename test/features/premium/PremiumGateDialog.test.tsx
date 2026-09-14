// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/analytics', () => ({ track: vi.fn() }));

import { PremiumGateDialogHost } from '@/features/premium/components/PremiumGateDialogHost';
import { openPremiumGateDialog, usePremiumGateDialogStore } from '@/features/premium/lib/premium-gate-dialog-store';
import { track } from '@/lib/analytics';
import { mount, type Mounted } from '../../helpers/react';

const i18n = (await import('@/lib/i18n')).default;
await i18n.changeLanguage('en');

let mounted: Mounted | null = null;

function dialog(): HTMLElement | null {
  return document.body.querySelector('[role="dialog"]');
}

beforeEach(() => {
  vi.mocked(track).mockClear();
  usePremiumGateDialogStore.getState().close();
});

afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
  document.body.style.overflow = '';
});

describe('PremiumGateDialogHost', () => {
  it('renders nothing until a gate opens it', async () => {
    mounted = await mount(<PremiumGateDialogHost />);
    expect(dialog()).toBeNull();
  });

  it('shows the feature copy and badge, and Continue is the only button', async () => {
    const onContinue = vi.fn();
    mounted = await mount(<PremiumGateDialogHost />);
    await act(async () => {
      openPremiumGateDialog({ feature: 'pin', source: 'track_pin', onContinue });
    });
    const el = dialog()!;
    expect(el).not.toBeNull();
    expect(el.textContent).toContain('Pin this route');
    expect(el.textContent).toContain('Premium feature');
    const buttons = Array.from(el.querySelectorAll('button'));
    expect(buttons.map((b) => b.textContent)).toEqual(['Continue']);
    expect(track).toHaveBeenCalledWith('premium', 'gate_explainer_open', { feature: 'pin', source: 'track_pin' });

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      (document.body.querySelector('[data-dialog-backdrop]') as HTMLElement).click();
    });
    expect(dialog()).not.toBeNull();
    expect(onContinue).not.toHaveBeenCalled();

    await act(async () => {
      buttons[0].click();
    });
    expect(dialog()).toBeNull();
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('premium', 'gate_explainer_continue', { feature: 'pin', source: 'track_pin' });
  });
});
