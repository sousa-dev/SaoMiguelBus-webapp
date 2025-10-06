// Desktop app bootstrap
(function(){
  async function bootstrap(){
    // Load navbar + sidebar and route
    if (window.desktopRouter) {
      await window.desktopRouter.router();
    }

    // Register SW (desktop only)
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function(){
        navigator.serviceWorker.register('/desktop/js/sw.js').catch(console.error);
      });
    }

    // Mobile redirect safeguard
    function checkScreenWidth(){
      if (window.innerWidth <= 769) {
        if (typeof umami !== 'undefined') umami.track('desktop-redirect-to-mobile');
        window.location.href = '/';
      }
    }
    document.addEventListener('DOMContentLoaded', checkScreenWidth);
    window.addEventListener('resize', checkScreenWidth);
  }

  // Search page init called by router after page inject
  window.initSearchPage = function(){
    // i18n
    if (typeof loadTranslations === 'function') {
      const langCookie = getCookie('language');
      const lang = langCookie || (navigator.language || 'pt').split('-')[0];
      loadTranslations(lang.startsWith('pt') ? 'pt' : lang);
    }

    // Bind swap button
    const swapBtn = document.getElementById('change');
    if (swapBtn) {
      swapBtn.addEventListener('click', function(){
        const origin = document.getElementById('origin');
        const destination = document.getElementById('destination');
        const tmp = origin.value; origin.value = destination.value; destination.value = tmp;
        if (typeof umami !== 'undefined') umami.track('desktop-swap-origin-destination');
      });
    }

    // Bind search button
    const searchBtn = document.getElementById('btnSubmit');
    if (searchBtn) {
      searchBtn.addEventListener('click', function(e){
        e.preventDefault();
        const origin = document.getElementById('origin').value;
        const destination = document.getElementById('destination').value;
        const day = document.getElementById('day').value;
        const time = document.getElementById('time').value;
        if (typeof searchRoutes === 'function') {
          searchRoutes(origin, destination, day, time);
        }
      });
    }

    // Populate stops + initial ads
    if (typeof fetchAndPopulateStops === 'function') fetchAndPopulateStops();
    if (typeof loadAdBanner === 'function') loadAdBanner('home');
  }

  document.addEventListener('DOMContentLoaded', bootstrap);
})();
