import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, Settings, X } from 'lucide-react';

import { resolveEnabledModules } from '@/config/island';
import { useBootstrap } from '@/hooks/useBootstrap';
import { PRIVACY_PATH, TERMS_PATH } from '@/lib/app-links';
import { HUB_NAV, NAV_MODULES } from '@/lib/modules';
import { cn } from '@/lib/cn';
import { HeaderActions } from '@/components/layout/HeaderActions';
import { AppInstallBanner, GetTheAppCard } from '@/components/AppInstall';
import { AnalyticsLifecycle } from '@/components/consent/AnalyticsLifecycle';
import { ConsentBanner } from '@/components/consent/ConsentBanner';
import { SessionAdOrchestrator } from '@/features/ads/components/SessionAdOrchestrator';
import { StoreChooserModal } from '@/features/ads/components/StoreChooserModal';
import { useAuthBootstrap } from '@/features/account/hooks/useAuthBootstrap';
import { SignInDialogHost } from '@/features/account/components/SignInDialogHost';
import { useEntitlementSync } from '@/features/premium/hooks/useEntitlementSync';
import { useRevenueCatBootstrap } from '@/features/premium/hooks/useRevenueCatBootstrap';
import { SETTINGS_PATH } from '@/features/premium/lib/paywall-route';
import { useCanShowAds } from '@/features/premium/usePremium';
import { NoticeDialogHost } from '@/components/ui/NoticeDialogHost';
import { useAutoTrackPinnedRoutes } from '@/features/transit/pinned/hooks/useAutoTrackPinnedRoutes';
import { useScheduleTransition } from '@/features/transit/schedule-hooks';

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const { data: bootstrap } = useBootstrap();
  const enabled = resolveEnabledModules(bootstrap?.island?.enabledModules);
  const visible = NAV_MODULES.filter((m) => enabled.includes(m.key));
  // Bus-focused nav: transit leads, "Início" (the hub) follows, then the rest.
  const transit = visible.find((m) => m.key === 'transit');
  const rest = visible.filter((m) => m.key !== 'transit');

  const itemClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition',
      isActive
        ? 'bg-primary/12 text-primary'
        : 'text-content/80 hover:bg-surface-variant hover:text-content',
    );

  return (
    <nav className="flex flex-col gap-1">
      {transit ? (
        <NavLink to={transit.route} className={itemClass} onClick={onNavigate}>
          <transit.Icon size={20} strokeWidth={2} />
          {t(transit.labelKey)}
        </NavLink>
      ) : null}
      <NavLink to={HUB_NAV.route} end className={itemClass} onClick={onNavigate}>
        <HUB_NAV.Icon size={20} strokeWidth={2} />
        {t(HUB_NAV.labelKey)}
      </NavLink>
      {rest.map((m) => (
        <NavLink key={m.key} to={m.route} className={itemClass} onClick={onNavigate}>
          <m.Icon size={20} strokeWidth={2} />
          {t(m.labelKey)}
        </NavLink>
      ))}
    </nav>
  );
}

function SettingsNavLink({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  return (
    <NavLink
      to={SETTINGS_PATH}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition',
          isActive
            ? 'bg-primary/12 text-primary'
            : 'text-content/80 hover:bg-surface-variant hover:text-content',
        )
      }
    >
      <Settings size={20} strokeWidth={2} />
      {t('settingsTitle')}
    </NavLink>
  );
}

function SidebarLegalLinks() {
  const { t } = useTranslation();
  const linkClass =
    'text-muted underline-offset-2 transition hover:text-content hover:underline';

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-1 text-xs">
      <a href={TERMS_PATH} className={linkClass}>
        {t('termsAndConditions')}
      </a>
      <span className="text-muted/50" aria-hidden>
        ·
      </span>
      <a href={PRIVACY_PATH} className={linkClass}>
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
        <p className="text-xs text-muted">São Miguel Bus</p>
      </div>
    </div>
  );
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const canShowAds = useCanShowAds();
  const { data: bootstrapData, isSuccess: bootstrapReady } = useBootstrap();

  // Re-resolve the network at `nextTransitionAt`. Mounted at the shell so a tab
  // parked on any page still crosses the cutover, not just the transit one.
  useScheduleTransition(bootstrapData?.transitSchedule);

  // Account session → authoritative entitlement → ad suppression, in that order.
  useAuthBootstrap();
  useEntitlementSync();
  useRevenueCatBootstrap();
  // Pinned routes arm themselves when due (premium; page load + tab visible).
  useAutoTrackPinnedRoutes();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 border-r border-border bg-surface px-4 py-5 lg:flex">
        <Brand />
        <NavItems />
        <div className="mt-auto flex flex-col gap-3">
          <SettingsNavLink />
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
            <div className="mt-auto flex flex-col gap-3">
              <SettingsNavLink onNavigate={() => setMobileOpen(false)} />
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
          <HeaderActions />
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
      <NoticeDialogHost />
      <SignInDialogHost />
      {canShowAds ? <SessionAdOrchestrator bootstrapReady={bootstrapReady} /> : null}
    </div>
  );
}
