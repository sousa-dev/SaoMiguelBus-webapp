import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { Check, MapPin, ThumbsDown, ThumbsUp, TriangleAlert } from 'lucide-react';

import { Badge, Button, Card, CenteredSpinner, Chip, EmptyState, SegmentedControl } from '@/components/ui';
import { BackLink, PageHeader } from '@/components/layout/Page';
import { Seo } from '@/components/Seo';
import { MapView, type MapPoint } from '@/components/MapView';
import {
  confirmTrafficReport,
  fetchTrafficCategories,
  fetchTrafficReport,
  fetchTrafficReports,
} from '@/lib/api';
import { track } from '@/lib/analytics';
import { formatRelativeTime } from '@/lib/format';
import type { ConfirmVote, TrafficReport } from '@/lib/types';

function statusTone(status: string): 'success' | 'warning' | 'neutral' {
  if (status === 'active') return 'success';
  if (status === 'scheduled') return 'warning';
  return 'neutral';
}

function ReportRow({ report }: { report: TrafficReport }) {
  const { t, i18n } = useTranslation();
  return (
    <Link to={`/traffic/${report.id}`}>
      <Card className="flex items-center gap-4 p-4 transition hover:border-outline">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning-surface text-warning">
          <TriangleAlert size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-content">{report.category.name}</p>
          {report.road ? <p className="truncate text-sm text-muted">{report.road}</p> : null}
          <p className="text-xs text-muted">{formatRelativeTime(report.createdAt, i18n.language)}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge tone={statusTone(report.status)}>{t(`trafficStatus_${report.status}`, { defaultValue: report.status })}</Badge>
          <span className="inline-flex items-center gap-1 text-xs text-success"><Check size={12} /> {report.confidence.confirm}</span>
        </div>
      </Card>
    </Link>
  );
}

export function TrafficPage() {
  const { t } = useTranslation();
  const [view, setView] = useState<'list' | 'map'>('map');
  const [category, setCategory] = useState<string | undefined>(undefined);

  const categories = useQuery({ queryKey: ['traffic', 'categories'], queryFn: fetchTrafficCategories });
  const reports = useQuery({
    queryKey: ['traffic', 'reports', category],
    queryFn: () => fetchTrafficReports({ category, includeScheduled: true, limit: 100 }),
    refetchInterval: 60 * 1000,
  });

  const points: MapPoint[] = (reports.data ?? []).map((r) => ({
    id: r.id,
    lat: r.latitude,
    lng: r.longitude,
    color: '#b45309',
    popup: `${r.category.name}${r.road ? ` · ${r.road}` : ''}`,
  }));

  useEffect(() => {
    track('traffic', 'view', { screen: view });
  }, [view]);

  return (
    <>
      <Seo modulePath="/traffic" />
      <PageHeader
        title={t('homeTrafficTitle')}
        subtitle={t('trafficSubtitle', { defaultValue: 'Community-reported radars, accidents and hazards.' })}
        actions={
          <SegmentedControl
            value={view}
            onChange={setView}
            options={[
              { value: 'list', label: t('seismicListTab') },
              { value: 'map', label: t('seismicMapTab') },
            ]}
          />
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <Chip label={t('allLabel', { defaultValue: 'All' })} active={!category} onClick={() => setCategory(undefined)} />
        {(categories.data ?? []).map((c) => (
          <Chip key={c.id} label={c.name} active={category === c.slug} onClick={() => setCategory(c.slug)} />
        ))}
      </div>

      {reports.isLoading ? (
        <CenteredSpinner />
      ) : view === 'map' ? (
        <Card className="relative isolate z-0 h-[600px] overflow-hidden">
          <MapView points={points} zoom={10} />
        </Card>
      ) : (reports.data ?? []).length === 0 ? (
        <EmptyState
          icon={TriangleAlert}
          title={t('trafficEmptyTitle', { defaultValue: 'No active reports' })}
          description={t('trafficEmptyBody', { defaultValue: 'There are currently no traffic reports on the island. Enjoy the clear roads!' })}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {reports.data!.map((r) => (
            <ReportRow key={r.id} report={r} />
          ))}
        </div>
      )}
    </>
  );
}

export function TrafficDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const reportId = Number(id);
  const qc = useQueryClient();

  const report = useQuery({
    queryKey: ['traffic', 'report', reportId],
    queryFn: () => fetchTrafficReport(reportId),
    enabled: Number.isFinite(reportId),
  });

  const confirm = useMutation({
    mutationFn: (vote: ConfirmVote) => confirmTrafficReport(reportId, vote),
    onSuccess: (data, vote) => {
      track('traffic', 'confirm', { report_id: reportId, vote });
      qc.setQueryData(['traffic', 'report', reportId], data);
    },
  });

  if (report.isLoading) return <CenteredSpinner />;
  if (!report.data) {
    return (
      <>
        <BackLink to="/traffic" label={t('homeTrafficTitle')} />
        <EmptyState icon={TriangleAlert} title={t('trafficNotFound', { defaultValue: 'Report not found' })} />
      </>
    );
  }

  const r = report.data;
  return (
    <>
      <Seo title={`${r.category.name}${r.road ? ` — ${r.road}` : ''}`} description={r.description || r.category.name} />
      <BackLink to="/traffic" label={t('homeTrafficTitle')} />
      <PageHeader title={r.category.name} subtitle={r.road || undefined} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr]">
        <Card className="flex flex-col gap-4 p-6">
          <div className="flex items-center gap-2">
            <Badge tone={statusTone(r.status)}>{t(`trafficStatus_${r.status}`, { defaultValue: r.status })}</Badge>
            <span className="text-xs text-muted">{formatRelativeTime(r.createdAt, i18n.language)}</span>
          </div>
          {r.description ? <p className="text-content">{r.description}</p> : null}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" icon={ThumbsUp} onClick={() => confirm.mutate('still_there')} disabled={confirm.isPending}>
              {t('trafficStillThere', { defaultValue: 'Still there' })} · {r.confidence.confirm}
            </Button>
            <Button variant="outline" size="sm" icon={ThumbsDown} onClick={() => confirm.mutate('gone')} disabled={confirm.isPending}>
              {t('trafficGone', { defaultValue: 'Gone' })} · {r.confidence.deny}
            </Button>
          </div>
          <p className="inline-flex items-center gap-1 text-xs text-muted">
            <MapPin size={12} /> {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
          </p>
        </Card>
        <Card className="h-[360px] overflow-hidden">
          <MapView points={[{ id: r.id, lat: r.latitude, lng: r.longitude, color: '#b45309', radius: 12 }]} center={{ lat: r.latitude, lng: r.longitude }} zoom={13} fit={false} />
        </Card>
      </div>
    </>
  );
}
