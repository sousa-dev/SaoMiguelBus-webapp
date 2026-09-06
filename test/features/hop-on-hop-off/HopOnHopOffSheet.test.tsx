// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HopOnHopOffSheet } from '@/features/hop-on-hop-off/components/HopOnHopOffSheet';
import i18n from '@/lib/i18n';
import { flush, mount, type Mounted } from '../../helpers/react';

await i18n.changeLanguage('en');

let mounted: Mounted | null = null;

afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
});

describe('HopOnHopOffSheet', () => {
  it('renders the body, bullets and disclaimer when open', async () => {
    mounted = await mount(<HopOnHopOffSheet open onClose={vi.fn()} onBook={vi.fn()} />);
    await flush();
    expect(document.body.textContent).toContain('Discover São Miguel');
    expect(document.body.textContent).toContain('Sete Cidades and Gorreana');
    expect(document.body.textContent).toContain('Opens GetYourGuide in your browser');
  });

  it('calls onBook when the book button is clicked, and onClose for the close link', async () => {
    const onBook = vi.fn();
    const onClose = vi.fn();
    mounted = await mount(<HopOnHopOffSheet open onClose={onClose} onBook={onBook} />);
    await flush();
    const book = Array.from(document.querySelectorAll('button')).find((b) => b.textContent === 'Learn more & book')!;
    await act(async () => {
      book.click();
    });
    expect(onBook).toHaveBeenCalledTimes(1);

    const close = Array.from(document.querySelectorAll('button')).find((b) => b.textContent === 'Close')!;
    await act(async () => {
      close.click();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when closed', async () => {
    mounted = await mount(<HopOnHopOffSheet open={false} onClose={vi.fn()} onBook={vi.fn()} />);
    await flush();
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
  });
});
