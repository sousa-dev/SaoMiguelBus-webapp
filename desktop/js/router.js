// Simple hash-based router for desktop SPA
(function(){
  const routes = {
    '/search': '/desktop/pages/search.html',
    '/directions': '/desktop/pages/directions.html',
    '/tracking': '/desktop/pages/tracking.html',
    '/tours': '/desktop/pages/tours.html',
    '/info': '/desktop/pages/info.html',
    '/premium': '/desktop/pages/premium.html'
  };

  async function loadComponent(selector, url) {
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      const html = await res.text();
      const el = document.querySelector(selector);
      if (el) el.innerHTML = html;
    } catch (e) {
      console.error('Failed to load', url, e);
    }
  }

  async function ensureShell() {
    await Promise.all([
      loadComponent('#navbar', '/desktop/components/navbar.html'),
      loadComponent('#sidebar', '/desktop/components/sidebar.html')
    ]);
  }

  async function router() {
    if (!location.hash) {
      location.hash = '#/search';
      return;
    }

    const path = location.hash.replace('#', '');
    const page = routes[path] || routes['/search'];

    await ensureShell();

    await loadComponent('#content', page);

    // After page load hooks
    if (path === '/search' && typeof initSearchPage === 'function') {
      initSearchPage();
    }

    // i18n update after DOM injected
    if (typeof updatePageContent === 'function') {
      updatePageContent();
    }

    // Track page view
    if (typeof umami !== 'undefined') {
      umami.track(`desktop-route-${path.slice(1)}-view`);
    }

    setActiveNav(path);
  }

  function setActiveNav(path){
    const links = document.querySelectorAll('[data-nav]');
    links.forEach(a => {
      if (a.getAttribute('href') === `#${path}`) {
        a.classList.add('text-green-600','font-semibold');
      } else {
        a.classList.remove('text-green-600','font-semibold');
      }
    });
  }

  window.addEventListener('hashchange', router);
  window.desktopRouter = { router };
})();
