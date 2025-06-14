function capitalizeEveryWord(string) {
    return string.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}
function fillOriginDestination(origin, destination) {
    document.getElementById('origin').value = origin;
    document.getElementById('destination').value = destination;
    // Scroll to the top of the page
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}
function createFavoriteCard(route) {
    const origin = capitalizeEveryWord(route.origin);
    const destination = capitalizeEveryWord(route.destination);
    const favoriteCard = document.createElement('div');
    favoriteCard.setAttribute('data-umami-event', 'favorite-route-card');
    favoriteCard.classList.add('bg-white', 'rounded-lg', 'shadow-md', 'p-4', 'mb-4', 'flex', 'flex-col', 'items-center', 'cursor-pointer');
    favoriteCard.onclick = () => {
        fillOriginDestination(origin, destination);
        // Track the click event
        if (typeof umami !== 'undefined') {
            umami.track('favorite-route-click', { origin: origin, destination: destination });
        }
    };
    favoriteCard.innerHTML = `
        <div class="flex flex-col items-center w-full cursor-pointer">
            <p class="text-lg font-semibold text-gray-500">${origin}</p>
            <i class="fas fa-arrow-down text-green-600 my-2 text-xl"></i>
            <p class="text-lg font-semibold text-gray-500">${destination}</p>
        </div>
    `;
    return favoriteCard;
}

// Function to check for favorite routes cookie
function checkFavoriteRoutesCookie() {
    const favoriteRoutes = getCookie('favoriteRoutes');
    if (favoriteRoutes) {
        // Parse the cookie value to get the array of favorite routes
        const routes = JSON.parse(favoriteRoutes);
        return routes
    }
    return [];
}

// Function to display favorite routes (implement this based on your UI requirements)
function displayFavoriteRoutes(routes) {
    // You might want to update a specific element in your HTML to show these routes
    const favoriteRoutesContainer = document.getElementById('favouriteRoutesContainer');
    favoriteRoutesContainer.innerHTML = '<h2 class="text-2xl font-bold mb-4 text-gray-800" data-i18n="favoriteSearches">Rotas Favoritas</h2>';
    if (routes.length > 0) {
        routes.forEach(route => {
            favoriteRoutesContainer.appendChild(createFavoriteCard(route));
        });
    }
    else {
        const noFavouriteCard = document.createElement('div');
        noFavouriteCard.classList.add('bg-white', 'rounded-lg', 'shadow-md', 'p-4', 'mb-4', 'flex', 'flex-col', 'items-center', 'cursor-pointer');
        noFavouriteCard.innerHTML = '<p class="text-lg text-gray-500" data-i18n="noFavoriteSearches">Não há rotas favoritas</p>';
        favoriteRoutesContainer.appendChild(noFavouriteCard);
    }
    favoriteRoutesContainer.style.display = 'block';
}

// Renew favorite routes cookie to extend its lifetime
function renewFavoriteRoutesCache() {
    try {
        const favoriteRoutes = getCookie('favoriteRoutes');
        if (favoriteRoutes) {
            // Renew the cookie with fresh 30-day expiration
            setCookie('favoriteRoutes', favoriteRoutes, 30);
            console.log('Favorite routes cache renewed successfully');
        }
    } catch (error) {
        console.error('Failed to renew favorite routes cache:', error);
    }
}

// Initialize favorite routes and renew cache
function initializeFavoriteRoutes() {
    // Renew cache to extend lifetime
    renewFavoriteRoutesCache();
    
    // Display favorite routes
    displayFavoriteRoutes(checkFavoriteRoutesCookie());
}

// Call the function to check for favorite routes when the page loads
document.addEventListener('DOMContentLoaded', initializeFavoriteRoutes);