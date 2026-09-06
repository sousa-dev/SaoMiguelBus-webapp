import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { resolveEnabledModules } from '@/config/island';
import { useBootstrap } from '@/hooks/useBootstrap';
import { HUB_NAV, orderedTabModules } from '@/lib/modules';
import { cn } from '@/lib/cn';

/**
 * The narrow-viewport bottom tab bar, mirroring the mobile app's `HubTabBar`:
 * Início plus the same fixed four modules (transit, tours, minibus, weather),
 * filtered to what this island actually has enabled. Every other module still
 * lives in the hub grid and the drawer menu, exactly as it does on mobile.
 */
export function MobileTabBar() {
  const { t } = useTranslation();
  const { data: bootstrap } = useBootstrap();
  const modules = orderedTabModules(resolveEnabledModules(bootstrap?.island?.enabledModules));

  const itemClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1 text-[11px] font-semibold transition',
      isActive ? 'text-primary' : 'text-muted',
    );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[1150] flex items-stretch border-t border-border bg-surface/95 px-1 pb-[max(0.375rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur lg:hidden">
      <NavLink to={HUB_NAV.route} end className={itemClass}>
        <HUB_NAV.Icon size={22} strokeWidth={2} />
        {t(HUB_NAV.labelKey)}
      </NavLink>
      {modules.map((m) => (
        <NavLink key={m.key} to={m.route} className={itemClass}>
          <m.Icon size={22} strokeWidth={2} />
          {t(m.labelKey)}
        </NavLink>
      ))}
    </nav>
  );
}
