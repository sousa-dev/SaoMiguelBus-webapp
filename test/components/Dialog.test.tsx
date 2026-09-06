// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ConfirmDialog, Dialog } from '@/components/ui/Dialog';
import { NoticeDialogHost } from '@/components/ui/NoticeDialogHost';
import { showNotice, useNoticeStore } from '@/lib/notice-store';
import { flush, mount, type Mounted } from '../helpers/react';

await import('@/lib/i18n');

let mounted: Mounted | null = null;
afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
  useNoticeStore.setState({ queue: [] });
  document.body.style.overflow = '';
});

function dialog(): HTMLElement | null {
  return document.body.querySelector('[role="dialog"]');
}

async function keydown(key: string) {
  await act(async () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  });
}

describe('Dialog', () => {
  it('renders nothing while closed', async () => {
    mounted = await mount(
      <Dialog open={false} onClose={() => {}} title="Hello">
        body
      </Dialog>,
    );
    expect(dialog()).toBeNull();
  });

  it('portals an accessible dialog into the body and locks scroll', async () => {
    mounted = await mount(
      <Dialog open onClose={() => {}} title="Hello">
        <p>body</p>
      </Dialog>,
    );
    const el = dialog()!;
    expect(el).not.toBeNull();
    expect(el.parentElement).not.toBe(mounted.container); // portal
    expect(el.getAttribute('aria-modal')).toBe('true');
    const labelledBy = el.getAttribute('aria-labelledby')!;
    expect(document.getElementById(labelledBy)?.textContent).toBe('Hello');
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('closes on Escape and on backdrop click, not on inner clicks', async () => {
    const onClose = vi.fn();
    mounted = await mount(
      <Dialog open onClose={onClose} title="Hello">
        <button type="button">inner</button>
      </Dialog>,
    );
    await act(async () => {
      dialog()!.querySelector('button')!.click();
    });
    expect(onClose).not.toHaveBeenCalled();

    await keydown('Escape');
    expect(onClose).toHaveBeenCalledTimes(1);

    await act(async () => {
      (document.body.querySelector('[data-dialog-backdrop]') as HTMLElement).click();
    });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('moves focus into the dialog and restores it on close', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    mounted = await mount(
      <Dialog open onClose={() => {}} title="Hello">
        <input aria-label="field" />
      </Dialog>,
    );
    await flush();
    expect(dialog()!.contains(document.activeElement)).toBe(true);

    await mounted.rerender(
      <Dialog open={false} onClose={() => {}} title="Hello">
        <input aria-label="field" />
      </Dialog>,
    );
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe('');
    trigger.remove();
  });
});

describe('ConfirmDialog', () => {
  it('runs confirm and cancel handlers', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    mounted = await mount(
      <ConfirmDialog
        open
        title="Delete?"
        message="Gone forever"
        confirmLabel="Delete"
        cancelLabel="Keep"
        destructive
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    const buttons = Array.from(dialog()!.querySelectorAll('button'));
    const confirm = buttons.find((b) => b.textContent === 'Delete')!;
    const cancel = buttons.find((b) => b.textContent === 'Keep')!;
    expect(confirm.className).toContain('danger');
    await act(async () => {
      cancel.click();
    });
    expect(onCancel).toHaveBeenCalledTimes(1);
    await act(async () => {
      confirm.click();
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

describe('notice store + host', () => {
  it('shows notices one at a time and dismisses them in order', async () => {
    mounted = await mount(<NoticeDialogHost />);
    expect(dialog()).toBeNull();

    await act(async () => {
      showNotice({ title: 'First', message: 'one' });
      showNotice({ title: 'Second', message: 'two' });
    });
    expect(dialog()!.textContent).toContain('First');
    expect(dialog()!.textContent).not.toContain('Second');

    await act(async () => {
      dialog()!.querySelector('button')!.click();
    });
    expect(dialog()!.textContent).toContain('Second');

    await act(async () => {
      dialog()!.querySelector('button')!.click();
    });
    expect(dialog()).toBeNull();
  });
});
