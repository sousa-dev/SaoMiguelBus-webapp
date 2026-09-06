import { resolveHopOnOffUrl } from '@/config/hop-on-hop-off';
import { HopOnHopOffSheet } from '@/features/hop-on-hop-off/components/HopOnHopOffSheet';
import { trackHopOnOffBookClick } from '@/features/hop-on-hop-off/lib/analytics';
import { useHopOnHopOffModalStore } from '@/features/hop-on-hop-off/lib/modal-store';

/** Mount once in the shell; renders the global hop-on-hop-off sheet driven by the modal store. */
export function HopOnHopOffSheetHost() {
  const open = useHopOnHopOffModalStore((s) => s.open);
  const source = useHopOnHopOffModalStore((s) => s.source);
  const close = useHopOnHopOffModalStore((s) => s.close);

  const onBook = () => {
    const url = resolveHopOnOffUrl();
    trackHopOnOffBookClick(source, url);
    window.open(url, '_blank', 'noopener,noreferrer');
    close();
  };

  return <HopOnHopOffSheet open={open} onClose={close} onBook={onBook} />;
}
