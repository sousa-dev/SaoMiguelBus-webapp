document.addEventListener("DOMContentLoaded", function() {
    fetchAndPopulateStops();
    
    // Initialize ad removal system
    initializeAdRemoval();
    
    const searchBtn = document.getElementById('btnSubmit')
    searchBtn.addEventListener('click', function(event) {
        event.preventDefault();  // Prevents the default form submission action

        const parameters = getSearchParameters();
        if (parameters) {
            searchRoutes(parameters.origin, parameters.destination, parameters.day, parameters.time);
        }
    });

    loadAdBanner('home');
});

function timeStringToMinutes(timeString) {
    const [hours, minutes] = timeString.split('h').map(Number);
    return hours * 60 + minutes;
}

function getSearchParameters() {
    const originInput = document.getElementById('origin');
    const destinationInput = document.getElementById('destination');
    const day = checkDayType();
    const time = document.getElementById('time').value;

    // Remove any existing error messages
    originInput.setCustomValidity('');
    destinationInput.setCustomValidity('');

    // Check if origin or destination is empty
    if (!originInput.value) {
        originInput.setCustomValidity(t('originRequired')); // Use translation function
        originInput.reportValidity();
        return;
    }
    if (!destinationInput.value) {
        destinationInput.setCustomValidity(t('destinationRequired')); // Use translation function
        destinationInput.reportValidity();
        return;
    }

    return {
        origin: originInput.value,
        destination: destinationInput.value,
        day: day,
        time: time
    };
}

function fetchAndPopulateStops() {
    const url = 'https://api.saomiguelbus.com/api/v2/stops';
    fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',  // Ensure CORS mode is enabled
    }).then(response => response.json())
        .then(data => {
            populateSuggestions(data);
        })
        .catch(error => {
            console.error('Error fetching stops:', error);
            // Load stops from offlineHandler.js
            const stopsList = getStops();
            if (stopsList && stopsList.length > 0) {
                populateSuggestions(stopsList);
            } else {
                console.error('No stops data available from offline.');
                // Optionally, display a message to the user.
                displayNoStopsMessage();
            }
        });
}

/**
 * Populates the suggestion containers with the provided stops list.
 * @param {Array} stopsList - Array of stop objects.
 */
function populateSuggestions(stopsList) {
    const originSuggestions = document.getElementById('origin-suggestions');
    const destinationSuggestions = document.getElementById('destination-suggestions');
    const originStepByStepSuggestions = document.getElementById('originStepByStep-suggestions');
    const destinationStepByStepSuggestions = document.getElementById('destinationStepByStep-suggestions');

    // Clear existing suggestions
    originSuggestions.innerHTML = '';
    destinationSuggestions.innerHTML = '';
    originStepByStepSuggestions.innerHTML = '';
    destinationStepByStepSuggestions.innerHTML = '';

    stopsList.forEach((stop, index) => {
        // Create suggestion for origin
        const originDiv = document.createElement('div');
        originDiv.classList.add('suggestion-item', 'flex', 'flex-col'); // Add flex classes for layout

        // Create a text node for the stop name
        const stopName = document.createElement('span');
        stopName.textContent = stop['name'];
        stopName.classList.add('py-1'); // Add padding for better spacing
        stopName.addEventListener('click', function() {
            document.getElementById('origin').value = this.textContent;
            originSuggestions.innerHTML = ''; // Clear suggestions on selection
        });
        originDiv.appendChild(stopName);
        originSuggestions.appendChild(originDiv);

        // Add a separator line
        if (index < stopsList.length - 1) { // Avoid adding a separator after the last item
            const separatorOrigin = document.createElement('hr');
            separatorOrigin.style.margin = '10px 0'; // Add spacing above and below the hr
            originDiv.appendChild(separatorOrigin);
        }

        // Create suggestion for destination
        const destinationDiv = document.createElement('div');
        destinationDiv.classList.add('suggestion-item', 'flex', 'flex-col'); // Add flex classes for layout

        // Create a text node for the stop name
        const stopNameDest = document.createElement('span');
        stopNameDest.textContent = stop['name'];
        stopNameDest.classList.add('py-1'); // Add padding for better spacing
        stopNameDest.addEventListener('click', function() {
            document.getElementById('destination').value = this.textContent;
            destinationSuggestions.innerHTML = ''; // Clear suggestions on selection
        });
        destinationDiv.appendChild(stopNameDest);
        destinationSuggestions.appendChild(destinationDiv);

        // Add a separator line
        if (index < stopsList.length - 1) { // Avoid adding a separator after the last item
            const separatorDestination = document.createElement('hr');
            separatorDestination.style.margin = '10px 0'; // Add spacing above and below the hr
            destinationDiv.appendChild(separatorDestination);
        }

        // Create suggestion for origin StepByStep
        const originStepByStepDiv = document.createElement('div');
        originStepByStepDiv.classList.add('suggestion-item', 'flex', 'flex-col'); // Add flex classes for layout

        // Create a text node for the stop name
        const stopNameStepByStep = document.createElement('span');
        stopNameStepByStep.textContent = stop['name'];
        stopNameStepByStep.classList.add('py-1'); // Add padding for better spacing
        stopNameStepByStep.addEventListener('click', function() {
            document.getElementById('originStepByStep').value = this.textContent;
            originStepByStepSuggestions.innerHTML = ''; // Clear suggestions on selection
        });
        originStepByStepDiv.appendChild(stopNameStepByStep);
        originStepByStepSuggestions.appendChild(originStepByStepDiv);

        // Add a separator line
        if (index < stopsList.length - 1) { // Avoid adding a separator after the last item
            const separatorOriginStepByStep = document.createElement('hr');
            separatorOriginStepByStep.style.margin = '10px 0'; // Add spacing above and below the hr
            originStepByStepDiv.appendChild(separatorOriginStepByStep);
        }

        // Create suggestion for destination StepByStep
        const destinationStepByStepDiv = document.createElement('div');
        destinationStepByStepDiv.classList.add('suggestion-item', 'flex', 'flex-col'); // Add flex classes for layout

        // Create a text node for the stop name
        const stopNameDestStepByStep = document.createElement('span');
        stopNameDestStepByStep.textContent = stop['name'];
        stopNameDestStepByStep.classList.add('py-1'); // Add padding for better spacing
        stopNameDestStepByStep.addEventListener('click', function() {
            document.getElementById('destinationStepByStep').value = this.textContent;
            destinationStepByStepSuggestions.innerHTML = ''; // Clear suggestions on selection
        });
        destinationStepByStepDiv.appendChild(stopNameDestStepByStep);
        destinationStepByStepSuggestions.appendChild(destinationStepByStepDiv);

        // Add a separator line
        if (index < stopsList.length - 1) { // Avoid adding a separator after the last item
            const separatorDestinationStepByStep = document.createElement('hr');
            separatorDestinationStepByStep.style.margin = '10px 0'; // Add spacing above and below the hr
            destinationStepByStepDiv.appendChild(separatorDestinationStepByStep);
        }
    });

    // Initialize autocomplete functionality
    initializeAutocomplete('origin', originSuggestions);
    initializeAutocomplete('destination', destinationSuggestions);
    initializeAutocomplete('originStepByStep', originStepByStepSuggestions);
    initializeAutocomplete('destinationStepByStep', destinationStepByStepSuggestions);
}

