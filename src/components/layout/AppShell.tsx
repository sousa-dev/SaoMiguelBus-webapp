import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';

import { resolveEnabledModules } from '@/config/island';
import { useBootstrap } from '@/hooks/useBootstrap';
import { PRIVACY_URL, TERMS_URL } from '@/lib/app-links';
import { HUB_NAV, NAV_MODULES } from '@/lib/modules';
import { cn } from '@/lib/cn';
import { LanguagePicker } from '@/components/layout/LanguagePicker';
import { AppInstallBanner, GetTheAppCard } from '@/components/AppInstall';
import { AnalyticsLifecycle } from '@/components/consent/AnalyticsLifecycle';
import { ConsentBanner } from '@/components/consent/ConsentBanner';
import { SessionAdOrchestrator } from '@/features/ads/components/SessionAdOrchestrator';
import { StoreChooserModal } from '@/features/ads/components/StoreChooserModal';
import { useCanShowAds, usePremiumStore } from '@/features/premium/usePremium';

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const { data: bootstrap } = useBootstrap();
  const enabled = resolveEnabledModules(bootstrap?.island?.enabledModules);
  const visible = NAV_MODULES.filter((m) => enabled.includes(m.key));

  const itemClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition',
      isActive
        ? 'bg-primary/12 text-primary'
        : 'text-content/80 hover:bg-surface-variant hover:text-content',
    );

  return (
    <nav className="flex flex-col gap-1">
      <NavLink to={HUB_NAV.route} end className={itemClass} onClick={onNavigate}>
        <HUB_NAV.Icon size={20} strokeWidth={2} />
        {t(HUB_NAV.labelKey)}
      </NavLink>
      {visible.map((m) => (
        <NavLink key={m.key} to={m.route} className={itemClass} onClick={onNavigate}>
          <m.Icon size={20} strokeWidth={2} />
          {t(m.labelKey)}
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarLegalLinks() {
  const { t } = useTranslation();
  const linkClass =
    'text-muted underline-offset-2 transition hover:text-content hover:underline';

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-1 text-xs">
      <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {t('termsAndConditions')}
      </a>
      <span className="text-muted/50" aria-hidden>
        ·
      </span>
      <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {t('privacyPolicy')}
      </a>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <img src="/logo.png" alt="" className="h-9 w-9 rounded-xl" />
      <div className="leading-tight">
        <p className="text-[15px] font-extrabold text-content">São Miguel Bus</p>
        <p className="text-xs text-muted">São Miguel Hub</p>
      </div>
    </div>
  );
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const canShowAds = useCanShowAds();
  const { isSuccess: bootstrapReady } = useBootstrap();

  useEffect(() => {
    void usePremiumStore.getState().refresh();
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 border-r border-border bg-surface px-4 py-5 lg:flex">
        <Brand />
        <NavItems />
        <div className="mt-auto flex flex-col gap-3">
          <GetTheAppCard />
          <SidebarLegalLinks />
          <p className="px-1 text-xs text-muted">© {new Date().getFullYear()} São Miguel Bus</p>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-[1100] lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-72 flex-col gap-6 bg-surface px-4 py-5">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1 text-muted hover:bg-surface-variant"
              >
                <X size={22} />
              </button>
            </div>
            <NavItems onNavigate={() => setMobileOpen(false)} />
            <div className="mt-auto">
              <SidebarLegalLinks />
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-[1000] flex h-16 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur lg:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-1.5 text-content hover:bg-surface-variant lg:hidden"
          >
            <Menu size={22} />
          </button>
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <LanguagePicker />
          </div>
        </header>

        <main
          key={location.pathname}
          className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-44 lg:px-8 lg:py-8 lg:pb-8"
        >
          <Outlet />
        </main>
      </div>

      <AppInstallBanner />
      <StoreChooserModal />
      <ConsentBanner />
      <AnalyticsLifecycle />
      {canShowAds ? <SessionAdOrchestrator bootstrapReady={bootstrapReady} /> : null}
    </div>
  );
}
