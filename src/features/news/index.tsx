import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { ExternalLink, Newspaper } from 'lucide-react';

import {
  Badge,
  Card,
  CenteredSpinner,
  Chip,
  EmptyState,
  SearchField,
  SegmentedControl,
} from '@/components/ui';
import { BackLink, PageHeader } from '@/components/layout/Page';
import { Seo } from '@/components/Seo';
import { fetchNewsArticle, fetchNewsArticles, fetchNewsSources } from '@/lib/api';
import { track } from '@/lib/analytics';
import { formatAppDate, formatAppDateTime } from '@/lib/format';
import { useDebounced } from '@/hooks/useDebounced';
import type { NewsArticle } from '@/lib/types';

function useNewsSources() {
  return useQuery({ queryKey: ['news', 'sources'], queryFn: fetchNewsSources, staleTime: 30 * 60 * 1000 });
}

function useNewsArticles(params: { category: string; q?: string; source?: number }) {
  return useQuery<NewsArticle[]>({
    queryKey: ['news', 'articles', params.category, params.q, params.source],
    queryFn: async () => {
      const articles = await fetchNewsArticles(params);
      if (params.q) {
        track('news', 'search', { query: params.q, results_count: articles.length });
      }
      return articles;
    },
    staleTime: 5 * 60 * 1000,
  });
}

function NewsCard({ article, showSummary }: { article: NewsArticle; showSummary?: boolean }) {
  return (
    <Link to={`/news/${article.id}`}>
      <Card className="p-4 transition hover:border-outline">
        <div className="mb-1.5 flex items-center gap-2 text-xs text-muted">
          <Badge tone="primary">{article.source.name}</Badge>
          <span>{formatAppDate(article.publishedAt)}</span>
        </div>
        <h3 className="font-bold leading-snug text-content">{article.title}</h3>
        {showSummary && article.summary ? (
          <p className="mt-1.5 line-clamp-3 whitespace-pre-line text-sm text-muted">{article.summary}</p>
        ) : null}
      </Card>
    </Link>
  );
}

export function NewsPage() {
  const { t } = useTranslation();
  const [category, setCategory] = useState<'noticias' | 'pagamentos'>('noticias');
  const [query, setQuery] = useState('');
  const [sourceId, setSourceId] = useState<number | undefined>(undefined);
  const debouncedQ = useDebounced(query, 350);

  const sources = useNewsSources();
  const articles = useNewsArticles({ category, q: debouncedQ || undefined, source: sourceId });

  const sourceList = useMemo(
    () => (sources.data ?? []).filter((s) => s.defaultCategory === category || category === 'noticias'),
    [sources.data, category],
  );

  return (
    <>
      <Seo modulePath="/news" />
      <PageHeader title={t('navBarNewsLabel')} subtitle={t('newsSubtitle', { defaultValue: 'Latest news and official notices from São Miguel.' })} />

      <div className="mb-5 flex flex-col gap-3">
        <SegmentedControl
          value={category}
          onChange={(v) => {
            setCategory(v);
            setSourceId(undefined);
          }}
          options={[
            { value: 'noticias', label: t('newsCategoryNews', { defaultValue: 'News' }) },
            { value: 'pagamentos', label: t('newsCategoryPayments', { defaultValue: 'Notices' }) },
          ]}
        />
        {sourceList.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <Chip label={t('allLabel', { defaultValue: 'All' })} active={sourceId === undefined} onClick={() => setSourceId(undefined)} />
            {sourceList.map((s) => (
              <Chip key={s.id} label={s.name} active={sourceId === s.id} onClick={() => setSourceId(s.id)} />
            ))}
          </div>
        ) : null}
        <SearchField
          placeholder={t('newsSearchPlaceholder', { defaultValue: 'Search news…' })}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {articles.isLoading ? (
        <CenteredSpinner />
      ) : !articles.data || articles.data.length === 0 ? (
        <EmptyState icon={Newspaper} title={t('newsEmpty', { defaultValue: 'No articles found' })} />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {articles.data.map((a) => (
            <NewsCard key={a.id} article={a} showSummary={category === 'pagamentos'} />
          ))}
        </div>
      )}
    </>
  );
}

export function NewsArticlePage() {
  const { t } = useTranslation();
  const { articleId } = useParams();
  const id = Number(articleId);
  const article = useQuery({
    queryKey: ['news', 'article', id],
    queryFn: () => fetchNewsArticle(id),
    enabled: Number.isFinite(id),
  });

  useEffect(() => {
    if (article.data) {
      track('news', 'open', { article_id: article.data.id, source: article.data.source.name });
    }
  }, [article.data?.id, article.data?.source.name]);

  if (article.isLoading) return <CenteredSpinner />;
  if (!article.data) {
    return (
      <>
        <BackLink to="/news" label={t('navBarNewsLabel')} />
        <EmptyState icon={Newspaper} title={t('newsNotFound', { defaultValue: 'Article not found' })} />
      </>
    );
  }

  const a = article.data;

  return (
    <>
      <Seo title={a.title} description={a.summary?.slice(0, 200) || a.title} type="article" />
      <BackLink to="/news" label={t('navBarNewsLabel')} />
      <div className="mx-auto max-w-3xl">
        <Badge tone="primary">{a.source.name}</Badge>
        <h1 className="mt-3 text-2xl font-extrabold leading-tight text-content lg:text-3xl">{a.title}</h1>
        <p className="mt-2 text-sm text-muted">{formatAppDateTime(a.publishedAt)}</p>
        {a.summary ? (
          <Card className="mt-5 p-5">
            <p className="whitespace-pre-line text-content">{a.summary}</p>
          </Card>
        ) : null}
        <a
          href={a.link}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary hover:opacity-90"
        >
          <ExternalLink size={18} />
          {t('newsReadOriginal', { defaultValue: 'Read the original' })}
        </a>
      </div>
    </>
  );
}