/**
 * Initializes the autocomplete functionality for a given input and suggestions container.
 * @param {string} inputId - The ID of the input element.
 * @param {HTMLElement} suggestionsContainer - The container for suggestion items.
 */
function initializeAutocomplete(inputId, suggestionsContainer) {
    const input = document.getElementById(inputId);
    let currentFocus = -1;

    input.addEventListener('input', function() {
        const filter = this.value.toLowerCase();
        const items = suggestionsContainer.getElementsByClassName('suggestion-item');
        let visibleCount = 0;

        // Clear previous suggestions
        suggestionsContainer.innerHTML = '';

        // Fetch and populate stops based on the current input
        fetchStops(filter).then(stopsList => {
            stopsList.forEach((stop, index) => {
                const stopDiv = document.createElement('div');
                stopDiv.textContent = stop;
                stopDiv.classList.add('suggestion-item');
                stopDiv.addEventListener('click', function() {
                    input.value = this.textContent; // Set the input value to the selected suggestion
                    suggestionsContainer.innerHTML = ''; // Clear suggestions on selection
                });
                suggestionsContainer.appendChild(stopDiv);
                visibleCount++;

                // Add a separator line after each suggestion except the last one
                if (index < stopsList.length - 1) {
                    const separator = document.createElement('hr');
                    separator.style.margin = '10px 0'; // Add spacing above and below the hr
                    suggestionsContainer.appendChild(separator);
                }
            });

            // Show suggestions if there are any visible
            suggestionsContainer.style.display = visibleCount > 0 ? 'block' : 'none';
        }).catch(error => {
            console.error('Error fetching filtered stops:', error);
            // Optionally, handle the error or inform the user
        });
    });

    input.addEventListener('focus', function() {
        // Show suggestions when input is focused
        const items = suggestionsContainer.getElementsByClassName('suggestion-item');
        if (items.length > 0) {
            suggestionsContainer.style.display = 'block';
        }
    });

    input.addEventListener('blur', function() {
        // Hide suggestions when input loses focus
        setTimeout(() => {
            suggestionsContainer.style.display = 'none';
        }, 100);
    });

    // Handle keyboard navigation
    input.addEventListener('keydown', function(e) {
        let items = suggestionsContainer.getElementsByClassName('suggestion-item');
        if (e.keyCode === 40) { // Down arrow
            currentFocus++;
            addActive(items);
        } else if (e.keyCode === 38) { // Up arrow
            currentFocus--;
            addActive(items);
        } else if (e.keyCode === 13) { // Enter
            e.preventDefault();
            if (currentFocus > -1) {
                if (items) items[currentFocus].click();
            }
        }
    });

    function addActive(items) {
        if (!items) return false;
        removeActive(items);
        if (currentFocus >= items.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = items.length - 1;
        items[currentFocus].classList.add('autocomplete-active');
    }

    function removeActive(items) {
        for (let item of items) {
            item.classList.remove('autocomplete-active');
        }
    }
}

function fetchStops(filter) {
    return new Promise((resolve, reject) => {
        const apiData = getAPIData();
        if (apiData && getStops()) {
            const allStops = getStops();
            const filteredStops = allStops.filter(stop => stop.toLowerCase().includes(filter));
            resolve(filteredStops);
        } else {
            reject('No API data available');
        }
    });
}

function searchRoutes(origin, destination, day, time) {
    console.log("Searching routes from", origin, "to", destination);

    // Show loading spinner if applicable
    showLoadingSpinner();

    // Hide the routes container and the no routes message
    document.getElementById('routesContainer').style.display = 'none';
    document.getElementById('noRoutesMessage').style.display = 'none';

    const parameters = getUrlParameters(origin, destination, day, time);
    const url = 'https://api.saomiguelbus.com/api/v2/route?origin=' + encodeURIComponent(origin) 
    + '&destination=' + encodeURIComponent(destination) 
    + '&day=' + encodeURIComponent(day) 
    + '&start=' + encodeURIComponent(time);
    fetchAndDisplayRoutes(url, parameters);

    // postToStats if not in localhost 
    if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
        postToStats(parameters);
    }

    loadAdBanner('home');
}

function fetchAndDisplayRoutes(url, parameters) {
    fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',  // Ensure CORS mode is enabled
    })
    .then(response => response.json())
    .then(data => {
        if (data && data.length > 0) {
            displayRoutes(data, parameters.origin, parameters.destination);
        } else {
            displayNoRoutesMessage(parameters.origin, parameters.destination);
        }
        hideLoadingSpinner();
    })
    .catch(error => {
        // Attempt to fetch routes from offlineHandler.js
        const offlineRoutes = getRoutes(parameters.origin, parameters.destination, parameters.day, parameters.time);
        if (offlineRoutes && offlineRoutes.length > 0) {
            displayRoutes(offlineRoutes, parameters.origin, parameters.destination);
        } else {
            displayNoRoutesMessage(parameters.origin, parameters.destination);
        }
        hideLoadingSpinner();
    });
}

