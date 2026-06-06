import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';

import { AppShell } from '@/components/layout/AppShell';
import { HomePage } from '@/features/hub/HomePage';
import { TransitPage } from '@/features/transit/TransitPage';
import { DirectionsPage } from '@/features/transit/DirectionsPage';
import { TripDetailPage } from '@/features/transit/TripDetailPage';
import { NewsArticlePage, NewsPage } from '@/features/news';
import { WeatherDetailPage, WeatherPage } from '@/features/weather';
import { EarthquakeDetailPage, EarthquakesPage } from '@/features/earthquakes';
import { TourDetailPage, ToursPage } from '@/features/tours';
import { TrailDetailPage, TrailsPage } from '@/features/trails';
import { TrafficDetailPage, TrafficPage } from '@/features/traffic';
import { MarketplacePage, MarketplaceProviderPage } from '@/features/marketplace';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'transit', element: <TransitPage /> },
      { path: 'transit/directions', element: <DirectionsPage /> },
      { path: 'transit/trip/:tripId', element: <TripDetailPage /> },
      { path: 'news', element: <NewsPage /> },
      { path: 'news/:articleId', element: <NewsArticlePage /> },
      { path: 'weather', element: <WeatherPage /> },
      { path: 'weather/:slug', element: <WeatherDetailPage /> },
      { path: 'earthquakes', element: <EarthquakesPage /> },
      { path: 'earthquakes/:id', element: <EarthquakeDetailPage /> },
      { path: 'tours', element: <ToursPage /> },
      { path: 'tours/:code', element: <TourDetailPage /> },
      { path: 'trails', element: <TrailsPage /> },
      { path: 'trails/:id', element: <TrailDetailPage /> },
      { path: 'traffic', element: <TrafficPage /> },
      { path: 'traffic/:id', element: <TrafficDetailPage /> },
      { path: 'marketplace', element: <MarketplacePage /> },
      { path: 'marketplace/:id', element: <MarketplaceProviderPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