function postToStats(parameters) {
    const url = `https://api.saomiguelbus.com/api/v1/stat?request=get_route&origin=${encodeURIComponent(parameters.origin)}&destination=${encodeURIComponent(parameters.destination)}&time=${encodeURIComponent(parameters.time)}&language=${encodeURIComponent(currentLanguage)}&platform=web&day=${encodeURIComponent(parameters.day)}`;
    fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',  // Ensure CORS mode is enabled
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function displayNoRoutesMessage(origin, destination) {
    const noRoutesDiv = document.getElementById('noRoutesMessage');
    const message = t('noRoutesMessage').replace('{origin}', origin).replace('{destination}', destination);
    noRoutesDiv.innerHTML = `
        <div class="container mx-auto px-4 mt-4" data-umami-event="no-routes-message-displayed">
            <div class="bg-red-100 shadow-md rounded-lg p-6">
                <div class="flex flex-col items-center">
                    <h3 class="text-xl font-semibold mb-2 text-center" data-umami-event="no-routes-message-header">
                        ${message}
                    </h3>
                    <p class="text-gray-600 text-center" data-umami-event="no-routes-message-subtitle">
                        ${t('noRoutesSubtitle')}
                    </p>
                    <button class="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onclick="redirectToStepByStepDirections(event)" data-umami-event="try-directions-button-clicked">
                        ${t('tryDirectionsButton')}
                    </button>
                </div>
            </div>
        </div>
    `;
    noRoutesDiv.style.display = 'block';
}

/**
 * Function to display a user-friendly message when stops cannot be loaded.
 */
function displayNoStopsMessage() {
    const stopsContainer = document.getElementById('stopsContainer'); // Change to appropriate container ID
    stopsContainer.innerHTML = `
        <div class="container mx-auto px-4 mt-4">
            <div class="bg-red-100 shadow-md rounded-lg p-6">
                <div class="flex flex-col items-center">
                    <h3 class="text-xl font-semibold mb-2 text-center">
                        Unable to load stops data.
                    </h3>
                    <p class="text-gray-600 text-center">Please check your internet connection or try again later.</p>
                </div>
            </div>
        </div>
    `;
    stopsContainer.style.display = 'block';
}

// Function to add the current search to favorites
function toggleFavorite() {
    const origin = document.getElementById('origin').value;
    const destination = document.getElementById('destination').value;

    const favorite = {
        origin: origin.toLowerCase(),
        destination: destination.toLowerCase(),
    };

    const favoriteRoutes = JSON.parse(getCookie('favoriteRoutes') || '[]');
    const isFavorite = favoriteRoutes.some(route => 
        route.origin.toLowerCase() === origin.toLowerCase() && 
        route.destination.toLowerCase() === destination.toLowerCase()
    );
    const favoriteIcon = document.getElementById('favorite-icon');
    const favoriteText = document.getElementById('favorite-text');
    if (isFavorite) {
        // Remove from favorites
        const favoriteRoutes = JSON.parse(getCookie('favoriteRoutes') || '[]');
        const updatedRoutes = favoriteRoutes.filter(route => 
            route.origin.toLowerCase() !== origin.toLowerCase() && 
            route.destination.toLowerCase() !== destination.toLowerCase()
        );
        setCookie('favoriteRoutes', JSON.stringify(updatedRoutes), 1000);

        // Update the favorite icon
        favoriteText.textContent = t('addFavorites');
        favoriteIcon.setAttribute('data-umami-event', 'add-favorite');
        favoriteIcon.className = 'far fa-star text-yellow-400 cursor-pointer text-xl';

    } else {
        // Add to favorites
        const favoriteRoutes = JSON.parse(getCookie('favoriteRoutes') || '[]');
        favoriteRoutes.push(favorite);
        setCookie('favoriteRoutes', JSON.stringify(favoriteRoutes), 1000);

        // Update the favorite icon
        favoriteText.textContent = t('removeFavorites');
        favoriteIcon.setAttribute('data-umami-event', 'remove-favorite');
        favoriteIcon.className = 'fas fa-star text-yellow-400 cursor-pointer text-xl';
    }
}


function createFavouriteIcon() {
    const container = document.createElement('div');
    container.className = 'flex justify-between items-center w-full';

    const showFavoritesButton = document.createElement('button');
    showFavoritesButton.textContent = t('showFavorites');
    showFavoritesButton.className = 'flex items-center cursor-pointer text-blue-500 hover:text-blue-700';
    showFavoritesButton.innerHTML = '<i class="fas fa-eye mr-2"></i>' + t('showFavorites');
    showFavoritesButton.onclick = function() {
        // Hide the routesContainer
        document.getElementById('routesContainer').style.display = 'none';
        displayFavoriteRoutes(checkFavoriteRoutesCookie());
    };

    const favoriteContainer = document.createElement('div');
    favoriteContainer.className = 'flex items-center';

    const favoriteText = document.createElement('span');
    favoriteText.id = 'favorite-text';
    favoriteText.className = 'mr-2 text-sm text-gray-500';

    const favoriteIcon = document.createElement('i');
    favoriteIcon.id = 'favorite-icon';
    favoriteIcon.className = 'cursor-pointer text-xl';
    
    const origin = document.getElementById('origin').value;
    const destination = document.getElementById('destination').value;
    const favoriteRoutes = JSON.parse(getCookie('favoriteRoutes') || '[]');
    const isFavorite = favoriteRoutes.some(route => 
        route.origin.toLowerCase() === origin.toLowerCase() && 
        route.destination.toLowerCase() === destination.toLowerCase()
    );
    
    if (isFavorite) {
        favoriteText.textContent = t('removeFavorites');
        favoriteIcon.setAttribute('data-umami-event', 'remove-favorite');
        favoriteIcon.className += ' fas fa-star text-yellow-400';
    } else {
        favoriteText.textContent = t('addFavorites');
        favoriteIcon.setAttribute('data-umami-event', 'add-favorite');
        favoriteIcon.className += ' far fa-star text-yellow-400';
    }

    favoriteIcon.onclick = function(event) {
        event.stopPropagation(); // Prevent the click from bubbling up to the route div
        toggleFavorite();
    };

    favoriteContainer.appendChild(favoriteText);
    favoriteContainer.appendChild(favoriteIcon);

    container.appendChild(showFavoritesButton);
    container.appendChild(favoriteContainer);
    return container;
}

function displayRoutes(routes, originStop, destinationStop) {
    hideLoadingSpinner(); // Hide the loading spinner
    console.log('Display routes: ', routes);
    
    // Show the interstitial ad after search
    showInterstitialAd();
    
    const routesContainer = document.getElementById('routesContainer');
    const favouriteRoutesContainer = document.getElementById('favouriteRoutesContainer');
    const noRoutesMessage = document.getElementById('noRoutesMessage');

    // Clear previous results
    routesContainer.innerHTML = '';
    routesContainer.classList.add('hidden');
    favouriteRoutesContainer.classList.add('hidden');
    noRoutesMessage.classList.add('hidden');

    if (routes.length === 0) {
        noRoutesMessage.classList.remove('hidden');
        return;
    }

    routesContainer.classList.remove('hidden');

    var lastRoute = null;
    let adIndex = 0;
    let routeCount = 0;
    
    // Process routes and insert ads asynchronously
    const processRoutesWithAds = async () => {
        for (let i = 0; i < routes.length; i++) {
            const route = routes[i];
            const routeDiv = await createRouteDiv(route, originStop, destinationStop, lastRoute);
            
            if (routeDiv) {
                routesContainer.appendChild(routeDiv);
                routeCount++;
                lastRoute = routeDiv.lastRouteData;
                
                // Insert ad after every 2 routes
                if (routeCount % 2 === 0 && routeCount < routes.length) {
                    const adBanner = await createInlineAdBanner('home', adIndex++);
                    if (adBanner) {
                        routesContainer.appendChild(adBanner);
                    }
                }
            }
        }
        
        // Final setup after all routes are processed
        if (routesContainer.childElementCount === 0) {
            displayNoRoutesMessage(originStop, destinationStop);
            return;
        }

        routesContainer.style.display = 'block';

        const favouriteRoutesContainer = document.getElementById('favouriteRoutesContainer');
        favouriteRoutesContainer.style.display = 'none';

        const noRoutesMessage = document.getElementById('noRoutesMessage');
        noRoutesMessage.style.display = 'none';

        if (!isOnline()) {
            toggleVisibilityOffline(false);
        }
    };
    
    // Start the async processing
    processRoutesWithAds();
}

// Helper function to create a route div
async function createRouteDiv(route, originStop, destinationStop, lastRoute) {
    let ignoreRoute = false;
    const routeDiv = document.createElement('div');
    routeDiv.className = 'container card w-100 center';
    routeDiv.style.cssText = 'border-radius: 8px; padding: 10px; cursor: pointer;';

    // Parse the string to a JavaScript object
    const stopsObj = stringToJSON(route.stops);
    const prepositions = ['de', 'da', 'do', 'dos', 'das'];

    originStop = originStop.split(' ').map(word => prepositions.includes(word.toLowerCase()) ? word : word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    destinationStop = destinationStop.split(' ').map(word => prepositions.includes(word.toLowerCase()) ? word : word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    // Filter stops to only include stops between the origin and destination
    let stops = {};
    let foundOrigin = false;
    let foundDestination = false;
    let firstStop = null;
    let lastStop = null;
    const replaceSpecialChars = (str) => {
        return str.toLowerCase().replace(/[-áàâãäéèêëíìîïóòôõöúùûüç]/g, match => {
            return 'aaaaaeeeeiiiiooooouuuuc'['áàâãäéèêëíìîïóòôõöúùûüç'.indexOf(match)] || match;
        }).replace(/-/g, '');
    };

    const originWords = replaceSpecialChars(route.origin).split(' ').filter(word => word.trim() !== '' && word !== ' ');
    const destinationWords = replaceSpecialChars(route.destination).split(' ').filter(word => word.trim() !== '' && word !== ' ');
    for (const [stop, time] of Object.entries(stopsObj)) {
        const stopWords = replaceSpecialChars(stop).split(' ').filter(word => word.trim() !== '' && word !== ' ');

        if (foundOrigin) {
            stops[stop] = time;
        } else {
            if (originWords.every(originWord => stopWords.includes(originWord))) {
                foundOrigin = true;
                firstStop = [stop, time];
                stops[stop] = time;
            }
        }

        if (destinationWords.every(destinationWord => stopWords.includes(destinationWord))) {
            foundDestination = true;
            lastStop = [stop, time];
            stops[stop] = time;
            break;
        }
        

        if (foundDestination) {
            if (!foundOrigin) {
                ignoreRoute = true;
                continue;
            }
            break;
        }
    }

    if (!foundOrigin || !foundDestination) {
        return null;
    }

    if (lastRoute) {
        const timeDifference = Math.abs(timeStringToMinutes(firstStop[1]) - timeStringToMinutes(lastRoute.firstStop[1]));
        if (timeDifference < 3) {
            const currentHasC = route.route.includes('C');
            const lastHasC = lastRoute.route.includes('C');
            
            if (currentHasC && !lastHasC) {
                // Prefer the lastRoute over currentRoute, so ignore currentRoute
                return null;
            } else if (!currentHasC && lastHasC) {
                // Replace lastRoute with currentRoute
                // Remove lastRoute's div from DOM
                if (lastRoute.div && lastRoute.div.parentNode) {
                    lastRoute.div.parentNode.removeChild(lastRoute.div);
                }
            } else {
                // Both have 'C' or neither have 'C', keep the first one (lastRoute)
                return null;
            }
        }
    }

    const stopsArray = Object.entries(stops); 
    var transferCount = route.route.split('/').length - 1;
    transferCount = Math.min(transferCount, stopsArray.length - 2);

    const travelTime = calculateTotalTravelTime(firstStop[1], lastStop[1]);
    if (travelTime.hours > 12) {
        ignoreRoute = true;
        return null;
    }

    const type_route = route.route.includes('C') ? 'route' : 'trip';
    const cookieName = `vote_${route.id}_${type_route}`;
    const currentVote = getCookie(cookieName);

    routeDiv.innerHTML = `
        <div id="route-${route.route}" class="bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow duration-300" data-umami-event="route-${route.route}-click">
            <div class="route-header flex items-center justify-between mb-4">
                <div class="flex items-center">
                    <div class="route-icon text-2xl mr-2"><i class="fa-solid fa-bus"></i></div>
                    ${route.route.includes('C') ? `
                        <div class="route-number text-xl font-semibold text-green-600 mr-2">${route.route.replace('C', '')}</div>
                        <div id="confirmationModal" class="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center hidden" onclick="document.getElementById('confirmationModal').classList.add('hidden');" data-umami-event="confirmation-modal-click">
                            <div class="bg-white rounded-lg p-6 w-80 relative" onclick="event.stopPropagation();">
                                <button id="closeConfirmationModal" class="text-gray-600 w-full text-right hover:text-gray-800 transition duration-300 ease-in-out mb-2" onclick="document.getElementById('confirmationModal').classList.add('hidden');" data-umami-event="close-confirmation-modal-click">
                                    <i class="fas fa-times text-xl text-right"></i>
                                </button>
                                <h3 class="text-xl font-semibold text-green-600 mb-3" data-i18n="contactBusCompaniesTitle">Contato das Companhias de Autocarros</h3>
                                <p class="text-gray-700 text-sm" data-i18n="confirmBusCompaniesDescription">
                                Se não tem a certeza da existência desta rota, entre em contato com as companhias de autocarros diretamente para confirmá-la.
                                </p>
                                <ul class="list-disc list-inside text-gray-700 mt-2 space-y-2">
                                    <li>
                                        <strong class="text-sm">Auto Viação Micaelense, Lda.</strong>
                                        <br>
                                        <span class="text-gray-500 text-xs ml-4">Telefone: <a href="tel:+351296301358" class="text-blue-500 hover:underline">+351 296 301 358</a></span>
                                    </li>
                                    <li>
                                        <strong class="text-sm">Varela & Companhia, Lda.</strong>
                                        <br>
                                        <span class="text-gray-500 text-xs ml-4">Telefone: <a href="tel:+351296301800" class="text-blue-500 hover:underline">+351 296 301 800</a></span>
                                    </li>
                                    <li>
                                        <strong class="text-sm">Caetano Raposo e Pereiras, Lda.</strong>
                                        <br>
                                        <span class="text-gray-500 text-xs ml-4">Telefone: <a href="tel:+351296304260" class="text-blue-500 hover:underline">+351 296 304 260</a></span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div class="confirmation-banner bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-1 mb-1 cursor-pointer flex justify-between items-center" onclick="document.getElementById('confirmationModal').classList.remove('hidden');" data-umami-event="confirmation-banner-click">
                            <div>
                                <p class="font-bold text-xs">${t('confirmationRequired')}</p>
                                <p class="text-xs">${t('confirmationMessage')}</p>
                            </div>
                            <i class="fas fa-phone-alt text-yellow-700 text-lg mr-2"></i>
                        </div>
                    ` : ''}
                </div>
                <div class="text-sm text-gray-600">
                    ${transferCount > 0 ? `<i class="fa fa-shuffle mr-1"></i> ${transferCount} ${transferCount === 1 ? t('transfer') : t('transfers')}` : ''}
                </div>
            </div>
            <div class="stops-summary flex flex-col">
                <div class="time-line flex items-center justify-between mb-2">
                    <div class="time text-2xl font-bold text-center w-1/4">${firstStop[1]}</div>
                    <div class="route-line flex-grow mx-4 relative">
                        <div class="absolute inset-0 flex items-center">
                            <div class="h-0.5 w-full bg-gray-300 relative dashed-line">
                                <div class="absolute inset-0 flex items-center justify-center">
                                    <span class="bg-white px-2 text-sm font-medium text-gray-500 travel-time rounded border">
                                        ${travelTime.formatted}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="time text-2xl font-bold text-center w-1/4">${lastStop[1]}</div>
                </div>
                <div class="stops flex justify-between">
                    <div class="start-stop w-1/4 pr-2">
                        <div class="location text-center">
                            <div class="text-base">${firstStop[0].split(' - ')[0]}</div>
                            <div class="text-sm text-gray-600">${firstStop[0].split(' - ').slice(1).join(' - ')}</div>
                        </div>
                    </div>
                    <div class="end-stop w-1/4 pl-2">
                        <div class="location text-center">
                            <div class="text-base">${lastStop[0].split(' - ')[0]}</div>
                            <div class="text-sm text-gray-600">${lastStop[0].split(' - ').slice(1).join(' - ')}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div id="${route.id}-likes-dislikes" class="mt-4 flex items-center justify-between" data-umami-event="route-summary" data-offline="false">
                <button class="dislike-button flex items-center ${currentVote === 'dislike' ? 'text-red-700' : 'text-gray-500'} hover:text-red-700" onclick="dislike_route(${route.id}, '${route.route}', this)" data-umami-event="dislike-button-click" data-umami-event="dislike-button-interaction">
                    <i class="fas fa-thumbs-down"></i>
                </button>
                <span id="dislikes-percent" class="text-gray-500 text-xs mr-2">${route.dislikes_percent}%</span>
                <button class="expand-stops flex items-center justify-center text-blue-500 hover:text-blue-700 text-base py-2" data-umami-event="expand-stops-click" data-umami-event="expand-stops-interaction">
                    <span class="mr-2">${t('clickToSeeDetails')}</span>
                    <span class="iconify transform transition-transform duration-300 text-xl" data-icon="mdi:chevron-down"></span>
                </button>
                <span id="likes-percent" class="text-gray-500 text-xs ml-2">${route.likes_percent}%</span>
                <button class="like-button flex items-center ${currentVote === 'like' ? 'text-green-700' : 'text-gray-500'} hover:text-green-700" onclick="like_route(${route.id}, '${route.route}', this)" data-umami-event="like-button-click" data-umami-event="like-button-interaction">
                    <i class="fas fa-thumbs-up"></i>
                </button>
            </div>
            <div class="all-stops hidden mt-4 bg-gray-50 rounded-lg p-3">
                <h4 class="font-semibold mb-2 text-gray-700">${t('allStops')}</h4>
                <div class="space-y-2">
                    ${stopsArray.map(([stop, time]) => `
                        <div class="flex justify-between items-center py-1 border-b border-gray-200 last:border-b-0">
                            <span class="text-sm text-gray-600">${stop}</span>
                            <span class="text-sm font-medium text-gray-800">${time}</span>
                        </div>
                    `).join('')}
                </div>
                <!-- 
                    <div class="mt-3 text-xs text-gray-500">
                        ${(() => {
                            const routeNumbers = route.route.split('/').map(num => parseInt(num));
                            const operators = new Set();
                            
                            routeNumbers.forEach(routeNumber => {
                                if (routeNumber >= 200 && routeNumber < 300) {
                                    operators.add('Auto Viação Micaelense');
                                } else if (routeNumber >= 300 && routeNumber < 400) {
                                    operators.add('Varela & Lda.');
                                } else if (routeNumber >= 100 && routeNumber < 200) {
                                    operators.add('Caetano Raposo e Pereiras Lda.');
                                }
                            });
                            
                            if (operators.size > 0) {
                                return t('operatedBy') + ' ' + Array.from(operators).join(t('and'));
                            } else {
                                return '';
                            }
                        })()}
                    </div> 
                -->
            </div>
            <div class="flex space-x-2 mt-2" data-offline="false">
                <button type="submit" class="flex-grow bg-green-500 text-white py-2 rounded-full hover:bg-green-600 transition duration-300 ease-in-out" data-i18n="directionsButton" data-umami-event="directions-button-click"
                onclick="redirectToStepByStepDirections(event)">
                    ${t('directionsButton')} <i class="fas fa-route"></i>
                </button>
            </div>
            
            <!-- Premium Tracking Buttons -->
            <div id="trackingButtons-${route.id}" class="mt-2 space-y-2" style="display: none;">
                <!-- Tracking buttons will be inserted here for premium users -->
            </div>
    </div>
    `;

    // Function to toggle route details
    function toggleRouteDetails(routeDiv) {
        const allStopsDiv = routeDiv.querySelector('.all-stops');
        const expandButton = routeDiv.querySelector('.expand-stops');
        const icon = expandButton.querySelector('.iconify');
        
        allStopsDiv.classList.toggle('hidden');
        icon.classList.toggle('rotate-180');
        
        // Smooth transition for expanding/collapsing
        if (allStopsDiv.classList.contains('hidden')) {
            allStopsDiv.style.maxHeight = '0px';
        } else {
            allStopsDiv.style.maxHeight = allStopsDiv.scrollHeight + 'px';
        }
    }

    // Add click event to expand/collapse route details
    routeDiv.addEventListener('click', function(event) {
        // Prevent the click event from triggering on buttons inside the card
        if (event.target.tagName === 'BUTTON' || event.target.closest('button')) {
            return;
        }
        
        toggleRouteDetails(this);
    });

    // Add click event to the expand button
    const expandButton = routeDiv.querySelector('.expand-stops');
    expandButton.addEventListener('click', function(event) {
        event.stopPropagation();
        toggleRouteDetails(routeDiv);
    });

    // Update the CSS
    const style = document.createElement('style');
    style.textContent = `
        .dashed-line {
            background-image: linear-gradient(to right, #CBD5E0 50%, transparent 50%);
            background-size: 8px 1px;
            background-repeat: repeat-x;
        }
        .travel-time {
            position: relative;
        }
        .travel-time::before,
        .travel-time::after {
            content: '';
            position: absolute;
            top: 50%;
            width: 20px;
            height: 1px;
            background-image: linear-gradient(to right, #CBD5E0 50%, transparent 50%);
            background-size: 4px 1px;
            background-repeat: repeat-x;
        }
        .travel-time::before {
            right: 100%;
            margin-right: 5px;
        }
        .travel-time::after {
            left: 100%;
            margin-left: 5px;
        }
        .all-stops {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease-out;
        }
        .all-stops:not(.hidden) {
            max-height: 1000px; /* Adjust this value as needed */
        }
    `;
    document.head.appendChild(style);

    if (ignoreRoute) {
        return null;
    }
    
    // Add tracking buttons for premium users
    if (typeof adRemovalState !== 'undefined' && adRemovalState && adRemovalState.isActive) {
        const trackingButtonsContainer = routeDiv.querySelector(`#trackingButtons-${route.id}`);
        if (trackingButtonsContainer) {
            trackingButtonsContainer.style.display = 'block';
            
            const routeData = {
                routeId: route.id,
                routeNumber: route.route,
                origin: originStop,
                destination: destinationStop,
                allStops: stringToJSON(route.stops),
                searchDay: checkDayType(),
                type: 'route'
            };
            
            // Create tracking button
            const trackingButton = BusTrackingUI.createTrackingButton(routeData);
            trackingButton.className = 'w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300 text-sm';
            
            // Create pin route button
            const pinButton = BusTrackingUI.createPinRouteButton(routeData);
            pinButton.className = 'w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition duration-300 text-sm';
            
            // Create button container with flex layout
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'flex space-x-2';
            buttonContainer.appendChild(trackingButton);
            buttonContainer.appendChild(pinButton);
            
            trackingButtonsContainer.appendChild(buttonContainer);
        }
    }
    
    // Store route data for comparison
    routeDiv.lastRouteData = { firstStop, lastStop, route: route.route, div: routeDiv };
    
    return routeDiv;
}

function loadAdBanner(on) {
    // Check if user has active premium subscription
    if (adRemovalState && adRemovalState.isActive) {
        console.log('Ads hidden for premium user');
        // Hide all ad elements for premium users
        const adElements = [
            'homeAdBanner', 
            'routesAdBanner', 
            'bottomStickyAd', 
            'toursAdBanner'
        ];
        adElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) element.style.display = 'none';
        });
        return;
    }
    
    // Show ad elements for non-premium users
    const adElements = [
        'homeAdBanner', 
        'routesAdBanner', 
        'bottomStickyAd', 
        'toursAdBanner'
    ];
    adElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) element.style.display = 'block';
    });
    
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        return; // Do nothing if the host is localhost or 127.0.0.1
    }
    const apiUrl = `https://api.saomiguelbus.com/api/v1/ad?on=${on}&platform=web`;  // Replace with your API endpoint

    fetch(apiUrl)
        .then(response => { 
            if (response.ok) {
                return response.json();
            } else {
                console.warn('There are no ad banners available to display')
            }
        })
        .then(ad => {
            if (ad) {
                let hrefValue;
                if (ad.action === 'directions') {
                    hrefValue = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ad.target)}`; // Directions URL
                } else {
                    hrefValue = ad.target;
                }
                // Assuming ad object has properties like 'target', 'media', 'entity', 'id'
                const adBannerHTML = `
                    <div class="container mx-auto" id="tm-section-2" data-umami-event="ad-banner-display">
                        <span class="absolute top-0 left-0 bg-green-500 text-white font-bold text-[10px] px-1 py-0.5 rounded-br-lg z-10">AD</span>
                        <div class="flex justify-center">
                            <div class="w-full ">
                                <div class="ad-banner text-center p-1 relative">
                                    <a href="${hrefValue}" target="_blank" id='ad-clickable' data-umami-event="ad-click">
                                        <img src="${ad.media}" alt="${ad.entity}" class="w-full h-auto rounded-lg" id="ad-image" data-id="${ad.id}" data-umami-event="ad-image-view">
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>`;

                const viewCountElement = document.getElementById('viewCount');
                const dayCountElement = document.getElementById('dayCount');

                if (viewCountElement && ad.seen) {
                    viewCountElement.textContent = '3000+';
                }

                if (dayCountElement && ad.start) {
                    // const start_date = ad.start;
                    // const daysAgo = Math.floor((new Date() - new Date(start_date)) / (1000 * 60 * 60 * 24));
                    
                    dayCountElement.textContent = 3//daysAgo || 1; // Update days
                }

                // Insert the ad banner into the DOM
                document.getElementById('placeHolderForAd').innerHTML = adBannerHTML;

                // After inserting the ad banner into the DOM
                const adImage = document.getElementById("ad-image");
                if (adImage) {
                    document.getElementById('ad-clickable').addEventListener('click', function(event) {
                        const adId = adImage.getAttribute("data-id");
                        const URL = "https://api.saomiguelbus.com/api/v1/ad/click?id="+ encodeURIComponent(adId);
                        fetch(URL, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            mode: 'cors',
                        })
                        .then(response => response.json())
                        .then(data => console.log(data))
                        .catch(error => console.error(error));
                    });
                }
            }
        })
        .catch(error => console.error('Error loading ad banner:', error));
}

// Function to create inline ad banners for insertion between results
function createInlineAdBanner(on, adIndex) {
    return new Promise((resolve, reject) => {
        // Check if user has active premium subscription
        if (adRemovalState && adRemovalState.isActive) {
            console.log('Ads hidden for premium user');
            resolve(null);
            return;
        }
        
        if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
            resolve(null);
            return;
        }

        const apiUrl = `https://api.saomiguelbus.com/api/v1/ad?on=${on}&platform=web`;

        fetch(apiUrl)
            .then(response => { 
                if (response.ok) {
                    return response.json();
                } else {
                    console.warn('There are no ad banners available to display');
                    resolve(null);
                }
            })
            .then(ad => {
                if (ad) {
                    let hrefValue;
                    if (ad.action === 'directions') {
                        hrefValue = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ad.target)}`;
                    } else {
                        hrefValue = ad.target;
                    }

                    const adDiv = document.createElement('div');
                    adDiv.className = 'inline-ad-banner my-4 mx-auto max-w-md';
                    adDiv.innerHTML = `
                        <div class="container mx-auto relative" data-umami-event="inline-ad-banner-display-${adIndex}">
                            <span class="absolute top-0 left-0 bg-green-500 text-white font-bold text-[10px] px-1 py-0.5 rounded-br-lg z-10">AD</span>
                            <div class="flex justify-center">
                                <div class="w-full">
                                    <div class="ad-banner text-center p-1 relative">
                                        <a href="${hrefValue}" target="_blank" class="inline-ad-clickable" data-ad-id="${ad.id}" data-umami-event="inline-ad-click-${adIndex}">
                                            <img src="${ad.media}" alt="${ad.entity}" class="w-full h-auto rounded-lg inline-ad-image" data-id="${ad.id}" data-umami-event="inline-ad-image-view-${adIndex}">
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="text-center mt-2">
                            <button onclick="showPricingModal()" 
                                    class="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full border border-gray-300 transition duration-200"
                                    data-umami-event="inline-ad-remove-ads-${adIndex}">
                                <i class="fas fa-crown text-yellow-500 mr-1"></i>
                                <span>${t('getRidOfAds', 'Get rid of ads')}</span>
                            </button>
                        </div>`;

                    // Add click tracking
                    const adClickable = adDiv.querySelector('.inline-ad-clickable');
                    if (adClickable) {
                        adClickable.addEventListener('click', function(event) {
                            const adId = this.getAttribute("data-ad-id");
                            const URL = "https://api.saomiguelbus.com/api/v1/ad/click?id=" + encodeURIComponent(adId);
                            fetch(URL, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                mode: 'cors',
                            })
                            .then(response => response.json())
                            .then(data => console.log(data))
                            .catch(error => console.error(error));
                        });
                    }

                    resolve(adDiv);
                } else {
                    resolve(null);
                }
            })
            .catch(error => {
                console.error('Error loading inline ad banner:', error);
                resolve(null);
            });
    });
}

function stringToJSON(string) {
    if (typeof string !== 'string') {
        console.warn('stringToJSON: input is not a string');
        return;
    }
    const validJsonString = string.replace(/'/g, '"');
    // Parse the string to a JavaScript object
    const jsonObj = JSON.parse(validJsonString);
    return jsonObj;
}

function getUrlParameters(origin, destination, day, time) {
    const parameters = {
        'origin': origin,
        'destination': destination,
        'day': day,
        'time': time
    };
    //00:00 -> 00h00
    parameters.time = parameters.time.replace(':', 'h');

    // TODO: format the origin and destination strings to remove spaces and special characters

    return parameters;
}

// Add this function to handle the "Directions" button click
function showDirections(destination) {
    const encodedDestination = encodeURIComponent(destination);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedDestination}`, '_blank');
}

function clearInput(inputId) {
    const inputField = document.getElementById(inputId);
    inputField.value = ''; // Clear the input field
    const suggestionsContainer = document.getElementById(inputId + '-suggestions');
    suggestionsContainer.innerHTML = ''; // Clear suggestions
    suggestionsContainer.style.display = 'none'; // Hide suggestions
}

function like_route(trip_id, route_number, routeElement) {
    const type_route = route_number.includes('C') ? 'route' : 'trip';
    const cookieName = `vote_${trip_id}_${type_route}`;
    const currentVote = getCookie(cookieName);

    let requestCount = 1;
    if (currentVote === 'dislike') {
        requestCount = 2; // Cancel out previous dislike and add a new like
    } else if (currentVote === 'like') {
        requestCount = -1; // Remove the previous like
    }

    fetch(`https://api.saomiguelbus.com/api/v2/like/${trip_id}?type_route=${type_route}&count=${requestCount}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        mode: 'cors',
    })
    .then(response => response.json())
    .then(data => {
        if (data.likes_percent !== undefined && data.dislikes_percent !== undefined) {
            updateRouteLikesDislikes(trip_id+'-likes-dislikes', data.likes_percent, data.dislikes_percent);
            if (currentVote === 'like') {
                deleteCookie(cookieName);
                updateVoteButtonStyles(trip_id+'-likes-dislikes', 'none');
            } else {
                setCookie(cookieName, 'like', 365); // Set cookie for 1 year
                updateVoteButtonStyles(trip_id+'-likes-dislikes', 'like');
            }
        }
    })
    .catch(error => {
        console.error('Error liking route:', error);
    });
}

function dislike_route(trip_id, route_number, routeElement) {
    const type_route = route_number.includes('C') ? 'route' : 'trip';
    const cookieName = `vote_${trip_id}_${type_route}`;
    const currentVote = getCookie(cookieName);

    let requestCount = 1;
    if (currentVote === 'like') {
        requestCount = 2; // Cancel out previous like and add a new dislike
    } else if (currentVote === 'dislike') {
        requestCount = -1; // Remove the previous dislike
    }

    fetch(`https://api.saomiguelbus.com/api/v2/dislike/${trip_id}?type_route=${type_route}&count=${requestCount}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        mode: 'cors',
    })
    .then(response => response.json())
    .then(data => {
        if (data.likes_percent !== undefined && data.dislikes_percent !== undefined) {
            updateRouteLikesDislikes(trip_id+'-likes-dislikes', data.likes_percent, data.dislikes_percent);
            if (currentVote === 'dislike') {
                deleteCookie(cookieName);
                updateVoteButtonStyles(trip_id+'-likes-dislikes', 'none');
            } else {
                setCookie(cookieName, 'dislike', 365); // Set cookie for 1 year
                updateVoteButtonStyles(trip_id+'-likes-dislikes', 'dislike');
            }
        }
    })
    .catch(error => {
        console.error('Error disliking route:', error);
    });
}

function updateRouteLikesDislikes(id, likes_percent, dislikes_percent) {
    const routeElement = document.getElementById(id);
    if (routeElement) {
        const likesElement = routeElement.querySelector('#likes-percent');
        const dislikesElement = routeElement.querySelector('#dislikes-percent');
        if (likesElement) likesElement.textContent = `${likes_percent}%`;
        if (dislikesElement) dislikesElement.textContent = `${dislikes_percent}%`;
    }
}

function updateVoteButtonStyles(id, voteType) {
    const routeElement = document.getElementById(id);
    if (routeElement) {
        const likeButton = routeElement.querySelector('.like-button');
        const dislikeButton = routeElement.querySelector('.dislike-button');

        if (voteType === 'like') {
            likeButton.classList.add('text-green-700');
            likeButton.classList.remove('text-gray-500');
            dislikeButton.classList.remove('text-red-700');
            dislikeButton.classList.add('text-gray-500');
        } else if (voteType === 'dislike') {
            dislikeButton.classList.add('text-red-700');
            dislikeButton.classList.remove('text-gray-500');
            likeButton.classList.remove('text-green-700');
            likeButton.classList.add('text-gray-500');
        } else if (voteType === 'none') {
            likeButton.classList.remove('text-green-700');
            likeButton.classList.add('text-gray-500');
            dislikeButton.classList.remove('text-red-700');
            dislikeButton.classList.add('text-gray-500');
        }
    }
}